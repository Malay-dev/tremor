/**
 * Tremor API client — calls the backend.
 * When DEMO_MODE is on in backend, returns mock data.
 * When off, routes to actual pipeline endpoints.
 * 
 * NEXT_PUBLIC_API_URL — backend URL (default: http://127.0.0.1:8000)
 * NEXT_PUBLIC_USE_DEMO — "true" to hit /demo/* endpoints, "false" for real /ingest/* endpoints
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
const USE_DEMO = process.env.NEXT_PUBLIC_USE_DEMO !== "false"; // default true

async function post(path: string, body: Record<string, unknown>) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API error: ${res.status} on ${path}`);
  return res.json();
}

async function get(path: string) {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`API error: ${res.status} on ${path}`);
  return res.json();
}

// ─── Version Discovery ──────────────────────────────────────────────────────

export async function discoverVersions(url: string, application: string) {
  if (USE_DEMO) {
    return post("/demo/discover", { url, application });
  }
  // Real: post webhook with the URL content (would need actual content)
  return post("/demo/discover", { url, application }); // fallback to demo for now
}

// ─── Scraping ───────────────────────────────────────────────────────────────

export async function scrapeVersions(url: string, application: string) {
  if (USE_DEMO) {
    return post("/demo/scrape", { url, application });
  }
  // Real: trigger Bright Data collection
  return post("/collect/trigger", {
    collector_id: "c_8f2a91b4",
    url,
    application,
  });
}

// ─── Analysis ───────────────────────────────────────────────────────────────

export async function analyzeChanges(application: string) {
  if (USE_DEMO) {
    return post("/demo/analyze", { application });
  }
  // Real: trigger the processing pipeline
  return post("/ingest/process", {});
}

// ─── Alerts ─────────────────────────────────────────────────────────────────

export async function generateAlerts(application: string, domain: string = "IGA") {
  if (USE_DEMO) {
    return post("/demo/alerts", { application, domain });
  }
  // Real: run adapter analysis
  return post(`/adapters/analyze/${domain.toLowerCase()}`, {});
}

// ─── Notifications ──────────────────────────────────────────────────────────

export async function sendNotifications(application: string, channels: string[]) {
  if (USE_DEMO) {
    return post("/demo/notify", { application, channels });
  }
  // Real: notifications fire automatically during /ingest/process
  return post("/demo/notify", { application, channels });
}

// ─── Utility ────────────────────────────────────────────────────────────────

export async function getDemoStatus() {
  return get("/demo/status");
}

export async function getHealth() {
  return get("/health");
}

export async function getEvents() {
  return get("/ingest/events");
}
