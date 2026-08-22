import {
  useCallback,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { useLocation } from "react-router-dom";
import { RouteReadyContext } from "./RouteReadyContext";

interface RouteReadyProviderProps {
  children: ReactNode;
  mainRef: RefObject<HTMLElement | null>;
}

export function RouteReadyProvider({
  children,
  mainRef,
}: RouteReadyProviderProps) {
  const { pathname } = useLocation();
  const announcedPathname = useRef<string | null>(null);
  const [announcement, setAnnouncement] = useState<{
    message: string;
    pathname: string;
  } | null>(null);

  const announce = useCallback(
    (message: string) => {
      if (announcedPathname.current === pathname) return;
      announcedPathname.current = pathname;
      setAnnouncement({ message, pathname });
      const activeElement = document.activeElement;
      if (
        activeElement === document.body ||
        activeElement === mainRef.current
      ) {
        mainRef.current?.focus({ preventScroll: true });
      }
    },
    [mainRef, pathname],
  );

  const visibleAnnouncement =
    announcement?.pathname === pathname ? announcement.message : "";

  return (
    <RouteReadyContext.Provider value={{ announce }}>
      <div
        className="sr-only"
        role="status"
        aria-live="polite"
        aria-label={visibleAnnouncement || undefined}
      >
        {visibleAnnouncement}
      </div>
      {children}
    </RouteReadyContext.Provider>
  );
}
