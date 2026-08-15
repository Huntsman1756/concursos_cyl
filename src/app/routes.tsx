import { lazy, Suspense } from "react";
import { Link, Route, Routes, useLocation } from "react-router-dom";

import { HomePage } from "../features/home/HomePage";
import { AppShell } from "./AppShell";
import { RouteLoadBoundary, RouteLoadingFallback } from "./RouteLoadBoundary";

const CompareStudiesPage = lazy(() =>
  import("../features/compare-studies/CompareStudiesPage").then((module) => ({
    default: module.CompareStudiesPage,
  })),
);
const MethodologyPage = lazy(() =>
  import("../features/methodology/MethodologyPage").then((module) => ({
    default: module.MethodologyPage,
  })),
);
const EcylResourcesPage = lazy(() =>
  import("../features/resources/EcylResourcesPage").then((module) => ({
    default: module.EcylResourcesPage,
  })),
);
const OccupationResultsPage = lazy(() =>
  import("../features/occupation-first/OccupationResultsPage").then(
    (module) => ({ default: module.OccupationResultsPage }),
  ),
);
const OccupationSearchPage = lazy(() =>
  import("../features/occupation-first/OccupationSearchPage").then(
    (module) => ({ default: module.OccupationSearchPage }),
  ),
);
const TrainingResultsPage = lazy(() =>
  import("../features/training-first/TrainingResultsPage").then((module) => ({
    default: module.TrainingResultsPage,
  })),
);
const TrainingRoutePage = lazy(() =>
  import("../features/training-first/TrainingRoutePage").then((module) => ({
    default: module.TrainingRoutePage,
  })),
);
const TrainingSearchPage = lazy(() =>
  import("../features/training-first/TrainingSearchPage").then((module) => ({
    default: module.TrainingSearchPage,
  })),
);

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

export function AppRoutes() {
  const location = useLocation();

  return (
    <AppShell>
      <RouteLoadBoundary key={location.pathname}>
        <Suspense fallback={<RouteLoadingFallback />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/desde-fp" element={<TrainingSearchPage />} />
            <Route
              path="/desde-fp/:programKey"
              element={<TrainingResultsPage />}
            />
            <Route
              path="/formacion/:programKey"
              element={<TrainingRoutePage />}
            />
            <Route path="/desde-ocupacion" element={<OccupationSearchPage />} />
            <Route
              path="/desde-ocupacion/:occupationId"
              element={<OccupationResultsPage />}
            />
            <Route path="/comparar" element={<CompareStudiesPage />} />
            <Route path="/recursos" element={<EcylResourcesPage />} />
            <Route path="/metodologia" element={<MethodologyPage />} />
            <Route
              path="*"
              element={
                <DestinationPage
                  heading="Página no encontrada"
                  outcome="La dirección no corresponde a una página disponible."
                />
              }
            />
          </Routes>
        </Suspense>
      </RouteLoadBoundary>
    </AppShell>
  );
}
