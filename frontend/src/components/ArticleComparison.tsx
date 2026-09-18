import type { Article } from "../lib/types";

function formatDate(value?: string | null) { return value ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "Time not supplied"; }

export function ArticleComparison({ articles }: { articles: Article[] }) {
  return <div className="article-comparison">
    {articles.map((article, index) => <article className="article-card" key={article.article_id ?? article.url ?? index}>
      <div className="article-card-meta"><span>{article.source?.name ?? "Publisher"}</span><time>{formatDate(article.published_at)}</time></div>
      <h3>{article.headline}</h3>
      {article.summary && <p>{article.summary}</p>}
      <a href={article.url} target="_blank" rel="noreferrer">Read original article <span>↗</span></a>
    </article>)}
  </div>;
}
