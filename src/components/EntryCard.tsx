import { Link } from "react-router-dom";
import { Icon, type IconName } from "./Icon";

export interface EntryCardProps {
  title: string;
  outcome: string;
  to: string;
  cta: string;
  iconName: IconName;
}

export function EntryCard({
  title,
  outcome,
  to,
  cta,
  iconName,
}: EntryCardProps) {
  return (
    <article className="entry-card">
      <span className="entry-card__icon">
        <Icon name={iconName} />
      </span>
      <h2>{title}</h2>
      <p className="entry-card__outcome">{outcome}</p>
      <Link className="entry-card__cta" to={to}>
        {cta}
        <Icon name="arrow-right" size={20} />
      </Link>
    </article>
  );
}
