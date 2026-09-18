import type { MarketResponse, RunStatusResponse, StateStoriesResponse, StoryResponse } from "./types";

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "https://nechnrnjk0.execute-api.ap-south-1.amazonaws.com").replace(/\/$/, "");

export async function apiGet<T>(path: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, { signal });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(typeof body.error === "string" ? body.error : `Request failed (${response.status})`);
  return body as T;
}

export async function startProcessing(): Promise<{ run_id: string; status: string }> {
  const response = await fetch(`${API_BASE_URL}/process`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(typeof body.error === "string" ? body.error : `Processing request failed (${response.status})`);
  return body;
}
export const getMarket = (signal?: AbortSignal) => apiGet<MarketResponse>("/market", signal);
export const getStateStories = (state: string, signal?: AbortSignal) => apiGet<StateStoriesResponse>(`/states/${encodeURIComponent(state)}/stories`, signal);
export const getStory = (runId: string, storyId: string, signal?: AbortSignal) => apiGet<StoryResponse>(`/stories/${encodeURIComponent(runId)}/${encodeURIComponent(storyId)}`, signal);
export const getRunStatus = (runId: string, signal?: AbortSignal) => apiGet<RunStatusResponse>(`/runs/${encodeURIComponent(runId)}`, signal);
