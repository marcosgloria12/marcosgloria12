import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { supabase } from "../lib/supabase";
import { Plus, X, Tent } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

const EMPTY = {
  titulo: "",
  descricao: "",
  tipo: "evento",
  data_inicio: "",
  data_fim: "",
  local: "",
  obrigatorio: false,
};

export default function Eventos() {
  const { perfil, canEdit } = useAuth();
  const [eventos, setEventos] = useState([]);
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
      .from("eventos")
      .select("*")
      .eq("clube_id", perfil.clube_id)
      .order("data_inicio", { ascending: false });
    setEventos(data || []);
    setLoading(false);
  };

  const save = async () => {
    if (!form.titulo.trim() || !form.data_inicio)
      return alert("Título e data obrigatórios");
    setSaving(true);
    await supabase
      .from("eventos")
      .insert({ ...form, clube_id: perfil.clube_id, created_by: perfil.id });
    setSaving(false);
    setModal(false);
    setForm(EMPTY);
    load();
  };

  const field = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const tipoIcon = {
    reuniao: "📋",
    evento: "🎯",
    acampamento: "🏕",
    culto: "✝️",
    outro: "📌",
  };

  if (loading)
    return (
      <div className="flex items-center gap-2 p-8 text-gray-500">
        <span className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
        Carregando...
      </div>
    );

  return (
    <div className="fade-in">
      <div className="flex justify-between items-start mb-5 flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Eventos</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Calendário de atividades do clube
          </p>
        </div>
        {canEdit() && (
          <button
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
            onClick={() => setModal(true)}
          >
            <Plus size={16} /> Novo evento
          </button>
        )}
      </div>

      {eventos.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-xl p-10 flex flex-col items-center gap-2 text-gray-400">
          <Tent size={32} />
          <p className="text-sm">Nenhum evento cadastrado</p>
        </div>
      ) : (
        <div
          className="grid gap-3"
          style={{
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          }}
        >
          {eventos.map((e) => {
            const dt = parseISO(e.data_inicio);
            return (
              <div
                key={e.id}
                className="bg-white border border-gray-100 rounded-xl p-4 flex flex-col gap-2.5"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-11 bg-[#1a3a5c] rounded-lg flex flex-col items-center justify-center flex-shrink-0">
                    <span className="text-base font-semibold text-white leading-none">
                      {format(dt, "dd")}
                    </span>
                    <span className="text-[10px] text-white/60 uppercase">
                      {format(dt, "MMM", { locale: ptBR })}
                    </span>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900">
                      {e.titulo}
                    </div>
                    <div className="text-xs text-gray-400">
                      {tipoIcon[e.tipo]} {e.tipo}
                    </div>
                  </div>
                </div>
                {e.descricao && (
                  <p className="text-xs text-gray-500 leading-relaxed">
                    {e.descricao}
                  </p>
                )}
                {e.local && (
                  <div className="text-xs text-gray-400">📍 {e.local}</div>
                )}
                {e.data_fim && (
                  <div className="text-xs text-gray-400">
                    Até{" "}
                    {format(parseISO(e.data_fim), "dd/MM/yyyy", {
                      locale: ptBR,
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {modal &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={() => setModal(false)}
          >
            <div
              className="bg-white rounded-2xl w-full max-w-lg shadow-2xl animate-scaleIn relative"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
                <h2 className="text-lg font-bold text-gray-900">Novo evento</h2>
                <button
                  className="text-gray-400 hover:text-gray-600 p-1"
                  onClick={() => setModal(false)}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Form */}
              <div className="px-6 py-5 flex flex-col gap-4 max-h-[75vh] overflow-y-auto">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-700 uppercase">
                    Título *
                  </label>
                  <input
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    value={form.titulo}
                    onChange={(e) => field("titulo", e.target.value)}
                    placeholder="Ex: Reunião de Planejamento"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-gray-700 uppercase">
                      Início *
                    </label>
                    <input
                      type="datetime-local"
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                      value={form.data_inicio}
                      onChange={(e) => field("data_inicio", e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-gray-700 uppercase">
                      Fim
                    </label>
                    <input
                      type="datetime-local"
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                      value={form.data_fim}
                      onChange={(e) => field("data_fim", e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-700 uppercase">
                    Local
                  </label>
                  <input
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    value={form.local}
                    onChange={(e) => field("local", e.target.value)}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-700 uppercase">
                    Descrição
                  </label>
                  <textarea
                    rows={3}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    value={form.descricao}
                    onChange={(e) => field("descricao", e.target.value)}
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="flex gap-2 justify-end px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
                <button
                  className="px-5 py-2 text-sm font-medium rounded-lg border border-gray-300 hover:bg-white transition"
                  onClick={() => setModal(false)}
                >
                  Cancelar
                </button>
                <button
                  className="px-5 py-2 text-sm font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition disabled:opacity-50 shadow-md"
                  onClick={save}
                  disabled={saving}
                >
                  {saving ? "Salvando..." : "Criar evento"}
                </button>
              </div>
            </div>
          </div>,
          document.body, // Renderiza no nível mais alto do site
        )}
    </div>
  );
}
