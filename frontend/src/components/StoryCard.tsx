import type { StorySummary } from "../lib/types";

export function StoryCard({ story, onOpen }: { story: StorySummary; onOpen: () => void }) {
  return <button className="story-card" type="button" onClick={onOpen}>
    <span className="story-card-index">{String(story.article_count).padStart(2, "0")} reports</span>
    <h3>{story.story_title || "Untitled story"}</h3>
    <p>{story.sources?.join(" · ") || "Multiple sources"}</p>
    <span className="story-card-arrow">Compare coverage →</span>
  </button>;
}
