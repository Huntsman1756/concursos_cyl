import {
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";

import { Icon } from "./Icon";

interface InfoDisclosureProps {
  label: string;
  children: ReactNode;
  className?: string;
}

/** Compact, keyboard-operable disclosure for secondary product information. */
export function InfoDisclosure({
  label,
  children,
  className,
}: InfoDisclosureProps) {
  const detailsRef = useRef<HTMLDetailsElement | null>(null);
  const summaryRef = useRef<HTMLElement | null>(null);
  const [open, setOpen] = useState(false);
  const contentId = useId();
  const classNames = ["info-disclosure", className].filter(Boolean).join(" ");

  const handleKeyDown = (event: KeyboardEvent<HTMLDetailsElement>) => {
    if (event.key !== "Escape" || detailsRef.current?.open !== true) return;

    event.preventDefault();
    detailsRef.current.open = false;
    setOpen(false);
    summaryRef.current?.focus();
  };

  return (
    <details
      ref={detailsRef}
      className={classNames}
      onKeyDown={handleKeyDown}
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary
        ref={summaryRef}
        aria-label={label}
        aria-expanded={open}
        aria-controls={contentId}
        title={label}
      >
        <Icon name="info" size={18} />
        <span className="sr-only">{label}</span>
      </summary>
      <div id={contentId} className="info-disclosure__content">
        {children}
      </div>
    </details>
  );
}
