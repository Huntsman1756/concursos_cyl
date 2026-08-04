import type { ReactNode } from "react";
import { Link } from "react-router-dom";
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
          <Link className="site-name" to="/">
            SALIDA CyL
          </Link>
          <nav className="site-nav" aria-label="Principal">
            <ul>
              <li>
                <Link to="/">Inicio</Link>
              </li>
              <li>
                <Link to="/comparar">Comparar estudios</Link>
              </li>
              <li>
                <Link to="/metodologia">Metodología</Link>
              </li>
            </ul>
          </nav>
        </div>
      </header>
      <main className="page-content" id="main-content" tabIndex={-1}>
        {children}
      </main>
    </>
  );
}
