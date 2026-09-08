import { Component, type ReactNode } from "react";
import { useLocation } from "react-router-dom";

import { LoadingSkeleton } from "../components/LoadingSkeleton";

interface RouteLoadBoundaryProps {
  children: ReactNode;
  onRetry?: () => void;
  fallbackRole?: "status" | "alert";
}

interface RouteLoadBoundaryState {
  hasError: boolean;
}

export class RouteLoadBoundary extends Component<
  RouteLoadBoundaryProps,
  RouteLoadBoundaryState
> {
  constructor(props: RouteLoadBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): RouteLoadBoundaryState {
    return { hasError: true };
  }

  handleRetry = () => {
    if (this.props.onRetry) {
      this.props.onRetry();
    } else {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          role={this.props.fallbackRole || "alert"}
          className="route-load-error"
          aria-labelledby="route-load-error-heading"
        >
          <h1 id="route-load-error-heading">
            No hemos podido cargar esta página
          </h1>
          <p>Error al cargar el contenido. Por favor, intente de nuevo.</p>
          <button onClick={this.handleRetry} className="retry-button">
            Reintentar
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export function RouteLoadingFallback() {
  const { pathname } = useLocation();
  const catalog =
    pathname === "/desde-oferta" ||
    /^\/donde-estudiar(?:\/|$)/u.test(pathname) ||
    /^\/desde-(?:fp|ocupacion)\/[^/]+\/ofertas$/u.test(pathname);
  return (
    <div
      className={
        catalog ? "container catalog-loading" : "container route-loading"
      }
    >
      <LoadingSkeleton
        status="Cargando la página…"
        layout={catalog ? "catalog" : "page"}
        className="route-loading__skeleton"
      />
    </div>
  );
}
