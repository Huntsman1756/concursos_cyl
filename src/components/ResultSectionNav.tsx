import type { JSX } from "react";

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
            <a href={link.href}>{link.label}</a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
