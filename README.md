# Tremor

**Change intelligence for enterprise integrations.**

Tremor monitors public web artifacts — API documentation, changelogs, schemas — and detects semantic changes that predict which enterprise integrations will break before they do.

Unlike text diffs, Tremor understands *what changed in meaning*: a boolean becoming an enum, a required field appearing, an auth flow being removed. It then propagates that change through a typed entity graph to identify every downstream system at risk and generates actionable remediation steps.

---

## Key Capabilities

- **Semantic Extraction** — LLM-powered structured extraction of entities, endpoints, attributes, and contracts from any document format
- **17-Type Shift Taxonomy** — Classifies changes by meaning, not syntax (STATE_SPACE_EXPANDED, BREAKING_REMOVAL, DEPRECATION_ANNOUNCED, etc.)
- **Impact Graph** — Neo4j-backed dependency graph that traces changes from API fields through connectors, provisioning rules, and access decisions to business processes
- **Severity Scoring** — Automatic risk assessment with confidence levels
- **Actionable Recommendations** — Specific remediation steps per affected system

---

## Architecture

```
                         ┌──────────────────┐
                         │   Public Web     │
                         │  (API docs, etc) │
                         └────────┬─────────┘
                                  │
                    ┌─────────────▼──────────────┐
                    │    Ingestion Gateway        │
                    │  Snapshot versioning        │
                    │  Content deduplication      │
                    └─────────────┬──────────────┘
                                  │
                    ┌─────────────▼──────────────┐
                    │   Semantic Extraction       │
                    │   (Gemini 2.5 Flash)        │
                    │   Entities → Contracts      │
                    └─────────────┬──────────────┘
                                  │
                    ┌─────────────▼──────────────┐
                    │      Change Engine          │
                    │   Semantic diff (not text)  │
                    │   Shift classification      │
                    │   Severity scoring          │
                    └─────────────┬──────────────┘
                                  │
                    ┌─────────────▼──────────────┐
                    │      Impact Graph           │
                    │   (Neo4j)                   │
                    │   Relationship traversal    │
                    │   Risk propagation          │
                    └─────────────┬──────────────┘
                                  │
                    ┌─────────────▼──────────────┐
                    │   Alerts & Recommendations  │
                    │   Per-system remediation    │
                    └────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| API | FastAPI | Async REST endpoints |
| Extraction | Google Gemini 2.5 Flash | Structured entity extraction via LLM |
| Change Engine | Python | Semantic diff with 17-type taxonomy |
| Impact Graph | Neo4j 5 | Dependency traversal and risk propagation |
| Models | Pydantic | Type-safe domain models |
| Storage | PostgreSQL + S3 | Versioned snapshots (planned) |
| Acquisition | Bright Data | Self-healing web collectors (planned) |

---

## Quick Start

### Prerequisites

- Python 3.14+
- [uv](https://docs.astral.sh/uv/) package manager
- Docker (for Neo4j)
- Google AI API key ([get one here](https://aistudio.google.com/apikey))

### Setup

```bash
# Clone and install
git clone <repo-url> && cd tremor
uv sync

# Configure environment
cp .env.example .env
# Edit .env — add your GEMINI_API_KEY

# Start Neo4j
docker compose up -d neo4j

# Run the server
uv run uvicorn tremor.main:app --reload
```

The API is available at `http://127.0.0.1:8000`. OpenAPI docs at `/docs`.

---

## API Reference

### Ingestion

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/ingest/webhook` | Receive a document snapshot |
| `GET` | `/ingest/sources` | List all monitored sources |
| `GET` | `/ingest/pending` | List snapshot pairs awaiting analysis |
| `POST` | `/ingest/process` | Run extraction, diffing, and impact analysis |
| `GET` | `/ingest/events` | List detected change events |

### Impact Graph

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/graph/seed` | Seed graph with IGA topology |
| `GET` | `/graph/topology` | View graph summary |
| `GET` | `/graph/impact/{event_id}` | Analyze downstream impact of a change |
| `POST` | `/graph/impact/all` | Run impact analysis on all events |

### System

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Health check |

---

## Usage Example

### 1. Seed the impact graph

```bash
curl -X POST http://127.0.0.1:8000/graph/seed
```

### 2. Send a baseline document snapshot

```bash
curl -X POST http://127.0.0.1:8000/ingest/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "collector_id": "sf-collector",
    "source_url": "https://developer.salesforce.com/docs/api/v61",
    "application": "Salesforce",
    "document_type": "API_DOC",
    "version_label": "v61.0",
    "content": "# User Object\n\n| Field | Type | Required |\n|---|---|---|\n| id | string | yes |\n| status | boolean | yes |\n| email | string | yes |"
  }'
```

### 3. Send an updated snapshot (with breaking changes)

