import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import ProtectedRoute from "./components/ProtectedRoute";
import AppLayout from "./components/layout/AppLayout";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Membros from "./pages/Membros";
import Eventos from "./pages/Eventos";
import Presenca from "./pages/Presenca";
import Avisos from "./pages/Avisos";
import Relatorios from "./pages/Relatorios";
import GerenciarUsuarios from "./pages/GerenciarUsuarios";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Dashboard />} />
            <Route path="/membros" element={<Membros />} />
            <Route path="/eventos" element={<Eventos />} />
            <Route path="/presenca" element={<Presenca />} />
            <Route path="/avisos" element={<Avisos />} />
            <Route path="/relatorios" element={<Relatorios />} />

            <Route
              path="/usuarios"
              element={
                <ProtectedRoute requiredLevel="admin">
                  <GerenciarUsuarios />
                </ProtectedRoute>
              }
            />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
