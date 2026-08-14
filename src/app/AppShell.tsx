import { type ReactNode } from "react";
import { Link, NavLink } from "react-router-dom";
import { Icon } from "../components/Icon";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Saltar al contenido
      </a>
      <header className="app-shell__header">
        <div className="app-shell__header-inner">
          <Link className="brand" to="/" aria-label="SALIDA CyL, inicio">
            <Icon name="briefcase" />
            <span>SALIDA CyL</span>
          </Link>
          <nav className="app-shell__nav" aria-label="Navegación principal">
            <NavLink to="/" end>
              Inicio
            </NavLink>
            <NavLink to="/comparar-estudios">Comparar estudios</NavLink>
            <NavLink to="/metodologia">Metodología</NavLink>
          </nav>
        </div>
      </header>
      <main className="app-shell__main" id="main-content">
        {children}
      </main>
    </div>
  );
}
