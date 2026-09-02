import { useEffect, useId, useRef, useState, type ReactNode } from "react";

interface InfoButtonProps {
  /** Accessible name for the trigger (sr-only text). */
  label: string;
  children: ReactNode;
  className?: string;
}

/**
 * Accessible info disclosure: 16px glyph on a ≥44px target, keyboard
 * operable, Escape to close, click-outside to close. Never hover-only.
 */
export function InfoButton({ label, children, className }: InfoButtonProps) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLSpanElement | null>(null);
  const popoverId = useId();

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.stopPropagation();
      setOpen(false);
    };
    const handlePointerDown = (event: PointerEvent) => {
      if (wrapRef.current?.contains(event.target as Node)) return;
      setOpen(false);
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [open]);

  return (
    <span
      className={"info-wrap" + (className ? ` ${className}` : "")}
      ref={wrapRef}
    >
      <button
        className="info-button"
        type="button"
        aria-expanded={open}
        aria-controls={popoverId}
        onClick={() => setOpen((value) => !value)}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4" />
          <path d="M12 8h.01" />
        </svg>
        <span className="sr-only">{label}</span>
      </button>
      <span className="info-popover" id={popoverId} role="note" hidden={!open}>
        {children}
      </span>
    </span>
  );
}
