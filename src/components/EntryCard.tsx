import type { ReactNode } from "react";

export interface EntryCardProps {
  title: string;
  outcome: string;
  accent: "burgundy" | "gold";
  control: ReactNode;
  action: ReactNode;
}

export function EntryCard({
  title,
  outcome,
  accent,
  control,
  action,
}: EntryCardProps) {
  return (
    <article className={`entry-card entry-card--${accent}`}>
      <h2 className="entry-card__title">{title}</h2>
      <p className="entry-card__outcome">{outcome}</p>
      <div className="entry-card__control">{control}</div>
      {action}
    </article>
  );
}
