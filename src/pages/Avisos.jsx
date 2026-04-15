import { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { supabase } from "../lib/supabase";
import { Plus, Trash2, X, Megaphone } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

const EMPTY = { titulo: "", conteudo: "", tipo: "aviso" };

export default function Avisos() {
  const { perfil, canEdit } = useAuth();
  const [avisos, setAvisos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (perfil?.clube_id) load();
  }, [perfil]);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("avisos")
      .select("*, perfis(nome)")
      .eq("clube_id", perfil.clube_id)
      .eq("ativo", true)
      .order("created_at", { ascending: false });
    setAvisos(data || []);
    setLoading(false);
  };

  const save = async () => {
    if (!form.titulo.trim() || !form.conteudo.trim()) {
      alert("Preencha título e conteúdo");
      return;
    }
    setSaving(true);
    await supabase
      .from("avisos")
      .insert({ ...form, clube_id: perfil.clube_id, publicado_por: perfil.id });
    setSaving(false);
    setModal(false);
    setForm(EMPTY);
    load();
  };

  const remover = async (id) => {
    if (!window.confirm("Remover este aviso?")) return;
    await supabase.from("avisos").update({ ativo: false }).eq("id", id);
    load();
  };

  const tipoBorderColor = {
    urgente: "border-red-500",
    aviso: "border-yellow-400",
    informativo: "border-blue-400",
  };

  const tipoBg = {
    urgente: "bg-red-50",
    aviso: "bg-yellow-50",
    informativo: "bg-blue-50",
  };

  const tipoBadge = {
    urgente: "bg-red-100 text-red-700",
    aviso: "bg-yellow-100 text-yellow-700",
    informativo: "bg-blue-100 text-blue-700",
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 p-8 text-gray-500">
        <span className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
        Carregando...
      </div>
    );
  }

  return (
    <div className="fade-in relative">
      {/* Header */}
      <div className="flex justify-between items-start mb-5 flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Comunicação</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {avisos.length} avisos ativos
          </p>
        </div>
        {canEdit() && (
          <button
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
            onClick={() => setModal(true)}
          >
            <Plus size={16} /> Novo aviso
          </button>
        )}
      </div>

      {/* Lista */}
      {avisos.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-xl p-10 flex flex-col items-center gap-2 text-gray-400">
          <Megaphone size={32} />
          <p className="text-sm">Nenhum aviso publicado ainda</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {avisos.map((a) => (
            <div
              key={a.id}
              className={`bg-white border border-gray-100 rounded-xl p-4 border-l-4 ${tipoBorderColor[a.tipo]}`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-9 h-9 rounded-lg ${tipoBg[a.tipo]} flex items-center justify-center flex-shrink-0`}
                >
                  {a.tipo === "urgente"
                    ? "🚨"
                    : a.tipo === "aviso"
                      ? "📢"
                      : "ℹ️"}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1.5">
                    <span className="text-sm font-semibold text-gray-900">
                      {a.titulo}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${tipoBadge[a.tipo]}`}
                    >
                      {a.tipo}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed mb-2">
                    {a.conteudo}
                  </p>
                  <div className="text-xs text-gray-400">
                    Publicado por {a.perfis?.nome || "Sistema"} ·{" "}
                    {format(parseISO(a.created_at), "dd/MM/yyyy 'às' HH:mm", {
                      locale: ptBR,
                    })}
                  </div>
                </div>
                {canEdit() && (
                  <button
                    className="text-gray-400 hover:text-red-500 p-1 rounded-md transition"
                    onClick={() => remover(a.id)}
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div
          className="fixed inset-0 bg-black/60 z-[300] flex items-center justify-center p-4"
          onClick={() => setModal(false)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <h2 className="text-base font-semibold">Novo aviso</h2>
              <button
                className="text-gray-400 hover:text-gray-600 p-1 rounded-md"
                onClick={() => setModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-6 py-5 flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-600">
                  Título *
                </label>
                <input
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.titulo}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, titulo: e.target.value }))
                  }
                  placeholder="Título do aviso"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-600">
                  Tipo
                </label>
                <select
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.tipo}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, tipo: e.target.value }))
                  }
                >
                  <option value="informativo">Informativo</option>
                  <option value="aviso">Aviso</option>
                  <option value="urgente">Urgente</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-600">
                  Conteúdo *
                </label>
                <textarea
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                  rows={5}
                  value={form.conteudo}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, conteudo: e.target.value }))
                  }
                  placeholder="Escreva o comunicado..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100">
              <button
                className="px-4 py-2 text-sm rounded-lg border border-gray-200 hover:bg-gray-50"
                onClick={() => setModal(false)}
              >
                Cancelar
              </button>
              <button
                className="px-4 py-2 text-sm rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium disabled:opacity-60"
                onClick={save}
                disabled={saving}
              >
                {saving ? "Publicando..." : "Publicar aviso"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
