import type { ReactNode } from "react";
import { Link, Route, Routes } from "react-router-dom";
import { HomePage } from "../features/home/HomePage";
import { AppShell } from "./AppShell";

interface DestinationPageProps {
  heading: string;
  outcome: string;
}

function DestinationPage({ heading, outcome }: DestinationPageProps) {
  return (
    <section className="home-hero">
      <h1>{heading}</h1>
      <p className="home-hero__intro">{outcome}</p>
      <p>
        <Link to="/">Volver al inicio</Link>
      </p>
    </section>
  );
}

function inShell(element: ReactNode) {
  return <AppShell>{element}</AppShell>;
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={inShell(<HomePage />)} />
      <Route
        path="/desde-fp"
        element={inShell(
          <DestinationPage
            heading="Ruta desde FP — en preparación"
            outcome="Esta función todavía no está disponible. La próxima fase añadirá la selección de ciclos y ofertas relacionadas."
          />,
        )}
      />
      <Route
        path="/desde-ocupacion"
        element={inShell(
          <DestinationPage
            heading="Ruta por ocupación — en preparación"
            outcome="Esta función todavía no está disponible. La próxima fase añadirá la búsqueda de ciclos y centros por ocupación."
          />,
        )}
      />
      <Route
        path="/comparar"
        element={inShell(
          <DestinationPage
            heading="Comparar estudios — en preparación"
            outcome="Esta función todavía no está disponible. La próxima fase añadirá indicadores de empleo e ingresos con su alcance."
          />,
        )}
      />
      <Route
        path="/metodologia"
        element={inShell(
          <DestinationPage
            heading="Metodología — en preparación"
            outcome="Esta función todavía no está disponible. La próxima fase añadirá las fuentes, criterios y fechas de actualización."
          />,
        )}
      />
      <Route
        path="*"
        element={inShell(
          <DestinationPage
            heading="Página no encontrada"
            outcome="La dirección no corresponde a una página disponible."
          />,
        )}
      />
    </Routes>
  );
}
