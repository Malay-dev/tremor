"""Semantic Extractor — uses Gemini Flash to extract structured entities from documents."""

import asyncio
import logging
from datetime import UTC, datetime

from google import genai
from google.genai import types
from pydantic import BaseModel, Field

from tremor.models.entities import (
    Attribute,
    AttributeType,
    Endpoint,
    Entity,
    SemanticContract,
)

logger = logging.getLogger(__name__)

# Retry config
_MAX_RETRIES = 3
_RETRY_DELAYS = [2, 5, 10]  # seconds between retries


# --- LLM output schema (simplified for reliable structured output) ---


class LLMAttribute(BaseModel):
    """Attribute as extracted by the LLM."""

    name: str
    type: str  # Will be mapped to AttributeType
    required: bool = True
    description: str | None = None
    allowed_values: list[str] | None = None
    constraints: list[str] = Field(default_factory=list)
    deprecated: bool = False


class LLMEntity(BaseModel):
    """Entity as extracted by the LLM."""

    name: str
    kind: str
    description: str | None = None
    attributes: list[LLMAttribute] = Field(default_factory=list)
    relationships: list[str] = Field(default_factory=list)


class LLMEndpoint(BaseModel):
    """Endpoint as extracted by the LLM."""

    path: str
    method: str
    description: str | None = None
    parameters: list[LLMAttribute] = Field(default_factory=list)
    response_fields: list[LLMAttribute] = Field(default_factory=list)
    auth_required: bool = True
    deprecated: bool = False


class LLMExtractionResult(BaseModel):
    """Full extraction result from the LLM."""

    application: str
    version: str | None = None
    entities: list[LLMEntity] = Field(default_factory=list)
    endpoints: list[LLMEndpoint] = Field(default_factory=list)
    auth_flows: list[str] = Field(default_factory=list)
    rate_limits: list[str] = Field(default_factory=list)
    deprecation_notices: list[str] = Field(default_factory=list)


def _dereference_schema(schema: dict) -> dict:
    """Recursively resolve all $ref references in a JSON schema, inlining $defs."""
    defs = schema.pop("$defs", {})

    def _resolve(obj: object) -> object:
        if isinstance(obj, dict):
            if "$ref" in obj:
                ref_path = obj["$ref"]  # e.g. "#/$defs/LLMAttribute"
                ref_name = ref_path.split("/")[-1]
                resolved = defs.get(ref_name, {})
                # Resolve recursively in case of nested $refs
                return _resolve(resolved)
            return {k: _resolve(v) for k, v in obj.items()}
        if isinstance(obj, list):
            return [_resolve(item) for item in obj]
        return obj

    return _resolve(schema)


# Build the flat schema once at import time
_EXTRACTION_SCHEMA = _dereference_schema(LLMExtractionResult.model_json_schema())


# --- Extraction prompt ---

EXTRACTION_PROMPT = """You are a semantic extraction engine. Analyze the following document and extract all structured information about APIs, entities, endpoints, and contracts.

For each entity (API object, data model, resource), extract:
- name: The entity name (e.g., "User", "Account", "Order")
- kind: The type — one of: API_OBJECT, ENDPOINT, WORKFLOW, DATA_MODEL, RESOURCE, CONFIGURATION
- description: Brief description of what it represents
- attributes: All fields/properties with their types, constraints, and whether they're required
- relationships: References to other entities

For each endpoint, extract:
- path: The URL path (e.g., "/v2/users/{id}")
- method: HTTP method (GET, POST, PUT, DELETE, PATCH)
- parameters: Input parameters with types
- response_fields: Response body fields with types
- auth_required: Whether authentication is needed
- deprecated: Whether it's marked as deprecated

For attribute types, use one of: STRING, INTEGER, FLOAT, BOOLEAN, ENUM, ARRAY, OBJECT, DATE, DATETIME, URL, UNKNOWN

Also extract:
- auth_flows: Authentication methods mentioned (e.g., "OAuth2", "API Key", "Bearer Token")
- rate_limits: Any rate limiting information
- deprecation_notices: Any deprecation warnings or sunset dates

Be thorough. Extract everything that describes the API contract — fields, types, constraints, enums, required vs optional, deprecated markers.

DOCUMENT:
{document}"""


# --- Extractor service ---


