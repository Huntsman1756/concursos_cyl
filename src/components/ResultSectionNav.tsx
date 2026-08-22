import type { JSX } from "react";
import { FragmentLink } from "./FragmentLink";

export interface ResultSectionNavLink {
  href: string;
  label: string;
}

export interface ResultSectionNavProps {
  links: readonly ResultSectionNavLink[];
  ariaLabel?: string;
}

export function ResultSectionNav({
  links,
  ariaLabel = "Secciones del resultado",
}: ResultSectionNavProps): JSX.Element | null {
  if (links.length < 2) return null;

  return (
    <nav className="result-section-nav" aria-label={ariaLabel}>
      <ul>
        {links.map((link) => (
          <li key={link.href}>
            <FragmentLink href={link.href}>{link.label}</FragmentLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
