import { Link } from "react-router-dom";
import { Icon, type IconName } from "./Icon";

export interface EntryCardProps {
  title: string;
  outcome: string;
  to: string;
  icon: IconName;
}

export function EntryCard({ title, outcome, to, icon }: EntryCardProps) {
  return (
    <Link className="entry-card" to={to}>
      <span className="entry-card__icon">
        <Icon name={icon} />
      </span>
      <div>
        <h2>{title}</h2>
        <p>{outcome}</p>
      </div>
      <span className="entry-card__cta">
        Empezar <Icon name="arrow-right" />
      </span>
    </Link>
  );
}
