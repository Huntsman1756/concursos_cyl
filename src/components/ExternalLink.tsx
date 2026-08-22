import type { AnchorHTMLAttributes, ReactNode } from "react";

export interface ExternalLinkProps extends Omit<
  AnchorHTMLAttributes<HTMLAnchorElement>,
  "rel" | "target"
> {
  children: ReactNode;
}

export function ExternalLink({ children, ...props }: ExternalLinkProps) {
  return (
    <a {...props} target="_blank" rel="noopener noreferrer">
      {children}
      <span className="sr-only"> (abre en una pestaña nueva)</span>
    </a>
  );
}
