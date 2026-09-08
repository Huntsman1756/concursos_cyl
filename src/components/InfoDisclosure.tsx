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
  /**
   * Short visible trigger text (e.g. "Fuente y revisión"). When omitted the
   * compact icon-only trigger is rendered; the accessible name is always the
   * full `label`.
   */
  trigger?: string;
}

/** Compact, keyboard-operable disclosure for secondary product information. */
export function InfoDisclosure({
  label,
  children,
  className,
  trigger,
}: InfoDisclosureProps) {
  const detailsRef = useRef<HTMLDetailsElement | null>(null);
  const summaryRef = useRef<HTMLElement | null>(null);
  const [open, setOpen] = useState(false);
  const contentId = useId();
  const hasVisibleTrigger = typeof trigger === "string" && trigger !== "";
  const classNames = ["info-disclosure"]
    .concat(hasVisibleTrigger ? ["info-disclosure--text-trigger"] : [])
    .concat(className ? [className] : [])
    .join(" ");

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
        {hasVisibleTrigger && (
          <span className="info-disclosure__trigger-text">{trigger}</span>
        )}
        <span className="sr-only">{label}</span>
      </summary>
      <div id={contentId} className="info-disclosure__content">
        {children}
      </div>
    </details>
  );
}
