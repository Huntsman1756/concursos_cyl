import { Route, Routes } from "react-router-dom";
import { HomePage } from "../features/home/HomePage";
import { AppShell } from "./AppShell";

export function AppRoutes() {
  return (
    <Routes>
      <Route
        path="*"
        element={
          <AppShell>
            <HomePage />
          </AppShell>
        }
      />
    </Routes>
  );
}
