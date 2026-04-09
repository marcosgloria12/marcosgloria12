import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth'
import AppLayout from './components/layout/AppLayout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Membros from './pages/Membros'
import Presenca from './pages/Presenca'
import Avisos from './pages/Avisos'
import Eventos from './pages/Eventos'
import Relatorios from './pages/Relatorios'
import { Suporte, Configuracoes, Noticias } from './pages/OutrasPages'
import './styles/global.css'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: '12px', color: '#5a6a7e', fontFamily: 'var(--font)' }}>
      <span className="spinner" />
      Carregando...
    </div>
  )
  return user ? children : <Navigate to="/login" replace />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={
        <PrivateRoute>
          <AppLayout />
        </PrivateRoute>
      }>
        <Route index element={<Dashboard />} />
        <Route path="membros" element={<Membros />} />
        <Route path="presenca" element={<Presenca />} />
        <Route path="noticias" element={<Noticias />} />
        <Route path="avisos" element={<Avisos />} />
        <Route path="eventos" element={<Eventos />} />
        <Route path="relatorios" element={<Relatorios />} />
        <Route path="suporte" element={<Suporte />} />
        <Route path="configuracoes" element={<Configuracoes />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
