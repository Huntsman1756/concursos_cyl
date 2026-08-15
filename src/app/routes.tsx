import { useEffect, useState } from "react";
import { Link, Route, Routes, useParams } from "react-router-dom";
import { AppShell } from "./AppShell";
import { HomePage } from "../features/home/HomePage";
import { TrainingSearchPage } from "../features/training-first/TrainingSearchPage";
import { TrainingResultsPage } from "../features/training-first/TrainingResultsPage";
import { OccupationSearchPage } from "../features/occupation-first/OccupationSearchPage";
import { OccupationResultsPage } from "../features/occupation-first/OccupationResultsPage";
import { CompareStudiesPage } from "../features/compare-studies/CompareStudiesPage";
import { MethodologyPage } from "../features/methodology/MethodologyPage";
import { EcylResourcesPage } from "../features/resources/EcylResourcesPage";
import {
  GeneratedManifestSchema,
  OutcomeIndicatorsSchema,
  TrainingProgramsSchema,
  type GeneratedManifest,
  type OutcomeIndicator,
  type TrainingProgram,
} from "../../data/schemas/generated";
import { loadGeneratedResource } from "../data/generatedDataClient";
import {
  loadTrainingData,
  type TrainingFeatureData,
} from "../features/training-first/trainingData";

function TrainingResultsRoute() {
  const { programKey = "" } = useParams();
  const [data, setData] = useState<TrainingFeatureData | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    void loadTrainingData().then(
      (value) => {
        if (active) setData(value);
      },
      () => {
        if (active) setError(true);
      },
    );
    return () => {
      active = false;
    };
  }, []);

  if (error) {
    return (
      <div className="journey-page">
        <h1>No se pudieron cargar los datos</h1>
        <Link to="/desde-fp">Volver a buscar un ciclo</Link>
      </div>
    );
  }
  if (!data) return <p role="status">Cargando datos oficiales…</p>;
  return <TrainingResultsPage programKey={programKey} data={data} />;
}

function OccupationSearchRoute() {
  const [data, setData] = useState<TrainingFeatureData | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    let active = true;
    void loadTrainingData().then(
      (value) => {
        if (active) setData(value);
      },
      () => {
        if (active) setError(true);
      },
    );
    return () => {
      active = false;
    };
  }, []);
  if (error)
    return (
      <p role="status">No se pudieron cargar las ocupaciones revisadas.</p>
    );
  if (!data) return <p role="status">Cargando ocupaciones revisadas…</p>;
  return (
    <OccupationSearchPage
      occupations={data.occupations}
      aliases={data.aliases}
    />
  );
}

function OccupationResultsRoute() {
  const { occupationId = "" } = useParams();
  const [data, setData] = useState<TrainingFeatureData | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    let active = true;
    void loadTrainingData().then(
      (value) => {
        if (active) setData(value);
      },
      () => {
        if (active) setError(true);
      },
    );
    return () => {
      active = false;
    };
  }, []);
  if (error)
    return <p role="status">No se pudieron cargar las rutas revisadas.</p>;
  if (!data) return <p role="status">Cargando rutas revisadas…</p>;
  return <OccupationResultsPage occupationId={occupationId} data={data} />;
}

function CompareStudiesRoute() {
  const [data, setData] = useState<{
    programs: TrainingProgram[];
    indicators: OutcomeIndicator[];
  } | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    let active = true;
    void Promise.all([
      loadGeneratedResource("/data/v1/programs.json", TrainingProgramsSchema),
      loadGeneratedResource(
        "/data/v1/outcome-indicators.json",
        OutcomeIndicatorsSchema,
      ),
    ]).then(
      ([programs, indicators]) => {
        if (active) setData({ programs, indicators });
      },
      () => {
        if (active) setError(true);
      },
    );
    return () => {
      active = false;
    };
  }, []);
  if (error)
    return (
      <p role="status">No se pudieron cargar los indicadores oficiales.</p>
    );
  if (!data) return <p role="status">Cargando indicadores oficiales…</p>;
  return <CompareStudiesPage data={data} />;
}

function MethodologyRoute() {
  const [manifest, setManifest] = useState<GeneratedManifest | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    let active = true;
    void loadGeneratedResource(
      "/data/v1/manifest.json",
      GeneratedManifestSchema,
    ).then(
      (value) => {
        if (active) setManifest(value);
      },
      () => {
        if (active) setError(true);
      },
    );
    return () => {
      active = false;
    };
  }, []);
  if (error)
    return <p role="status">No se pudo cargar el manifiesto de datos.</p>;
  if (!manifest) return <p role="status">Cargando metodología…</p>;
  return <MethodologyPage manifest={manifest} />;
}

export function AppRoutes() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/desde-fp" element={<TrainingSearchPage />} />
        <Route
          path="/desde-fp/:programKey"
          element={<TrainingResultsRoute />}
        />
        <Route
          path="/formacion/:programKey"
          element={<TrainingResultsRoute />}
        />
        <Route path="/desde-ocupacion" element={<OccupationSearchRoute />} />
        <Route
          path="/desde-ocupacion/:occupationId"
          element={<OccupationResultsRoute />}
        />
        <Route path="/comparar" element={<CompareStudiesRoute />} />
        <Route path="/comparar-estudios" element={<CompareStudiesRoute />} />
        <Route path="/recursos" element={<EcylResourcesPage />} />
        <Route path="/metodologia" element={<MethodologyRoute />} />
        <Route path="*" element={<HomePage />} />
      </Routes>
    </AppShell>
  );
}
