import { Link, Route, Routes } from "react-router-dom";
import { AppShell } from "./AppShell";
import { HomePage } from "../features/home/HomePage";

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
        <Route
          path="/desde-fp"
          element={<EntryPlaceholder title="He terminado FP" />}
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
