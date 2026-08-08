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
              SALIDA CyL
            </Link>
            <span className="site-descriptor">Decide tu siguiente paso</span>
          </div>
          <nav className="site-nav" aria-label="Principal">
            <ul>
              <li>
                <NavLink to="/" end>
                  Inicio
                </NavLink>
              </li>
              <li>
                <NavLink to="/comparar">Comparar</NavLink>
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
          <p>
            SALIDA CyL es un proyecto independiente que utiliza fuentes
            públicas.
          </p>
          <Link to="/metodologia">Metodología y fuentes</Link>
        </div>
      </footer>
    </>
  );
}
