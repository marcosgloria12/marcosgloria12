import { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { supabase } from "../lib/supabase";
import { UserCog, Plus, X, Shield } from "lucide-react";

const NIVEIS = ["membro", "secretario", "diretor", "admin"];
const NIVEL_BADGE = {
  admin: "bg-red-100 text-red-700",
  diretor: "bg-purple-100 text-purple-700",
  secretario: "bg-blue-100 text-blue-700",
  membro: "bg-gray-100 text-gray-600",
};

const EMPTY = { nome: "", email: "", password: "", nivel_acesso: "membro" };

export default function GerenciarUsuarios() {
  const { perfil: eu, isAdmin, signUp } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (eu?.clube_id) load();
  }, [eu]);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("perfis")
      .select("*")
      .eq("clube_id", eu.clube_id)
      .order("nivel_acesso");
    setUsuarios(data || []);
    setLoading(false);
  };

  const save = async () => {
    setErro("");
    if (!form.nome || !form.email || !form.password)
      return setErro("Preencha todos os campos obrigatórios.");

    // Admin único: impede criar segundo admin
    if (form.nivel_acesso === "admin") {
      const jaTemAdmin = usuarios.some((u) => u.nivel_acesso === "admin");
      if (jaTemAdmin) return setErro("Já existe um administrador neste clube.");
    }

    setSaving(true);
    const err = await signUp(
      form.email,
      form.password,
      form.nome,
      eu.clube_id,
      form.nivel_acesso,
    );
    setSaving(false);

    if (err) return setErro(err.message);
    setModal(false);
    setForm(EMPTY);
    load();
  };

  const alterarNivel = async (id, nivel) => {
    const alvo = usuarios.find((u) => u.id === id);
    if (alvo?.nivel_acesso === "admin" && id !== eu.id)
      return alert("Não é possível rebaixar outro admin.");
    await supabase.from("perfis").update({ nivel_acesso: nivel }).eq("id", id);
    load();
  };

  const desativar = async (id) => {
    if (id === eu.id)
      return alert("Você não pode desativar sua própria conta.");
    if (!window.confirm("Desativar este usuário?")) return;
    await supabase.from("perfis").update({ ativo: false }).eq("id", id);
    load();
  };

  if (!isAdmin()) {
    return (
      <div className="flex flex-col items-center justify-center p-16 text-gray-400 gap-3">
        <Shield size={40} />
        <p className="text-sm">Acesso restrito a administradores.</p>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div className="flex justify-between items-start mb-5 flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            Gerenciar usuários
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {usuarios.length} usuários no clube
          </p>
        </div>
        <button
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
          onClick={() => {
            setErro("");
            setModal(true);
          }}
        >
          <Plus size={16} /> Novo usuário
        </button>
      </div>

      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center gap-2 p-8 text-gray-500">
            <span className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
            Carregando...
          </div>
        ) : (
          <table className="w-full border-collapse">
            <thead className="bg-gray-50">
              <tr>
                {["Usuário", "Nível de acesso", "Status", "Ações"].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-2.5 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide border-b border-gray-100"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 border-b border-gray-50">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-[#1a3a5c] text-white flex items-center justify-center text-xs font-semibold flex-shrink-0">
                        {u.nome
                          .split(" ")
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join("")}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {u.nome}{" "}
                          {u.id === eu.id && (
                            <span className="text-xs text-gray-400">
                              (você)
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-400">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 border-b border-gray-50">
                    {u.id === eu.id ? (
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${NIVEL_BADGE[u.nivel_acesso]}`}
                      >
                        {u.nivel_acesso}
                      </span>
                    ) : (
                      <select
                        className="border border-gray-200 rounded-lg px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-blue-500"
                        value={u.nivel_acesso}
                        onChange={(e) => alterarNivel(u.id, e.target.value)}
                      >
                        {NIVEIS.map((n) => (
                          <option key={n} value={n}>
                            {n}
                          </option>
                        ))}
                      </select>
                    )}
                  </td>
                  <td className="px-4 py-3 border-b border-gray-50">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.ativo ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"}`}
                    >
                      {u.ativo ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="px-4 py-3 border-b border-gray-50">
                    {u.id !== eu.id && u.ativo && (
                      <button
                        className="text-xs text-red-500 hover:underline"
                        onClick={() => desativar(u.id)}
                      >
                        Desativar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <div
          className="fixed inset-0 bg-black/45 z-[300] flex items-center justify-center p-4"
          onClick={() => setModal(false)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-md shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <h2 className="text-base font-semibold flex items-center gap-2">
                <UserCog size={16} /> Novo usuário
              </h2>
              <button
                className="text-gray-400 hover:text-gray-600 p-1 rounded-md"
                onClick={() => setModal(false)}
              >
                <X size={18} />
              </button>
            </div>
            <div className="px-6 py-5 flex flex-col gap-4">
              {[
                { label: "Nome completo *", key: "nome", type: "text" },
                { label: "E-mail *", key: "email", type: "email" },
                {
                  label: "Senha temporária *",
                  key: "password",
                  type: "password",
                },
              ].map(({ label, key, type }) => (
                <div key={key} className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-600">
                    {label}
                  </label>
                  <input
                    type={type}
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    value={form[key]}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, [key]: e.target.value }))
                    }
                  />
                </div>
              ))}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-600">
                  Nível de acesso
                </label>
                <select
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.nivel_acesso}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, nivel_acesso: e.target.value }))
                  }
                >
                  {NIVEIS.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
              {erro && (
                <div className="bg-red-50 text-red-600 border border-red-200 rounded-lg px-4 py-2.5 text-sm">
                  {erro}
                </div>
              )}
            </div>
            <div className="flex gap-2 justify-end px-6 py-4 border-t border-gray-100">
              <button
                className="px-4 py-2 text-sm rounded-lg border border-gray-200 hover:bg-gray-50 transition"
                onClick={() => setModal(false)}
              >
                Cancelar
              </button>
              <button
                className="px-4 py-2 text-sm rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition disabled:opacity-60"
                onClick={save}
                disabled={saving}
              >
                {saving ? "Criando..." : "Criar usuário"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
