import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { Navigate } from "react-router-dom";

export default function Login() {
  const { user, signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [changeLayout, setChangeLayout] = useState(false);

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
    <div style={styles.page}>
      <div style={styles.left}>
        <div class="batata">
          <img
            src="/dbv.jpeg"
            alt="Desbravadores"
            height="500"
            width="500"
            margin="center"
          />
        </div>
        {/* <div style={styles.brand}>
          <div style={styles.logoCircle}>D</div>
          <div>
            <div style={styles.brandName}>DesbraSys</div>
            <div style={styles.brandSub}>Gestão de Clubes de Desbravadores</div>
          </div>
        </div>
        <div style={styles.heroText}>
          <h1 style={styles.heroH1}>
            Tudo que seu clube
            <br />
            precisa, em um só lugar.
          </h1>
          <p style={styles.heroP}>
            Membros, presença, eventos, comunicação e relatórios — integrados e
            simples.
          </p>
        </div>
        <div style={styles.features}>
          {[
            ["👥", "Gestão completa de membros"],
            ["✅", "Controle de presença digital"],
            ["📊", "Relatórios automáticos"],
            ["📢", "Comunicados em tempo real"],
          ].map(([icon, txt]) => (
            <div key={txt} style={styles.featureItem}>
              <span style={styles.featureIcon}>{icon}</span>
              <span style={styles.featureTxt}>{txt}</span>
            </div>
          ))}
        </div> */}
      </div>
      <div style={styles.right}>
        <div style={styles.formCard}>
          <div style={styles.formHeader}>
            <h2 style={styles.formTitle}>Entrar</h2>
            <p style={styles.formSub}>Acesse sua conta do clube</p>
          </div>

          <form onSubmit={handleSubmit} style={styles.form}>
            <div className="form-group">
              <label className="form-label">E-mail</label>
              <input
                className="input"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Senha</label>
              <input
                className="input"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && <div style={styles.errorBox}>{error}</div>}

            <button
              type="submit"
              className="btn btn-primary"
              style={{
                width: "100%",
                justifyContent: "center",
                padding: "11px",
                fontSize: "14px",
              }}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span
                    className="spinner"
                    style={{
                      borderColor: "rgba(255,255,255,0.3)",
                      borderTopColor: "#fff",
                    }}
                  ></span>{" "}
                  Entrando...
                </>
              ) : (
                "Conectar"
              )}
            </button>
          </form>

          <p style={styles.forgotPwd}>
            Esqueceu a senha?{" "}
            <a href="mailto:suporte@desbrasys.com.br">Fale com o suporte</a>
          </p>
        </div>
        <p style={styles.copyright}>
          © 2026 DesbraSys — Todos os direitos reservados
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: {
    display: "flex",
    minHeight: "100vh",
    fontFamily: "var(--font)",
  },
  left: {
    flex: 1,
    background: "linear-gradient(160deg, #1a3a5c 0%, #0f2540 100%)",
    padding: "48px",
    display: "flex",
    flexDirection: "column",
    gap: "40px",
    color: "#fff",
  },
  brand: { display: "flex", alignItems: "center", gap: "14px" },
  logoCircle: {
    width: "44px",
    height: "44px",
    background: "#3d9be9",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "20px",
    fontWeight: "700",
    color: "#fff",
  },
  brandName: { fontSize: "20px", fontWeight: "600", color: "#fff" },
  brandSub: {
    fontSize: "12px",
    color: "rgba(255,255,255,0.5)",
    marginTop: "2px",
  },
  heroText: { marginTop: "auto" },
  heroH1: {
    fontFamily: "var(--font-display)",
    fontSize: "36px",
    fontWeight: "400",
    lineHeight: "1.25",
    color: "#fff",
    marginBottom: "16px",
  },
  heroP: {
    fontSize: "15px",
    color: "rgba(255,255,255,0.65)",
    lineHeight: "1.7",
    maxWidth: "380px",
  },
  features: { display: "flex", flexDirection: "column", gap: "12px" },
  featureItem: { display: "flex", alignItems: "center", gap: "12px" },
  featureIcon: { fontSize: "18px", width: "28px", textAlign: "center" },
  featureTxt: { fontSize: "14px", color: "rgba(255,255,255,0.75)" },
  right: {
    width: "420px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px",
    background: "var(--bg-page)",
    gap: "16px",
  },
  formCard: {
    background: "var(--bg-card)",
    borderRadius: "20px",
    padding: "36px",
    width: "100%",
    boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
    border: "1px solid var(--border-light)",
  },
  formHeader: { marginBottom: "28px" },
  formTitle: {
    fontSize: "22px",
    fontWeight: "600",
    color: "var(--text-primary)",
  },
  formSub: {
    fontSize: "13px",
    color: "var(--text-secondary)",
    marginTop: "4px",
  },
  form: { display: "flex", flexDirection: "column", gap: "16px" },
  errorBox: {
    background: "var(--danger-bg)",
    color: "var(--danger)",
    border: "1px solid #f5c6c2",
    borderRadius: "var(--radius-sm)",
    padding: "10px 14px",
    fontSize: "13px",
  },
  forgotPwd: {
    fontSize: "12px",
    color: "var(--text-muted)",
    textAlign: "center",
    marginTop: "16px",
  },
  copyright: {
    fontSize: "11px",
    color: "var(--text-muted)",
    textAlign: "center",
  },
};
