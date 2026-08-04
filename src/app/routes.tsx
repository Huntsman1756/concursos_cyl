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
            heading="Empezar desde mi título de FP"
            outcome="Relaciona tu ciclo con ofertas y requisitos publicados."
          />,
        )}
      />
      <Route
        path="/desde-ocupacion"
        element={inShell(
          <DestinationPage
            heading="Empezar desde una ocupación"
            outcome="Consulta ciclos y centros relacionados en Castilla y León."
          />,
        )}
      />
      <Route
        path="/comparar"
        element={inShell(
          <DestinationPage
            heading="Comparar estudios"
            outcome="Compara indicadores de empleo e ingresos con su alcance visible."
          />,
        )}
      />
      <Route
        path="/metodologia"
        element={inShell(
          <DestinationPage
            heading="Metodología"
            outcome="Consulta cómo se seleccionan, actualizan y explican las fuentes."
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
