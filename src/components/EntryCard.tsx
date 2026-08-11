import { Link } from "react-router-dom";
import type { ReactNode } from "react";
import { Icon } from "./Icon";

export interface EntryCardProps {
  title: string;
  outcome: string;
  prompt: string;
  example?: string;
  details: string[];
  to?: string;
  cta?: string;
  control?: ReactNode;
  action?: ReactNode;
}

export function EntryCard({
  title,
  outcome,
  prompt,
  example,
  details,
  to,
  cta,
  control,
  action,
}: EntryCardProps) {
  return (
    <article className="entry-card">
      <h2 className="entry-card__title">{title}</h2>
      <p className="entry-card__outcome">{outcome}</p>
      <div className="entry-card__prompt">
        {control ?? (
          <>
            <p>{prompt}</p>
            <div
              className="entry-card__preview"
              aria-label={`${prompt} ${example ?? ""}`.trim()}
            >
              {example}
            </div>
          </>
        )}
      </div>
      <ul className="entry-card__details">
        {details.map((detail) => (
          <li key={detail}>{detail}</li>
        ))}
      </ul>
      {action ??
        (to !== undefined && cta !== undefined ? (
          <Link className="entry-card__cta" to={to}>
            {cta}
            <Icon name="arrow-right" size={20} />
          </Link>
        ) : null)}
    </article>
  );
}
