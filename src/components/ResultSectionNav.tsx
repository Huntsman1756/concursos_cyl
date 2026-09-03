import { useEffect, useState } from "react";
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
  const [activeHref, setActiveHref] = useState<string | null>(
    links[0]?.href ?? null,
  );

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;

    const destinations = links
      .map((link) => {
        if (!link.href.startsWith("#")) return null;
        try {
          return {
            href: link.href,
            element: document.getElementById(
              decodeURIComponent(link.href.slice(1)),
            ),
          };
        } catch {
          return null;
        }
      })
      .filter(
        (
          destination,
        ): destination is {
          href: string;
          element: HTMLElement;
        } => destination?.element instanceof HTMLElement,
      );

    if (destinations.length === 0) return;

    const hrefByElement = new Map(
      destinations.map((destination) => [
        destination.element,
        destination.href,
      ]),
    );
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort(
            (left, right) =>
              left.boundingClientRect.top - right.boundingClientRect.top,
          )[0];
        if (visible === undefined) return;
        const target = visible.target;
        if (!(target instanceof HTMLElement)) return;
        const href = hrefByElement.get(target);
        if (href !== undefined) setActiveHref(href);
      },
      { rootMargin: "-20% 0px -65% 0px", threshold: [0, 1] },
    );

    destinations.forEach((destination) =>
      observer.observe(destination.element),
    );
    return () => observer.disconnect();
  }, [links]);

  if (links.length < 2) return null;

  return (
    <nav className="result-section-nav" aria-label={ariaLabel}>
      <ul>
        {links.map((link) => (
          <li key={link.href}>
            <FragmentLink
              href={link.href}
              aria-current={activeHref === link.href ? "location" : undefined}
              onClick={() => setActiveHref(link.href)}
            >
              {link.label}
            </FragmentLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
