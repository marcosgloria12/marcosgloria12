import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function ProtectedRoute({ children, requiredLevel = null }) {
  const { user, perfil, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex items-center gap-2 text-gray-500">
          <span className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
          Carregando...
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  const LEVELS = { membro: 0, secretario: 1, diretor: 2, admin: 3 };

  if (requiredLevel && LEVELS[perfil?.nivel_acesso] < LEVELS[requiredLevel]) {
    return <Navigate to="/" replace />;
  }

  return children;
}