class SemanticExtractor:
    """Extracts SemanticContracts from raw documents using Gemini Flash."""

    def __init__(self, api_key: str, model: str = "gemini-2.5-flash"):
        self.client = genai.Client(api_key=api_key)
        self.model = model

    async def extract(self, raw_content: str, source_url: str, application: str) -> SemanticContract:
        """
        Extract a SemanticContract from raw document content.

        Args:
            raw_content: The raw HTML/markdown/text of the document
            source_url: Where this document came from
            application: The application name (e.g., "Salesforce")

        Returns:
            A fully populated SemanticContract
        """
        logger.info(f"Extracting semantic contract from {source_url} ({len(raw_content)} chars)")

        prompt = EXTRACTION_PROMPT.replace("{document}", raw_content[:50_000])  # Truncate for context window

        response = await self._call_with_retry(prompt)

        # Parse the structured response
        result = LLMExtractionResult.model_validate_json(response.text)

        # Convert to our domain models
        contract = self._to_contract(result, source_url, application)
        logger.info(
            f"Extracted {len(contract.entities)} entities, "
            f"{len(contract.endpoints)} endpoints from {source_url}"
        )
        return contract

    async def _call_with_retry(self, prompt: str):
        """Call Gemini with exponential backoff retry on transient errors."""
        for attempt in range(_MAX_RETRIES):
            try:
                response = self.client.models.generate_content(
                    model=self.model,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json",
                        response_json_schema=_EXTRACTION_SCHEMA,
                        temperature=0.1,
                    ),
                )
                return response
            except Exception as e:
                error_str = str(e)
                is_retryable = any(
                    keyword in error_str
                    for keyword in ("503", "UNAVAILABLE", "429", "RESOURCE_EXHAUSTED", "overloaded", "high demand")
                )
                if is_retryable and attempt < _MAX_RETRIES - 1:
                    delay = _RETRY_DELAYS[attempt]
                    logger.warning(
                        f"Gemini call failed (attempt {attempt + 1}/{_MAX_RETRIES}): {error_str[:100]}. "
                        f"Retrying in {delay}s..."
                    )
                    await asyncio.sleep(delay)
                else:
                    raise

    def _to_contract(
        self, result: LLMExtractionResult, source_url: str, application: str
    ) -> SemanticContract:
        """Convert LLM extraction result to a SemanticContract."""
        return SemanticContract(
            source_url=source_url,
            application=application,
            version=result.version,
            extracted_at=datetime.now(UTC).isoformat(),
            entities=[self._to_entity(e) for e in result.entities],
            endpoints=[self._to_endpoint(ep) for ep in result.endpoints],
            auth_flows=result.auth_flows,
            rate_limits=result.rate_limits,
            deprecation_notices=result.deprecation_notices,
        )

    def _to_entity(self, llm_entity: LLMEntity) -> Entity:
        """Convert an LLM entity to our Entity model."""
        return Entity(
            name=llm_entity.name,
            kind=llm_entity.kind,
            description=llm_entity.description,
            attributes=[self._to_attribute(a) for a in llm_entity.attributes],
            relationships=llm_entity.relationships,
        )

    def _to_endpoint(self, llm_ep: LLMEndpoint) -> Endpoint:
        """Convert an LLM endpoint to our Endpoint model."""
        return Endpoint(
            path=llm_ep.path,
            method=llm_ep.method.upper(),
            description=llm_ep.description,
            parameters=[self._to_attribute(p) for p in llm_ep.parameters],
            response_fields=[self._to_attribute(f) for f in llm_ep.response_fields],
            auth_required=llm_ep.auth_required,
            deprecated=llm_ep.deprecated,
        )

    def _to_attribute(self, llm_attr: LLMAttribute) -> Attribute:
        """Convert an LLM attribute to our Attribute model."""
        # Map the string type to our enum, falling back to UNKNOWN
        try:
            attr_type = AttributeType(llm_attr.type.upper())
        except ValueError:
            attr_type = AttributeType.UNKNOWN

        return Attribute(
            name=llm_attr.name,
            type=attr_type,
            required=llm_attr.required,
            description=llm_attr.description,
            allowed_values=llm_attr.allowed_values,
            constraints=llm_attr.constraints,
            deprecated=llm_attr.deprecated,
        )
