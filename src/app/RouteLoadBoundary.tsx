import { Component, type ReactNode } from "react";

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
  return (
    <div role="status" aria-live="polite" className="loading-fallback">
      Cargando...
    </div>
  );
}
