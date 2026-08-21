"""Change Engine — compares two SemanticContracts and emits ChangeEvents."""

import logging

from tremor.models.entities import Attribute, Entity, SemanticContract
from tremor.models.event import (
    ChangeCategory,
    ChangeEvent,
    EntityKind,
    EntityRef,
    Evidence,
    SemanticShift,
    Severity,
    ValueSnapshot,
)

logger = logging.getLogger(__name__)


class SemanticDiffer:
    """
    Compares two SemanticContracts and produces ChangeEvents.

    This is the core of Tremor — semantic diff, not text diff.
    It understands what changed in terms of the shift taxonomy.
    """

    def diff(self, before: SemanticContract, after: SemanticContract) -> list[ChangeEvent]:
        """
        Compare two contracts and return all detected semantic changes.

        Args:
            before: The previous version of the contract
            after: The new version of the contract

        Returns:
            List of ChangeEvents describing what changed semantically
        """
        events: list[ChangeEvent] = []

        # Compare entities
        events.extend(self._diff_entities(before, after))

        # Compare endpoints
        events.extend(self._diff_endpoints(before, after))

        # Compare document-level metadata
        events.extend(self._diff_metadata(before, after))

        logger.info(
            f"Diff produced {len(events)} change events "
            f"({before.application} {before.version} → {after.version})"
        )
        return events

    # --- Entity diffing ---

    def _diff_entities(self, before: SemanticContract, after: SemanticContract) -> list[ChangeEvent]:
        events: list[ChangeEvent] = []

        before_map = {e.name: e for e in before.entities}
        after_map = {e.name: e for e in after.entities}

        # Removed entities
        for name, entity in before_map.items():
            if name not in after_map:
                events.append(self._make_event(
                    before=before, after=after,
                    shift=SemanticShift.BREAKING_REMOVAL,
                    category=ChangeCategory.SCHEMA,
                    entity_ref=EntityRef(kind=EntityKind.OBJECT, path=name),
                    before_val=ValueSnapshot(value=name, semantic_type="ENTITY"),
                    after_val=ValueSnapshot(value="<removed>", semantic_type="ABSENT"),
                    severity=Severity.CRITICAL,
                    confidence=0.95,
                    reasoning=f"Entity '{name}' was removed entirely. Consumers depending on it will break.",
                    evidence=Evidence(
                        before_snippet=f"Entity: {name} ({entity.kind})",
                        after_snippet="<not present>",
                    ),
                ))

        # New entities (informational)
        for name, entity in after_map.items():
            if name not in before_map:
                events.append(self._make_event(
                    before=before, after=after,
                    shift=SemanticShift.SCOPE_WIDENED,
                    category=ChangeCategory.SCHEMA,
                    entity_ref=EntityRef(kind=EntityKind.OBJECT, path=name),
                    before_val=ValueSnapshot(value="<not present>", semantic_type="ABSENT"),
                    after_val=ValueSnapshot(value=name, semantic_type="ENTITY"),
                    severity=Severity.INFO,
                    confidence=0.9,
                    reasoning=f"New entity '{name}' added. May indicate new capabilities.",
                    evidence=Evidence(
                        before_snippet="<not present>",
                        after_snippet=f"Entity: {name} ({entity.kind})",
                    ),
                ))

        # Changed entities — compare attributes
        for name, before_entity in before_map.items():
            if name in after_map:
                events.extend(
                    self._diff_attributes(before, after, before_entity, after_map[name])
                )

        return events

    def _diff_attributes(
        self,
        before_contract: SemanticContract,
        after_contract: SemanticContract,
        before_entity: Entity,
        after_entity: Entity,
    ) -> list[ChangeEvent]:
        events: list[ChangeEvent] = []
        entity_name = before_entity.name

        before_attrs = {a.name: a for a in before_entity.attributes}
        after_attrs = {a.name: a for a in after_entity.attributes}

        # Removed attributes
        for attr_name, attr in before_attrs.items():
            if attr_name not in after_attrs:
                events.append(self._make_event(
                    before=before_contract, after=after_contract,
                    shift=SemanticShift.BREAKING_REMOVAL,
                    category=ChangeCategory.SCHEMA,
                    entity_ref=EntityRef(
                        kind=EntityKind.FIELD, path=f"{entity_name}.{attr_name}", parent=entity_name
                    ),
                    before_val=ValueSnapshot(value=f"{attr.type}", semantic_type=str(attr.type)),
                    after_val=ValueSnapshot(value="<removed>", semantic_type="ABSENT"),
                    severity=Severity.HIGH,
                    confidence=0.9,
                    reasoning=f"Field '{entity_name}.{attr_name}' removed. Consumers reading this field will fail.",
                    evidence=Evidence(
                        before_snippet=f"{attr_name}: {attr.type} (required={attr.required})",
                        after_snippet="<not present>",
                    ),
                ))

        # New attributes
        for attr_name, attr in after_attrs.items():
            if attr_name not in before_attrs:
                severity = Severity.MEDIUM if attr.required else Severity.LOW
                events.append(self._make_event(
                    before=before_contract, after=after_contract,
                    shift=SemanticShift.DEPENDENCY_ADDED if attr.required else SemanticShift.SCOPE_WIDENED,
                    category=ChangeCategory.SCHEMA,
                    entity_ref=EntityRef(
                        kind=EntityKind.FIELD, path=f"{entity_name}.{attr_name}", parent=entity_name
                    ),
                    before_val=ValueSnapshot(value="<not present>", semantic_type="ABSENT"),
                    after_val=ValueSnapshot(value=f"{attr.type}", semantic_type=str(attr.type)),
                    severity=severity,
                    confidence=0.85,
                    reasoning=(
                        f"New required field '{entity_name}.{attr_name}' added. Existing integrations must provide it."
                        if attr.required
                        else f"New optional field '{entity_name}.{attr_name}' added."
                    ),
                    evidence=Evidence(
                        before_snippet="<not present>",
                        after_snippet=f"{attr_name}: {attr.type} (required={attr.required})",
                    ),
                ))

        # Changed attributes
        for attr_name, before_attr in before_attrs.items():
            if attr_name in after_attrs:
                events.extend(
                    self._diff_single_attribute(
                        before_contract, after_contract,
                        entity_name, before_attr, after_attrs[attr_name],
                    )
                )

        return events

    def _diff_single_attribute(
        self,
        before_contract: SemanticContract,
        after_contract: SemanticContract,
        entity_name: str,
        before_attr: Attribute,
        after_attr: Attribute,
    ) -> list[ChangeEvent]:
        events: list[ChangeEvent] = []
        path = f"{entity_name}.{before_attr.name}"

        # Type change
        if before_attr.type != after_attr.type:
            # Detect state space expansion (e.g., BOOLEAN → ENUM)
            if before_attr.type.value == "BOOLEAN" and after_attr.type.value == "ENUM":
                shift = SemanticShift.STATE_SPACE_EXPANDED
                severity = Severity.HIGH
            elif after_attr.type.value == "BOOLEAN" and before_attr.type.value == "ENUM":
                shift = SemanticShift.STATE_SPACE_CONTRACTED
                severity = Severity.CRITICAL
            else:
                shift = SemanticShift.TYPE_CHANGED
                severity = Severity.HIGH

            events.append(self._make_event(
                before=before_contract, after=after_contract,
                shift=shift,
                category=ChangeCategory.SCHEMA,
                entity_ref=EntityRef(kind=EntityKind.FIELD, path=path, parent=entity_name),
                before_val=ValueSnapshot(
                    value=str(before_attr.type),
                    semantic_type=str(before_attr.type),
                    constraints=before_attr.constraints,
                ),
                after_val=ValueSnapshot(
                    value=str(after_attr.type),
                    semantic_type=str(after_attr.type),
                    constraints=after_attr.constraints,
                ),
                severity=severity,
                confidence=0.95,
                reasoning=f"Type of '{path}' changed from {before_attr.type} to {after_attr.type}.",
                evidence=Evidence(
                    before_snippet=f"{before_attr.name}: {before_attr.type}",
                    after_snippet=f"{after_attr.name}: {after_attr.type}",
                ),
            ))

        # Nullability / required change
        if before_attr.required != after_attr.required:
            shift = SemanticShift.NULLABILITY_CHANGED
            if before_attr.required and not after_attr.required:
                severity = Severity.LOW  # Relaxing is usually safe
                reasoning = f"'{path}' changed from required to optional. Existing integrations unaffected."
            else:
                severity = Severity.HIGH  # Tightening can break things
                reasoning = f"'{path}' changed from optional to required. Integrations not providing it will fail."

            events.append(self._make_event(
                before=before_contract, after=after_contract,
                shift=shift,
                category=ChangeCategory.SCHEMA,
                entity_ref=EntityRef(kind=EntityKind.FIELD, path=path, parent=entity_name),
                before_val=ValueSnapshot(value=f"required={before_attr.required}"),
                after_val=ValueSnapshot(value=f"required={after_attr.required}"),
                severity=severity,
                confidence=0.9,
                reasoning=reasoning,
                evidence=Evidence(
                    before_snippet=f"{before_attr.name}: required={before_attr.required}",
                    after_snippet=f"{after_attr.name}: required={after_attr.required}",
                ),
            ))

        # Deprecation announced
        if not before_attr.deprecated and after_attr.deprecated:
            events.append(self._make_event(
                before=before_contract, after=after_contract,
                shift=SemanticShift.DEPRECATION_ANNOUNCED,
                category=ChangeCategory.LIFECYCLE,
                entity_ref=EntityRef(kind=EntityKind.FIELD, path=path, parent=entity_name),
                before_val=ValueSnapshot(value="active"),
                after_val=ValueSnapshot(value="deprecated"),
                severity=Severity.MEDIUM,
                confidence=0.95,
                reasoning=f"'{path}' has been marked as deprecated. Plan migration before removal.",
                evidence=Evidence(
                    before_snippet=f"{before_attr.name}: deprecated=False",
                    after_snippet=f"{after_attr.name}: deprecated=True",
                ),
            ))

        # Enum value changes (state space)
        if before_attr.allowed_values and after_attr.allowed_values:
            before_set = set(before_attr.allowed_values)
            after_set = set(after_attr.allowed_values)

            added = after_set - before_set
            removed = before_set - after_set

            if added and not removed:
                events.append(self._make_event(
                    before=before_contract, after=after_contract,
                    shift=SemanticShift.STATE_SPACE_EXPANDED,
                    category=ChangeCategory.SCHEMA,
                    entity_ref=EntityRef(kind=EntityKind.FIELD, path=path, parent=entity_name),
                    before_val=ValueSnapshot(
                        value=str(sorted(before_set)), semantic_type="ENUM_VALUES"
                    ),
                    after_val=ValueSnapshot(
                        value=str(sorted(after_set)), semantic_type="ENUM_VALUES"
                    ),
                    severity=Severity.MEDIUM,
                    confidence=0.9,
                    reasoning=f"New enum values added to '{path}': {sorted(added)}. Consumers may need to handle them.",
                    evidence=Evidence(
                        before_snippet=f"allowed: {sorted(before_set)}",
                        after_snippet=f"allowed: {sorted(after_set)}",
                    ),
                ))
            elif removed and not added:
                events.append(self._make_event(
                    before=before_contract, after=after_contract,
                    shift=SemanticShift.STATE_SPACE_CONTRACTED,
                    category=ChangeCategory.SCHEMA,
                    entity_ref=EntityRef(kind=EntityKind.FIELD, path=path, parent=entity_name),
                    before_val=ValueSnapshot(
                        value=str(sorted(before_set)), semantic_type="ENUM_VALUES"
                    ),
                    after_val=ValueSnapshot(
                        value=str(sorted(after_set)), semantic_type="ENUM_VALUES"
                    ),
                    severity=Severity.HIGH,
                    confidence=0.9,
                    reasoning=f"Enum values removed from '{path}': {sorted(removed)}. Existing data using them will be invalid.",
                    evidence=Evidence(
                        before_snippet=f"allowed: {sorted(before_set)}",
                        after_snippet=f"allowed: {sorted(after_set)}",
                    ),
                ))
            elif added and removed:
                events.append(self._make_event(
                    before=before_contract, after=after_contract,
                    shift=SemanticShift.STATE_SPACE_CONTRACTED,
                    category=ChangeCategory.SCHEMA,
                    entity_ref=EntityRef(kind=EntityKind.FIELD, path=path, parent=entity_name),
                    before_val=ValueSnapshot(
                        value=str(sorted(before_set)), semantic_type="ENUM_VALUES"
                    ),
                    after_val=ValueSnapshot(
                        value=str(sorted(after_set)), semantic_type="ENUM_VALUES"
                    ),
                    severity=Severity.HIGH,
                    confidence=0.85,
                    reasoning=f"Enum values changed for '{path}': added {sorted(added)}, removed {sorted(removed)}.",
                    evidence=Evidence(
                        before_snippet=f"allowed: {sorted(before_set)}",
                        after_snippet=f"allowed: {sorted(after_set)}",
                    ),
                ))

        # Constraint changes
        before_constraints = set(before_attr.constraints)
        after_constraints = set(after_attr.constraints)

        added_constraints = after_constraints - before_constraints
        removed_constraints = before_constraints - after_constraints

        if added_constraints:
            events.append(self._make_event(
                before=before_contract, after=after_contract,
                shift=SemanticShift.CONSTRAINT_ADDED,
                category=ChangeCategory.SCHEMA,
                entity_ref=EntityRef(kind=EntityKind.FIELD, path=path, parent=entity_name),
                before_val=ValueSnapshot(value=str(sorted(before_constraints))),
                after_val=ValueSnapshot(value=str(sorted(after_constraints))),
                severity=Severity.MEDIUM,
                confidence=0.85,
                reasoning=f"New constraints on '{path}': {sorted(added_constraints)}. May reject previously valid data.",
                evidence=Evidence(
                    before_snippet=f"constraints: {sorted(before_constraints)}",
                    after_snippet=f"constraints: {sorted(after_constraints)}",
                ),
            ))

        if removed_constraints:
            events.append(self._make_event(
                before=before_contract, after=after_contract,
                shift=SemanticShift.CONSTRAINT_REMOVED,
                category=ChangeCategory.SCHEMA,
                entity_ref=EntityRef(kind=EntityKind.FIELD, path=path, parent=entity_name),
                before_val=ValueSnapshot(value=str(sorted(before_constraints))),
                after_val=ValueSnapshot(value=str(sorted(after_constraints))),
                severity=Severity.LOW,
                confidence=0.85,
                reasoning=f"Constraints removed from '{path}': {sorted(removed_constraints)}. Validation is now more permissive.",
                evidence=Evidence(
                    before_snippet=f"constraints: {sorted(before_constraints)}",
                    after_snippet=f"constraints: {sorted(after_constraints)}",
                ),
            ))

        return events

    # --- Endpoint diffing ---

    def _diff_endpoints(self, before: SemanticContract, after: SemanticContract) -> list[ChangeEvent]:
        events: list[ChangeEvent] = []

        before_map = {f"{e.method} {e.path}": e for e in before.endpoints}
        after_map = {f"{e.method} {e.path}": e for e in after.endpoints}

        # Removed endpoints
        for key, ep in before_map.items():
            if key not in after_map:
                events.append(self._make_event(
                    before=before, after=after,
                    shift=SemanticShift.BREAKING_REMOVAL,
                    category=ChangeCategory.SCHEMA,
                    entity_ref=EntityRef(kind=EntityKind.ENDPOINT, path=key),
                    before_val=ValueSnapshot(value=key, semantic_type="ENDPOINT"),
                    after_val=ValueSnapshot(value="<removed>", semantic_type="ABSENT"),
                    severity=Severity.CRITICAL,
                    confidence=0.95,
                    reasoning=f"Endpoint '{key}' removed. All consumers will break.",
                    evidence=Evidence(
                        before_snippet=f"{key} — {ep.description or 'no description'}",
                        after_snippet="<not present>",
                    ),
                ))

        # New endpoints
        for key, ep in after_map.items():
            if key not in before_map:
                events.append(self._make_event(
                    before=before, after=after,
                    shift=SemanticShift.SCOPE_WIDENED,
                    category=ChangeCategory.SCHEMA,
                    entity_ref=EntityRef(kind=EntityKind.ENDPOINT, path=key),
                    before_val=ValueSnapshot(value="<not present>", semantic_type="ABSENT"),
                    after_val=ValueSnapshot(value=key, semantic_type="ENDPOINT"),
                    severity=Severity.INFO,
                    confidence=0.9,
                    reasoning=f"New endpoint '{key}' added.",
                    evidence=Evidence(
                        before_snippet="<not present>",
                        after_snippet=f"{key} — {ep.description or 'no description'}",
                    ),
                ))

        # Endpoint deprecation
        for key, b_ep in before_map.items():
            if key in after_map:
                a_ep = after_map[key]

                if not b_ep.deprecated and a_ep.deprecated:
                    events.append(self._make_event(
                        before=before, after=after,
                        shift=SemanticShift.DEPRECATION_ANNOUNCED,
                        category=ChangeCategory.LIFECYCLE,
                        entity_ref=EntityRef(kind=EntityKind.ENDPOINT, path=key),
                        before_val=ValueSnapshot(value="active"),
                        after_val=ValueSnapshot(value="deprecated"),
                        severity=Severity.MEDIUM,
                        confidence=0.95,
                        reasoning=f"Endpoint '{key}' marked deprecated. Plan migration.",
                        evidence=Evidence(
                            before_snippet=f"{key}: deprecated=False",
                            after_snippet=f"{key}: deprecated=True",
                        ),
                    ))

        return events

    # --- Metadata diffing ---

    def _diff_metadata(self, before: SemanticContract, after: SemanticContract) -> list[ChangeEvent]:
        events: list[ChangeEvent] = []

        # Auth flow changes
        before_auth = set(before.auth_flows)
        after_auth = set(after.auth_flows)

        removed_auth = before_auth - after_auth
        if removed_auth:
            events.append(self._make_event(
                before=before, after=after,
                shift=SemanticShift.BREAKING_REMOVAL,
                category=ChangeCategory.SECURITY,
                entity_ref=EntityRef(kind=EntityKind.FLOW, path="auth_flows"),
                before_val=ValueSnapshot(value=str(sorted(before_auth))),
                after_val=ValueSnapshot(value=str(sorted(after_auth))),
                severity=Severity.CRITICAL,
                confidence=0.85,
                reasoning=f"Auth flows removed: {sorted(removed_auth)}. Integrations using them will fail to authenticate.",
                evidence=Evidence(
                    before_snippet=f"auth: {sorted(before_auth)}",
                    after_snippet=f"auth: {sorted(after_auth)}",
                ),
            ))

        # Deprecation notices added
        before_deps = set(before.deprecation_notices)
        after_deps = set(after.deprecation_notices)
        new_deps = after_deps - before_deps

        if new_deps:
            events.append(self._make_event(
                before=before, after=after,
                shift=SemanticShift.DEPRECATION_ANNOUNCED,
                category=ChangeCategory.LIFECYCLE,
                entity_ref=EntityRef(kind=EntityKind.OBJECT, path="deprecation_notices"),
                before_val=ValueSnapshot(value=str(len(before_deps)) + " notices"),
                after_val=ValueSnapshot(value=str(len(after_deps)) + " notices"),
                severity=Severity.MEDIUM,
                confidence=0.8,
                reasoning=f"New deprecation notices: {list(new_deps)[:3]}",
                evidence=Evidence(
                    before_snippet=f"{len(before_deps)} deprecation notices",
                    after_snippet=f"{len(after_deps)} deprecation notices",
                ),
            ))

        return events

    # --- Helper ---

    def _make_event(
        self,
        before: SemanticContract,
        after: SemanticContract,
        shift: SemanticShift,
        category: ChangeCategory,
        entity_ref: EntityRef,
        before_val: ValueSnapshot,
        after_val: ValueSnapshot,
        severity: Severity,
        confidence: float,
        reasoning: str,
        evidence: Evidence,
    ) -> ChangeEvent:
        return ChangeEvent(
            source_url=after.source_url,
            application=after.application,
            document_type="API_DOC",
            version_before=before.version,
            version_after=after.version,
            shift=shift,
            category=category,
            entity=entity_ref,
            before=before_val,
            after=after_val,
            severity=severity,
            confidence=confidence,
            reasoning=reasoning,
            evidence=evidence,
        )
