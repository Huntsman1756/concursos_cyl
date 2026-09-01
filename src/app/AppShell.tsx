import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Icon } from "../components/Icon";
import { RouteReadyProvider } from "./RouteReady";
import { titleForPathname } from "./routeTitles";
import "../styles/global.css";
import "../styles/visualRefresh.css";

interface AppShellProps {
  children: ReactNode;
}

const DESKTOP_NAV_QUERY = "(min-width: 48rem)";

interface PrimaryNavigationLinksProps {
  onNavigate?: () => void;
  mobile?: boolean;
}

function PrimaryNavigationLinks({
  onNavigate,
  mobile = false,
}: PrimaryNavigationLinksProps) {
  return (
    <ul>
      <li>
        <NavLink to="/" end onClick={onNavigate}>
          Explorar
        </NavLink>
      </li>
      <li>
        <NavLink to="/desde-oferta" onClick={onNavigate}>
          Ofertas
        </NavLink>
      </li>
      <li>
        <NavLink to="/donde-estudiar" onClick={onNavigate}>
          Dónde estudiar
        </NavLink>
      </li>
      <li>
        <NavLink to="/metodologia" onClick={onNavigate}>
          Datos y método
        </NavLink>
      </li>
      <li>
        <details open={mobile} className="site-nav__more">
          <summary>Más</summary>
          <ul>
            <li>
              <NavLink to="/desde-fp" onClick={onNavigate}>
                Explorar FP
              </NavLink>
            </li>
            <li>
              <NavLink to="/desde-ocupacion" onClick={onNavigate}>
                Buscar profesión
              </NavLink>
            </li>
            <li>
              <NavLink to="/comparar" onClick={onNavigate}>
                Comparar ingresos
              </NavLink>
            </li>
            <li>
              <NavLink to="/recursos" onClick={onNavigate}>
                Formación complementaria
              </NavLink>
            </li>
            <li>
              <NavLink to="/datos-abiertos" onClick={onNavigate}>
                Datos abiertos
              </NavLink>
            </li>
            <li>
              <NavLink to="/metodologia" onClick={onNavigate}>
                Método y límites
              </NavLink>
            </li>
            <li>
              <NavLink to="/para-organizaciones" onClick={onNavigate}>
                Para organizaciones
              </NavLink>
            </li>
            <li>
              <NavLink to="/accesibilidad" onClick={onNavigate}>
                Accesibilidad
              </NavLink>
            </li>
          </ul>
        </details>
      </li>
    </ul>
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
      <header className="site-header">
        <div className="site-header__inner">
          <div className="site-identity">
            <Link className="site-name" to="/">
              <span>SALIDA</span> CyL
            </Link>
            <span className="site-descriptor">
              FP y empleo con datos públicos
            </span>
          </div>
          <button
            ref={menuButtonRef}
            className="site-menu-button"
            type="button"
            aria-label={
              menuOpen ? "Cerrar menú principal" : "Abrir menú principal"
            }
            aria-expanded={menuOpen}
            aria-controls="mobile-primary-navigation"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <Icon name={menuOpen ? "x" : "menu"} size={22} />
          </button>
          <nav className="site-nav site-nav--desktop" aria-label="Principal">
            <PrimaryNavigationLinks />
          </nav>
          <nav
            className="site-nav site-nav--mobile"
            id="mobile-primary-navigation"
            aria-label="Principal móvil"
            hidden={!menuOpen}
          >
            <PrimaryNavigationLinks
              mobile
              onNavigate={() => setMenuOpen(false)}
            />
          </nav>
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
      <footer className="site-footer">
        <div className="site-footer__inner">
          <div className="site-footer__identity">
            <strong>SALIDA CyL</strong>
            <span>
              Proyecto independiente basado en datos públicos de Castilla y
              León, para el X Concurso de Datos Abiertos.
            </span>
          </div>
          <nav aria-label="Pie de página">
            <Link to="/">Explorar</Link>
            <Link to="/desde-fp">Explorar FP</Link>
            <Link to="/desde-ocupacion">Buscar profesión</Link>
            <Link to="/desde-oferta">Ofertas</Link>
            <Link to="/donde-estudiar">Dónde estudiar</Link>
            <Link to="/comparar">Comparar ingresos</Link>
            <Link to="/recursos">Formación complementaria</Link>
            <Link to="/datos-abiertos">Datos abiertos</Link>
            <Link to="/metodologia">Método y límites</Link>
            <Link to="/metodologia#limitaciones">Limitaciones</Link>
            <Link to="/para-organizaciones">Para organizaciones</Link>
            <Link to="/accesibilidad">Accesibilidad</Link>
          </nav>
        </div>
      </footer>
    </>
  );
}
