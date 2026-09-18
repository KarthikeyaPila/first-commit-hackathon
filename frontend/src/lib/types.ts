export type MarketInstrument = {
  key: string; label: string; value: number | null; change: number | null;
  change_percent: number | null; currency: string | null; status: "OK" | "ERROR"; error?: string | null;
};
export type MarketResponse = { status: string; fetched_at?: string; provider?: string; instruments: MarketInstrument[] };
export type StorySummary = {
  story_id: string; run_id: string; story_title: string; states?: string[]; state?: string;
  article_count: number; sources: string[]; reasons?: string[]; article_ids?: string[];
};
export type StateStoriesResponse = { state: string; stories: StorySummary[] };
export type Article = {
  article_id?: string; headline: string; summary?: string; lead?: string; url: string;
  published_at?: string | null; source?: { name?: string; source_id?: string; scope?: string };
};
export type StoryResponse = { run_id: string; story: StorySummary; articles: Article[] };
export type RunStage = { stage_id: string; label?: string; status: string; metrics?: Record<string, unknown>; started_at?: string | null; completed_at?: string | null };
export type RunStatusResponse = { run_id: string; status: string; current_stage?: string; stage_progress?: RunStage[]; story_count?: number; articles_unique?: number; grouping_summary?: Record<string, unknown>; error?: string };
