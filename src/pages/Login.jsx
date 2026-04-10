import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { Navigate } from "react-router-dom";

export default function Login() {
  const { user, signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const err = await signIn(email, password);
    if (err) setError("E-mail ou senha incorretos.");
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen font-sans">
      {/* Lado esquerdo */}
      <div className="flex-1 bg-gradient-to-br from-[#1a3a5c] to-[#0f2540] p-12 flex flex-col items-center justify-center gap-10 text-white">
        <div className="z-10 p-4 flex flex-col items-center justify-center">
          <img
            src="/dbv2.png"
            alt="desbrada_pai "
            height={500}
            width={500}
            className=""
          />
        </div>
      </div>

      {/* Lado direito */}
      <div className="w-[420px] flex flex-col items-center justify-center p-10 bg-white gap-4">
        {/* Card do formulário */}
        <div className="bg-white rounded-2xl p-9 w-full shadow-lg border border-gray-100">
          <div className="mb-7">
            <h2 className="text-xl font-semibold text-gray-900">Entrar</h2>
            <p className="text-sm text-gray-500 mt-1">
              Acesse sua conta do clube
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">
                E-mail
              </label>
              <input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Senha</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 border border-red-200 rounded-lg px-4 py-2.5 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-medium rounded-lg py-2.5 text-sm flex items-center justify-center gap-2 transition"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Entrando...
                </>
              ) : (
                "Conectar"
              )}
            </button>
          </form>

          <p className="text-xs text-gray-400 text-center mt-4">
            Esqueceu a senha?{" "}
            <a
              href="mailto:suporte@desbrasys.com.br"
              className="text-blue-500 hover:underline"
            >
              Fale com o suporte
            </a>
          </p>
        </div>

        <p className="text-xs text-gray-400 text-center">
          © 2026 DesbraSys — Todos os direitos reservados
        </p>
      </div>
    </div>
  );
}
