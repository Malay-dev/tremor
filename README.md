# Tremor

> Change intelligence for enterprise integrations.

Tremor detects semantic changes in public web artifacts and predicts which enterprise integrations will break — before they do.

## Quick Start

```bash
# Install dependencies
uv sync

# Set up environment
cp .env.example .env
# Add your GEMINI_API_KEY to .env

# Run the server
uv run uvicorn tremor.main:app --reload
```

## How It Works

```
PUBLIC WEB
    │
Bright Data (self-healing collectors)
    │
Ingestion Gateway (POST /ingest/webhook)
    │
    ├── Snapshot versioning + deduplication
    │
Semantic Extraction (Gemini Flash)
    │
    ├── Entities, endpoints, contracts
    │
Change Engine (semantic diff)
    │
    ├── 17-type shift taxonomy
    ├── Severity scoring
    │
Impact Graph (Neo4j) [planned]
    │
Alerts + Recommendations [planned]
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| POST | `/ingest/webhook` | Receive document snapshot from Bright Data |
| GET | `/ingest/sources` | List monitored sources |
| GET | `/ingest/pending` | List pairs awaiting analysis |
| POST | `/ingest/process` | Run extraction + diffing on pending pairs |
| GET | `/ingest/events` | List detected change events (filter by `?severity=`) |

## Architecture

| Layer | Tech | Status |
|-------|------|--------|
| Ingestion | FastAPI | Done |
| Extraction | Gemini 2.5 Flash (structured output) | Done |
| Change Engine | Python semantic diff | Done |
| Impact Graph | Neo4j | Planned |
| Adapters | Pluggable (IGA first) | Planned |
| Frontend | React + TypeScript | Planned |
| Storage | PostgreSQL + S3 | Planned (in-memory for now) |

## Semantic Shift Taxonomy

Tremor classifies changes using 17 semantic shift types:

| Shift | Meaning |
|-------|---------|
| STATE_SPACE_EXPANDED | New states added (boolean → enum) |
| STATE_SPACE_CONTRACTED | States removed |
| TYPE_CHANGED | Data type altered |
| NULLABILITY_CHANGED | Required ↔ Optional |
| CARDINALITY_CHANGED | Single → Array |
| CONSTRAINT_ADDED | New validation rule |
| CONSTRAINT_REMOVED | Validation relaxed |
| DEPRECATION_ANNOUNCED | Still works, will break |
| BREAKING_REMOVAL | Gone, breaks now |
| BEHAVIOR_INVERSION | Opt-in → Opt-out |
| SCOPE_NARROWED | Applies to fewer cases |
| SCOPE_WIDENED | Applies to more cases |
| TEMPORAL_SHIFT | Deadline/timeline changed |
| AUTHORITY_CHANGED | Ownership changed |
| DEPENDENCY_ADDED | New prerequisite |
| DEPENDENCY_REMOVED | Prerequisite dropped |
| SEMANTIC_RENAME | Same thing, new name |

## Example

Salesforce releases API v62.0 and changes `User.IsActive` from `boolean` to an enum (`ACTIVE`, `INACTIVE`, `SUSPENDED`).

Tremor detects:

```
⚠ HIGH — STATE_SPACE_EXPANDED

Entity: User.status
Before: BOOLEAN
After: ENUM (ACTIVE, INACTIVE, SUSPENDED)
Reasoning: Type of 'User.status' changed from BOOLEAN to ENUM.
```

## Configuration

Copy `.env.example` to `.env` and set:

| Variable | Description |
|----------|-------------|
| `GEMINI_API_KEY` | Google AI API key (required) |
| `GEMINI_MODEL` | Model to use (default: `gemini-2.5-flash`) |
| `BRIGHT_DATA_API_TOKEN` | Bright Data collector token |
| `NEO4J_URI` | Neo4j connection URI |
| `NEO4J_USER` | Neo4j username |
| `NEO4J_PASSWORD` | Neo4j password |
| `DATABASE_URL` | PostgreSQL connection string |

## Development

```bash
# Lint
uv run ruff check src/

# Tests
uv run pytest
```
