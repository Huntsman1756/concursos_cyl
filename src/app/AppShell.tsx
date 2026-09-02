import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";

import { RouteReadyProvider } from "./RouteReady";
import { titleForPathname } from "./routeTitles";
import "../styles/global.css";
import "../styles/visualRefresh.css";
import "../styles/salida.css";

interface AppShellProps {
  children: ReactNode;
}

const DESKTOP_NAV_QUERY = "(min-width: 48rem)";

const PRIMARY_LINKS: Array<{ to: string; label: string }> = [
  { to: "/desde-fp", label: "Explorar" },
  { to: "/desde-oferta", label: "Ofertas" },
  { to: "/donde-estudiar", label: "Dónde estudiar" },
  { to: "/comparar", label: "Comparar estudios" },
];

const SECONDARY_LINKS: Array<{ to: string; label: string }> = [
  { to: "/recursos", label: "Más formación" },
  { to: "/datos-abiertos", label: "Datos abiertos" },
  { to: "/metodologia", label: "Metodología" },
  { to: "/accesibilidad", label: "Accesibilidad" },
];

function MobileMenuIcon({ open }: { open: boolean }) {
  return open ? (
    <svg
      className="icon"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="18" x2="6" y1="6" y2="18" />
      <line x1="6" x2="18" y1="6" y2="18" />
    </svg>
  ) : (
    <svg
      className="icon"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="4" x2="20" y1="6" y2="6" />
      <line x1="4" x2="20" y1="12" y2="12" />
      <line x1="4" x2="20" y1="18" y2="18" />
    </svg>
  );
}

export function AppShell({ children }: AppShellProps) {
  const location = useLocation();
  const mainRef = useRef<HTMLElement | null>(null);
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);
  const locationSignature = [
    location.key,
    location.pathname,
    location.search,
    location.hash,
  ].join("|");
  const previousLocationSignature = useRef(locationSignature);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    document.title = titleForPathname(location.pathname);
  }, [location.pathname]);

  useEffect(() => {
    if (previousLocationSignature.current === locationSignature) return;
    previousLocationSignature.current = locationSignature;

    queueMicrotask(() => setMenuOpen(false));
  }, [locationSignature]);

  useEffect(() => {
    const closeOnDesktopResize = () => {
      const isDesktop =
        typeof window.matchMedia === "function"
          ? window.matchMedia(DESKTOP_NAV_QUERY).matches
          : window.innerWidth >= 768;
      if (isDesktop) setMenuOpen(false);
    };

    window.addEventListener("resize", closeOnDesktopResize);
    return () => window.removeEventListener("resize", closeOnDesktopResize);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;

      event.preventDefault();
      setMenuOpen(false);
      menuButtonRef.current?.focus();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [menuOpen]);

  return (
    <>
      <a className="skip-link" href="#main-content">
        Saltar al contenido
      </a>
      <header className="header">
        <div className="container header-bar">
          <Link className="wordmark" to="/">
            SALIDA <span className="cyl">CyL</span>
          </Link>
          <nav className="header-secondary" aria-label="Enlaces secundarios">
            {SECONDARY_LINKS.map((link) => (
              <NavLink key={link.to} to={link.to}>
                {link.label}
              </NavLink>
            ))}
          </nav>
          <button
            ref={menuButtonRef}
            className="menu-button"
            type="button"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <MobileMenuIcon open={menuOpen} />
            Menú
          </button>
        </div>
        <nav className="global-nav" aria-label="Navegación principal">
          <div className="container">
            <ul className="global-nav-list">
              {PRIMARY_LINKS.map((link) => (
                <li key={link.to}>
                  <NavLink className="global-nav-link" to={link.to}>
                    {link.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        </nav>
        <div
          className={"mobile-menu" + (menuOpen ? " is-open" : "")}
          id="mobile-menu"
          hidden={!menuOpen}
        >
          <ul className="mobile-menu-list">
            {PRIMARY_LINKS.map((link) => (
              <li key={link.to}>
                <NavLink to={link.to} onClick={() => setMenuOpen(false)}>
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>
          <div className="mobile-menu-secondary">
            {SECONDARY_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </NavLink>
            ))}
          </div>
        </div>
      </header>
      <RouteReadyProvider mainRef={mainRef}>
        <main
          ref={mainRef}
          className="page-content"
          id="main-content"
          aria-label="Contenido principal"
          tabIndex={-1}
        >
          {children}
        </main>
      </RouteReadyProvider>
      <footer className="footer">
        <div className="container">
          <div className="footer-grid">
            <div>
              <h2 className="footer-group-title">Explorar</h2>
              <ul className="footer-group-list">
                <li>
                  <Link to="/desde-fp">Desde tu FP</Link>
                </li>
                <li>
                  <Link to="/desde-ocupacion">Desde una profesión</Link>
                </li>
                <li>
                  <Link to="/desde-oferta">Desde una oferta</Link>
                </li>
                <li>
                  <Link to="/donde-estudiar">Dónde estudiar</Link>
                </li>
              </ul>
            </div>
            <div>
              <h2 className="footer-group-title">Datos y método</h2>
              <ul className="footer-group-list">
                <li>
                  <Link to="/metodologia">Metodología</Link>
                </li>
                <li>
                  <Link to="/datos-abiertos">Datos abiertos</Link>
                </li>
                <li>
                  <Link to="/comparar">Comparar estudios</Link>
                </li>
                <li>
                  <Link to="/recursos">Más formación</Link>
                </li>
              </ul>
            </div>
            <div>
              <h2 className="footer-group-title">Información</h2>
              <ul className="footer-group-list">
                <li>
                  <Link to="/accesibilidad">Accesibilidad</Link>
                </li>
                <li>
                  <Link to="/para-organizaciones">Para organizaciones</Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <p className="caption">
              SALIDA CyL — orientación profesional con datos públicos de
              Castilla y León.
            </p>
            <p className="caption">
              Imágenes editoriales generadas mediante IA.
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
