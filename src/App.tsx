import {
  BrowserRouter,
  HashRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { DashboardPage } from "@/pages/DashboardPage";
import { EditorPage } from "@/pages/EditorPage";

const isElectron = import.meta.env.VITE_IS_ELECTRON === "true";

function routerBasename(): string | undefined {
  if (isElectron) return undefined;
  const base = import.meta.env.BASE_URL;
  if (!base || base === "/" || base === "./") return undefined;
  return base.replace(/\/$/, "");
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<AppShell />}>
        <Route index element={<DashboardPage />} />
        <Route path="d/:documentId" element={<EditorPage />} />
        <Route path="contracts/:id" element={<Navigate to="/" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export function App() {
  // file:// loads need HashRouter; BrowserRouter is for the web deploy.
  if (isElectron) {
    return (
      <HashRouter>
        <AppRoutes />
      </HashRouter>
    );
  }

  return (
    <BrowserRouter basename={routerBasename()}>
      <AppRoutes />
    </BrowserRouter>
  );
}

