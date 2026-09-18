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
  const displayName = meta?.plain ?? meta?.name ?? state;
  const groupedArticles = data?.stories.reduce((total, story) => total + Math.max(Number(story.article_count || 0), story.article_ids?.length ?? 0), 0) ?? 0;
  return <section className="state-page" data-open="1" role="dialog" aria-modal="true" aria-label={displayName + " stories"}>
    <div className="sp-chrome">
      <button className="back" type="button" onClick={onClose}><i>←</i> Home</button>
      <nav className="crumb" aria-label="Breadcrumb">India <s>/</s> <b>{displayName}</b> <s>/</s> Dispatches</nav>
      <div className="mini" aria-hidden="true"><span>{state.slice(0, 2).toUpperCase()}</span></div>
      <button className="switcher-btn" type="button" onClick={onClose}>Close ×</button>
    </div>
    <div className="sp-scroll">
      <header className="sp-hero">
        <div className="sp-hero-type">
          <div className="sp-kick rv"><span className="bar" /><span className="micro">State desk · {meta?.ep}</span></div>
          <h1 className="sp-name rv">{displayName}</h1>
          <div className="sp-ep rv">{meta?.cap}</div>
          <p className="sp-stand rv">State-wise reporting, compared across publishers and grounded in the original source links.</p>
          <dl className="sp-facts rv"><div className="fact"><dt>Grouped articles</dt><dd>{loading ? "—" : groupedArticles}</dd></div><div className="fact"><dt>Stories</dt><dd>{loading ? "—" : data?.stories.length ?? 0}</dd></div><div className="fact"><dt>Status</dt><dd>{error ? "Unavailable" : "Live"}</dd></div></dl>
        </div>
        <div className="sp-art"><div className="state-art-mark">{meta?.ep}</div><div className="state-art-line" /><strong>{displayName}</strong></div>
      </header>
      <div className="sp-section-head"><h3>Dispatches</h3><span className="micro">{loading ? "Loading" : String(data?.stories.length ?? 0) + " grouped stories"}</span></div>
      {loading && <p className="panel-state">Loading stories…</p>}
      {error && <p className="panel-state panel-error">Unable to load stories: {error}</p>}
      {!loading && !error && data && data.stories.length === 0 && <p className="panel-state">No grouped stories are available for this state yet.</p>}
      {!loading && !error && data && <div className="stories"><div className="story-grid">{data.stories.map((story) => <StoryCard key={story.run_id + "-" + story.story_id} story={story} onOpen={() => openStory(story.story_id, story.run_id)} />)}</div></div>}
      {storyLoading && <p className="panel-state">Loading comparison…</p>}
      {selectedStory && <div className="comparison-view"><div className="comparison-top"><span className="micro">Coverage comparison</span><button className="close-button" type="button" onClick={() => setSelectedStory(null)}>Back to stories</button></div><h3>{selectedStory.story.story_title}</h3><ArticleComparison articles={selectedStory.articles} /></div>}
      <footer className="sp-foot"><span className="micro">Original headlines · publisher links · observable coverage</span><button className="next-state" type="button" onClick={onClose}>Back to map <i>→</i></button></footer>
    </div>
  </section>;
}
