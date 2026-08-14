import { Link, Route, Routes } from "react-router-dom";

function HomePage() {
  return (
    <main>
      <h1>SALIDA CyL</h1>
      <p>Encuentra tu siguiente paso con datos oficiales.</p>
      <nav aria-label="Puntos de entrada">
        <Link to="/desde-fp">He terminado FP</Link>
        <Link to="/desde-ocupacion">Quiero trabajar de…</Link>
      </nav>
    </main>
  );
}

function EntryPlaceholder({ title }: { title: string }) {
  return (
    <main>
      <Link to="/">Volver al inicio</Link>
      <h1>{title}</h1>
      <p>Esta ruta se completará con datos oficiales en la siguiente fase.</p>
    </main>
  );
}

export function AppRoutes() {
  return (
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
      <Route path="*" element={<HomePage />} />
    </Routes>
  );
}
