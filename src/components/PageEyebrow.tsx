import type { JSX, ReactNode } from "react";

interface PageEyebrowProps {
  children: ReactNode;
  className?: string;
}

/** Shared semantic label for page mastheads and section introductions. */
export function PageEyebrow({
  children,
  className,
}: PageEyebrowProps): JSX.Element {
  const classes = ["page-eyebrow", className].filter(Boolean).join(" ");
  return <p className={classes}>{children}</p>;
}
