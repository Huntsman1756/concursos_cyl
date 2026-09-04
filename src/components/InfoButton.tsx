import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

interface InfoButtonProps {
  /** Accessible name for the trigger (sr-only text). */
  label: string;
  children: ReactNode;
  className?: string;
}

const VIEWPORT_MARGIN = 8;
const TRIGGER_GAP = 8;
const POPOVER_MAX_WIDTH = 320;

/**
 * Accessible info disclosure: 16px glyph on a ≥44px target, keyboard
 * operable, Escape to close, click-outside to close. Never hover-only.
 *
 * The popover is viewport-positioned and collision-corrected on open (and on
 * scroll/resize while open), so it can never extend the document scroll width.
 */
export function InfoButton({ label, children, className }: InfoButtonProps) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLSpanElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const popoverRef = useRef<HTMLSpanElement | null>(null);
  const popoverId = useId();

  const positionPopover = useCallback(() => {
    const button = buttonRef.current;
    const popover = popoverRef.current;
    if (button === null || popover === null) return;

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const availableWidth = Math.max(160, viewportWidth - VIEWPORT_MARGIN * 2);
    const width = Math.min(POPOVER_MAX_WIDTH, availableWidth);
    popover.style.width = `${width}px`;

    const rect = button.getBoundingClientRect();
    const height = popover.offsetHeight;

    // Horizontal: center on the trigger, then clamp inside the viewport.
    let left = rect.left + rect.width / 2 - width / 2;
    left = Math.min(
      Math.max(left, VIEWPORT_MARGIN),
      Math.max(VIEWPORT_MARGIN, viewportWidth - width - VIEWPORT_MARGIN),
    );

    // Vertical: prefer above the trigger; fall back below; clamp last.
    let top = rect.top - height - TRIGGER_GAP;
    if (top < VIEWPORT_MARGIN) {
      top = rect.bottom + TRIGGER_GAP;
    }
    top = Math.min(
      Math.max(top, VIEWPORT_MARGIN),
      Math.max(VIEWPORT_MARGIN, viewportHeight - height - VIEWPORT_MARGIN),
    );

    popover.style.left = `${left}px`;
    popover.style.top = `${top}px`;
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    positionPopover();
  }, [open, positionPopover]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.stopPropagation();
      setOpen(false);
      buttonRef.current?.focus();
    };
    const handlePointerDown = (event: PointerEvent) => {
      if (wrapRef.current?.contains(event.target as Node)) return;
      setOpen(false);
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("scroll", positionPopover, true);
    window.addEventListener("resize", positionPopover);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("scroll", positionPopover, true);
      window.removeEventListener("resize", positionPopover);
    };
  }, [open, positionPopover]);

  return (
    <span
      className={"info-wrap" + (className ? ` ${className}` : "")}
      ref={wrapRef}
    >
      <button
        ref={buttonRef}
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
      <span
        className="info-popover"
        id={popoverId}
        role="note"
        hidden={!open}
        ref={popoverRef}
      >
        {children}
      </span>
    </span>
  );
}
