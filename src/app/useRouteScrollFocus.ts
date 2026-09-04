import { useEffect, useRef } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

/**
 * Deliberate route navigation behavior:
 *
 * - navigating to a DIFFERENT pathname (push/replace) starts the new page at
 *   the top and moves focus to <main>, so keyboard users are never left on a
 *   vanished control;
 * - same-pathname updates (filters, search params) never jump the user;
 * - hash navigation scrolls to the target anchor;
 * - Back/Forward (POP) restores the scroll position saved for that history
 *   entry instead of forcing the document to the top.
 */
export function useRouteScrollFocus(
  mainRef: React.RefObject<HTMLElement | null>,
): void {
  const location = useLocation();
  const navigationType = useNavigationType();

  const scrollByLocationKey = useRef(new Map<string, number>());
  const keyRef = useRef(location.key);
  const previousKey = useRef<string | null>(null);
  const previousPathname = useRef<string | null>(null);

  useEffect(() => {
    // This hook owns scroll restoration; the browser's native per-entry
    // restoration would race with it on Back/Forward.
    if ("scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }
    return () => {
      if ("scrollRestoration" in history) {
        history.scrollRestoration = "auto";
      }
    };
  }, []);

  // Track the scroll offset of the CURRENT entry continuously. Saving at
  // navigation time is too late: after the route commit the document has
  // already collapsed and window.scrollY is clamped to the shorter page.
  useEffect(() => {
    const save = () => {
      scrollByLocationKey.current.set(keyRef.current, window.scrollY);
      if (scrollByLocationKey.current.size > 50) {
        const oldest = scrollByLocationKey.current.keys().next().value;
        if (oldest !== undefined) scrollByLocationKey.current.delete(oldest);
      }
    };
    const onScroll = () => save();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    keyRef.current = location.key;

    const isFirstNavigation = previousKey.current === null;
    const pathnameChanged = previousPathname.current !== location.pathname;
    previousKey.current = location.key;
    previousPathname.current = location.pathname;

    if (isFirstNavigation && location.hash === "") return;

    if (location.hash !== "") {
      const anchorId = location.hash.slice(1);
      // Hash jumps must work both for in-page links and for DIRECT loads of a
      // hashed URL, where the fragment target only exists after the route's
      // data resolves. Retry within a bounded window until the target appears.
      let frames = 0;
      const jump = () => {
        const target =
          anchorId === "" ? null : document.getElementById(anchorId);
        if (target !== null) {
          target.scrollIntoView();
          target.focus({ preventScroll: true });
          return;
        }
        frames += 1;
        if (frames < 120) window.requestAnimationFrame(jump);
      };
      window.requestAnimationFrame(jump);
      return;
    }

    if (navigationType === "POP") {
      const saved = scrollByLocationKey.current.get(location.key);
      if (saved === undefined) return;
      // Restore after the (possibly lazy) route content has painted. Images
      // and lazy chunks can still grow the document for a few frames, so the
      // restore retries within a bounded window until the offset holds.
      let frames = 0;
      const restore = () => {
        window.scrollTo(0, saved);
        frames += 1;
        if (frames < 60 && Math.abs(window.scrollY - saved) > 1) {
          window.requestAnimationFrame(restore);
        }
      };
      window.requestAnimationFrame(restore);
      return;
    }

    if (!pathnameChanged) return;

    window.scrollTo(0, 0);
    mainRef.current?.focus({ preventScroll: true });
  }, [location, mainRef, navigationType]);
}
