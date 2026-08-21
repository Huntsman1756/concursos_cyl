import { useEffect, useRef, type ReactNode } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import "../styles/global.css";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const location = useLocation();
  const mainRef = useRef<HTMLElement | null>(null);
  const initialPathname = useRef(location.pathname);

  useEffect(() => {
    if (initialPathname.current === location.pathname) return;
    initialPathname.current = location.pathname;
    mainRef.current?.focus({ preventScroll: true });
  }, [location.pathname]);

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
          <nav className="site-nav" aria-label="Principal">
            <ul>
              <li>
                <NavLink to="/" end>
                  Inicio
                </NavLink>
              </li>
              <li>
                <NavLink to="/desde-fp">Desde FP</NavLink>
              </li>
              <li>
                <NavLink to="/desde-ocupacion">Desde ocupación</NavLink>
              </li>
              <li>
                <NavLink to="/comparar">Comparar estudios</NavLink>
              </li>
              <li>
                <NavLink to="/recursos">Más formación</NavLink>
              </li>
              <li>
                <NavLink to="/metodologia">Metodología</NavLink>
              </li>
            </ul>
          </nav>
        </div>
      </header>
      <main
        ref={mainRef}
        className="page-content"
        id="main-content"
        tabIndex={-1}
      >
        {children}
      </main>
      <footer className="site-footer">
        <div className="site-footer__inner">
          <div className="site-footer__identity">
            <strong>SALIDA CyL</strong>
            <span>Proyecto independiente basado en datos públicos.</span>
          </div>
          <nav aria-label="Pie de página">
            <Link to="/datos-abiertos">Datos abiertos</Link>
            <Link to="/metodologia">Metodología</Link>
            <Link to="/metodologia#limitaciones">Limitaciones</Link>
            <Link to="/para-organizaciones">Para organizaciones</Link>
            <Link to="/accesibilidad">Accesibilidad</Link>
          </nav>
          <p>Datos públicos estatales y de Castilla y León</p>
        </div>
      </footer>
    </>
  );
}
