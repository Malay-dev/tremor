from dotenv import load_dotenv
from fastapi import FastAPI

from tremor.graph.router import router as graph_router
from tremor.ingestion.collector import router as collector_router
from tremor.ingestion.gateway import router as ingestion_router

load_dotenv()

app = FastAPI(
    title="Tremor",
    description="intelligence for enterprise integrations",
    version='0.1.0'
)

app.include_router(ingestion_router)
app.include_router(collector_router)
app.include_router(graph_router)

@app.get("/health")
async def health():
    return {"status": "ok", "service": "tremor"}