import type { ReactNode } from "react";
import { Link, Route, Routes } from "react-router-dom";

import { CompareStudiesPage } from "../features/compare-studies/CompareStudiesPage";
import { HomePage } from "../features/home/HomePage";
import { OccupationResultsPage } from "../features/occupation-first/OccupationResultsPage";
import { OccupationSearchPage } from "../features/occupation-first/OccupationSearchPage";
import { TrainingResultsPage } from "../features/training-first/TrainingResultsPage";
import { TrainingRoutePage } from "../features/training-first/TrainingRoutePage";
import { TrainingSearchPage } from "../features/training-first/TrainingSearchPage";
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
      <Route path="/desde-fp" element={inShell(<TrainingSearchPage />)} />
      <Route
        path="/desde-fp/:programKey"
        element={inShell(<TrainingResultsPage />)}
      />
      <Route
        path="/formacion/:programKey"
        element={inShell(<TrainingRoutePage />)}
      />
      <Route
        path="/desde-ocupacion"
        element={inShell(<OccupationSearchPage />)}
      />
      <Route
        path="/desde-ocupacion/:occupationId"
        element={inShell(<OccupationResultsPage />)}
      />
      <Route path="/comparar" element={inShell(<CompareStudiesPage />)} />
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
