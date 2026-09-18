const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "https://nechnrnjk0.execute-api.ap-south-1.amazonaws.com").replace(/\/$/, "");

async function apiGet(path, signal) {
  const response = await fetch(`${API_BASE_URL}${path}`, { signal });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(typeof body.error === "string" ? body.error : `Request failed (${response.status})`);
  return body;
}

export function getMarket(signal) {
  return apiGet("/market", signal);
}

export function getStateStories(state, signal) {
  return apiGet(`/states/${encodeURIComponent(state)}/stories`, signal);
}

export function getStateArticles(state, signal) {
  return apiGet(`/states/${encodeURIComponent(state)}/articles`, signal);
}

export function getStory(runId, storyId, signal) {
  return apiGet(`/stories/${encodeURIComponent(runId)}/${encodeURIComponent(storyId)}`, signal);
}

export async function startProcessing() {
  const response = await fetch(`${API_BASE_URL}/process`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(typeof body.error === "string" ? body.error : `Processing request failed (${response.status})`);
  return body;
}

export function getRunStatus(runId, signal) {
  return apiGet(`/runs/${encodeURIComponent(runId)}`, signal);
}