```bash
curl -X POST http://127.0.0.1:8000/ingest/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "collector_id": "sf-collector",
    "source_url": "https://developer.salesforce.com/docs/api/v61",
    "application": "Salesforce",
    "document_type": "API_DOC",
    "version_label": "v62.0",
    "content": "# User Object\n\n| Field | Type | Required |\n|---|---|---|\n| id | string | yes |\n| status | enum(ACTIVE,INACTIVE,SUSPENDED) | yes |\n| email | string | no |"
  }'
```

### 4. Process and get results

```bash
curl -X POST http://127.0.0.1:8000/ingest/process
```

Response:

```json
{
  "status": "processed",
  "pairs_processed": 1,
  "total_events": 2,
  "total_impacts": 1,
  "results": [{
    "application": "Salesforce",
    "events_detected": 2,
    "impacts": [{
      "entity": "User.status",
      "affected_systems": ["Account Enable/Disable Decision", "AD Group: Salesforce Users", "Employee Offboarding"],
      "risk_score": 0.65,
      "top_recommendation": "UPDATE MAPPINGS: 'User.status' type/values changed. Review transformation logic in attribute mappings."
    }]
  }]
}
```

---

## Semantic Shift Taxonomy

Tremor classifies every detected change using a 17-type taxonomy:

| Category | Shifts |
|----------|--------|
| **State Space** | `STATE_SPACE_EXPANDED`, `STATE_SPACE_CONTRACTED` |
| **Type System** | `TYPE_CHANGED`, `NULLABILITY_CHANGED`, `CARDINALITY_CHANGED` |
| **Constraints** | `CONSTRAINT_ADDED`, `CONSTRAINT_REMOVED` |
| **Lifecycle** | `DEPRECATION_ANNOUNCED`, `BREAKING_REMOVAL` |
| **Behavior** | `BEHAVIOR_INVERSION`, `SCOPE_NARROWED`, `SCOPE_WIDENED` |
| **Dependencies** | `DEPENDENCY_ADDED`, `DEPENDENCY_REMOVED` |
| **Governance** | `TEMPORAL_SHIFT`, `AUTHORITY_CHANGED`, `SEMANTIC_RENAME` |

---

## Impact Graph Model

The graph represents the full dependency chain from external APIs to business processes:

```
Application
  └─[EXPOSES]→ API Field
      └─[MAPS_TO]→ Attribute Mapping
          └─[TRANSFORMS]→ Transformation
              └─[DRIVES]→ Provisioning Rule
                  └─[EVALUATES]→ Access Decision
                      └─[CONTROLS]→ Entitlement
                          └─[AFFECTS]→ Business Process
```

A single upstream change propagates through the graph. Tremor walks every path and aggregates risk across all affected systems.

---

## Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GEMINI_API_KEY` | Yes | — | Google AI API key |
| `GEMINI_MODEL` | No | `gemini-2.5-flash` | Gemini model for extraction |
| `NEO4J_URI` | No | `bolt://localhost:7687` | Neo4j connection URI |
| `NEO4J_USER` | No | `neo4j` | Neo4j username |
| `NEO4J_PASSWORD` | No | `password` | Neo4j password |
| `DATABASE_URL` | No | — | PostgreSQL connection (planned) |
| `BRIGHT_DATA_API_TOKEN` | No | — | Bright Data API token (planned) |

---

## Development

```bash
# Install dependencies
uv sync

# Run linter
uv run ruff check src/

# Run tests
uv run pytest

# Start services
docker compose up -d

# Run server with hot reload
uv run uvicorn tremor.main:app --reload
```

---

## Project Structure

```
src/tremor/
├── main.py                 # FastAPI application entry point
├── ingestion/
│   └── gateway.py          # Webhook receiver, snapshot management
├── extraction/
│   └── extractor.py        # LLM-powered semantic extraction (Gemini)
├── engine/
│   ├── differ.py           # Semantic diff engine (17-type taxonomy)
│   └── pipeline.py         # Orchestrates extraction → diff → impact
├── graph/
│   ├── models.py           # Node types, relationship types, impact models
│   ├── connection.py       # Neo4j driver management
│   ├── seeder.py           # Sample IGA topology for demo
│   ├── traversal.py        # Downstream impact traversal + risk scoring
│   └── router.py           # Graph API endpoints
├── models/
│   ├── entities.py         # Entity, Attribute, Endpoint, SemanticContract
│   ├── event.py            # ChangeEvent, SemanticShift, Severity, ImpactResult
│   └── sources.py          # Source, Snapshot, SnapshotPair
└── adapters/               # Domain-specific adapters (planned)
```

---

## Roadmap

- [ ] Bright Data collector integration (self-healing web acquisition)
- [ ] Persistent storage (PostgreSQL + S3 for snapshots)
- [ ] IGA domain adapter (SailPoint, Saviynt connector rules)
- [ ] React dashboard with graph visualization
- [ ] Slack/email alert notifications
- [ ] Multi-tenant SaaS deployment
- [ ] Historical change pattern analysis
- [ ] Predictive breaking change alerts

---

## License

Proprietary. All rights reserved.
