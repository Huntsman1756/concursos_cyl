import type { JSX } from "react";

/**
 * Reusable route-level loading pattern. Preserves the rough geometry of the
 * page that will replace it so navigation never collapses to a bare white
 * page. One pulsing surface (reduced-motion safe), a visible status line and
 * aria-busy semantics; decorative blocks are hidden from assistive tech.
 */
export type LoadingSkeletonLayout = "page" | "results" | "detail" | "catalog";

interface LoadingSkeletonProps {
  /** Visible + announced loading text ("Cargando las ofertas…"). */
  status: string;
  layout: LoadingSkeletonLayout;
  className?: string;
}

function PageBlocks(): JSX.Element {
  return (
    <>
      <span className="loading-skeleton__block loading-skeleton__block--eyebrow" />
      <span className="loading-skeleton__block loading-skeleton__block--display" />
      <span className="loading-skeleton__block loading-skeleton__block--line is-narrow" />
      <span className="loading-skeleton__block loading-skeleton__block--line is-mid" />
      <span className="loading-skeleton__cards">
        <span className="loading-skeleton__block loading-skeleton__block--card" />
        <span className="loading-skeleton__block loading-skeleton__block--card" />
        <span className="loading-skeleton__block loading-skeleton__block--card" />
      </span>
    </>
  );
}

function ResultsBlocks(): JSX.Element {
  return (
    <>
      <span className="loading-skeleton__block loading-skeleton__block--eyebrow" />
      <span className="loading-skeleton__block loading-skeleton__block--display" />
      <span className="loading-skeleton__block loading-skeleton__block--line is-mid" />
      <span className="loading-skeleton__block loading-skeleton__block--filter" />
      <span className="loading-skeleton__rows">
        <span className="loading-skeleton__block loading-skeleton__block--row" />
        <span className="loading-skeleton__block loading-skeleton__block--row" />
        <span className="loading-skeleton__block loading-skeleton__block--row" />
      </span>
    </>
  );
}

function DetailBlocks(): JSX.Element {
  return (
    <>
      <span className="loading-skeleton__block loading-skeleton__block--crumb" />
      <span className="loading-skeleton__block loading-skeleton__block--display" />
      <span className="loading-skeleton__block loading-skeleton__block--line is-narrow" />
      <span className="loading-skeleton__block loading-skeleton__block--section" />
      <span className="loading-skeleton__block loading-skeleton__block--line is-mid" />
      <span className="loading-skeleton__block loading-skeleton__block--line is-mid" />
      <span className="loading-skeleton__block loading-skeleton__block--section" />
      <span className="loading-skeleton__block loading-skeleton__block--line is-mid" />
    </>
  );
}

export function LoadingSkeleton({
  status,
  layout,
  className,
}: LoadingSkeletonProps): JSX.Element {
  const classNames = [
    "loading-skeleton",
    layout === "catalog" && "loading-skeleton--catalog",
    className,
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <div className={classNames} aria-busy="true" data-loading="true">
      <p className="loading-skeleton__status" role="status" aria-live="polite">
        {status}
      </p>
      <div className="loading-skeleton__surface" aria-hidden="true">
        {layout === "page" && <PageBlocks />}
        {(layout === "results" || layout === "catalog") && <ResultsBlocks />}
        {layout === "detail" && <DetailBlocks />}
      </div>
    </div>
  );
}
