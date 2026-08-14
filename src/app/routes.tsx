import { useEffect, useState } from "react";
import { Link, Route, Routes, useParams } from "react-router-dom";
import { AppShell } from "./AppShell";
import { HomePage } from "../features/home/HomePage";
import { TrainingSearchPage } from "../features/training-first/TrainingSearchPage";
import { TrainingResultsPage } from "../features/training-first/TrainingResultsPage";
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

function EntryPlaceholder({ title }: { title: string }) {
  return (
    <div className="placeholder-page">
      <Link to="/">Volver al inicio</Link>
      <h1>{title}</h1>
      <p>Esta ruta se completará con datos oficiales en la siguiente fase.</p>
    </div>
  );
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
          path="/desde-ocupacion"
          element={<EntryPlaceholder title="Quiero trabajar de…" />}
        />
        <Route
          path="/comparar-estudios"
          element={<EntryPlaceholder title="Comparar estudios" />}
        />
        <Route
          path="/metodologia"
          element={<EntryPlaceholder title="Metodología" />}
        />
        <Route path="*" element={<HomePage />} />
      </Routes>
    </AppShell>
  );
}
