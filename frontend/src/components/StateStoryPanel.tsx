import { useEffect, useState } from "react";
import { getStory } from "../lib/api";
import { STATES } from "../data/states";
import { useStateStories } from "../hooks/useStateStories";
import type { StoryResponse } from "../lib/types";
import { ArticleComparison } from "./ArticleComparison";
import { StoryCard } from "./StoryCard";

export function StateStoryPanel({ state, onClose }: { state: string | null; onClose: () => void }) {
  const { data, loading, error } = useStateStories(state);
  const [selectedStory, setSelectedStory] = useState<StoryResponse | null>(null);
  const [storyLoading, setStoryLoading] = useState(false);
  const meta = state ? STATES[state] : null;
  useEffect(() => { setSelectedStory(null); }, [state]);
  if (!state || state === "national") return null;
  async function openStory(storyId: string, runId: string) {
    setStoryLoading(true);
    try { setSelectedStory(await getStory(runId, storyId)); } finally { setStoryLoading(false); }
  }
  return <div className="story-panel" role="dialog" aria-modal="true" aria-label={`${meta?.plain ?? meta?.name ?? state} stories`}>
    <div className="story-panel-top"><div><span className="micro">State desk · {meta?.ep}</span><h2>{meta?.plain ?? meta?.name ?? state}</h2><p>{meta?.cap}</p></div><button className="close-button" type="button" onClick={onClose}>Close ×</button></div>
    {loading && <p className="panel-state">Loading stories…</p>}
    {error && <p className="panel-state panel-error">Unable to load stories: {error}</p>}
    {!loading && !error && data && data.stories.length === 0 && <p className="panel-state">No grouped stories are available for this state yet.</p>}
    {!loading && !error && data && <div className="story-grid">{data.stories.map((story) => <StoryCard key={`${story.run_id}-${story.story_id}`} story={story} onOpen={() => openStory(story.story_id, story.run_id)} />)}</div>}
    {storyLoading && <p className="panel-state">Loading comparison…</p>}
    {selectedStory && <div className="comparison-view"><div className="comparison-top"><span className="micro">Coverage comparison</span><button className="close-button" type="button" onClick={() => setSelectedStory(null)}>Back to stories</button></div><h3>{selectedStory.story.story_title}</h3><ArticleComparison articles={selectedStory.articles} /></div>}
  </div>;
}
