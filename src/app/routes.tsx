import { Link, Route, Routes } from "react-router-dom";

function HomePage() {
  return (
    <main>
      <h1>SALIDA CyL</h1>
      <Link to="/desde-fp">He terminado FP</Link>
      <Link to="/desde-ocupacion">Quiero trabajar de…</Link>
    </main>
  );
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="*" element={<HomePage />} />
    </Routes>
  );
}
