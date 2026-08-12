import type { ReactNode } from "react";
import { Link, NavLink } from "react-router-dom";
import "../styles/global.css";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
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
      <main className="page-content" id="main-content" tabIndex={-1}>
        {children}
      </main>
      <footer className="site-footer">
        <div className="site-footer__inner">
          <div className="site-footer__identity">
            <strong>SALIDA CyL</strong>
            <span>Proyecto independiente basado en datos públicos.</span>
          </div>
          <nav aria-label="Pie de página">
            <Link to="/metodologia">Fuentes</Link>
            <Link to="/metodologia">Metodología</Link>
            <Link to="/metodologia">Limitaciones</Link>
            <Link to="/metodologia">Accesibilidad</Link>
          </nav>
          <p>Datos públicos estatales y de Castilla y León</p>
        </div>
      </footer>
    </>
  );
}
