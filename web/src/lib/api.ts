/**
 * Tremor API client — calls the backend demo endpoints.
 * Backend URL is configurable via NEXT_PUBLIC_API_URL env var.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

async function post(path: string, body: Record<string, unknown>) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

async function get(path: string) {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

// ─── Demo endpoints ─────────────────────────────────────────────────────────

export async function discoverVersions(url: string, application: string) {
  return post("/demo/discover", { url, application });
}

export async function scrapeVersions(url: string, application: string) {
  return post("/demo/scrape", { url, application });
}

export async function analyzeChanges(application: string) {
  return post("/demo/analyze", { application });
}

export async function generateAlerts(application: string, domain: string = "IGA") {
  return post("/demo/alerts", { application, domain });
}

export async function sendNotifications(application: string, channels: string[]) {
  return post("/demo/notify", { application, channels });
}

export async function getDemoStatus() {
  return get("/demo/status");
}

export async function getHealth() {
  return get("/health");
}
