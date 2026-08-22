import type { AnchorHTMLAttributes, MouseEvent } from "react";

export interface FragmentLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
}

function focusFragmentDestination(href: string): void {
  const id = decodeURIComponent(href.slice(1));
  document.getElementById(id)?.focus({ preventScroll: true });
}

export function FragmentLink({ href, onClick, ...props }: FragmentLinkProps) {
  function handleClick(event: MouseEvent<HTMLAnchorElement>): void {
    onClick?.(event);
    if (!event.defaultPrevented) focusFragmentDestination(href);
  }

  return <a {...props} href={href} onClick={handleClick} />;
}
