import { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { supabase } from "../lib/supabase";
import { Plus, CheckCircle, XCircle, Save, X, ChevronLeft } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { createPortal } from "react-dom";

const EMPTY_EVENTO = {
  titulo: "",
  tipo: "reuniao",
  data_inicio: new Date().toISOString().slice(0, 16),
  local: "",
  obrigatorio: true,
};

export default function Presenca() {
  const { perfil, canEdit } = useAuth();
  const [eventos, setEventos] = useState([]);
  const [eventoSel, setEventoSel] = useState(null);
  const [membros, setMembros] = useState([]);
  const [presencas, setPresencas] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalEvento, setModalEvento] = useState(false);
  const [formEvento, setFormEvento] = useState(EMPTY_EVENTO);
  const [view, setView] = useState("list");

  useEffect(() => {
    if (perfil?.clube_id) loadEventos();
  }, [perfil]);

  const loadEventos = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("eventos")
      .select("*")
      .eq("clube_id", perfil.clube_id)
      .order("data_inicio", { ascending: false });
    setEventos(data || []);
    setLoading(false);
  };

  const abrirRegistro = async (evento) => {
    setEventoSel(evento);
    setView("registrar");
    const { data: mbs } = await supabase
      .from("membros")
      .select("id, nome, classe")
      .eq("clube_id", perfil.clube_id)
      .eq("ativo", true)
      .order("nome");
    setMembros(mbs || []);
    const { data: prs } = await supabase
      .from("presencas")
      .select("*")
      .eq("evento_id", evento.id);
    const map = {};
    (prs || []).forEach((p) => {
      map[p.membro_id] = p;
    });
    setPresencas(map);
  };

  const togglePresenca = (membroId) => {
    setPresencas((prev) => ({
      ...prev,
      [membroId]: {
        ...prev[membroId],
        membro_id: membroId,
        evento_id: eventoSel.id,
        presente: !prev[membroId]?.presente,
      },
    }));
  };

  const marcarTodos = (val) => {
    const map = {};
    membros.forEach((m) => {
      map[m.id] = { membro_id: m.id, evento_id: eventoSel.id, presente: val };
    });
    setPresencas(map);
  };

  const salvarPresenca = async () => {
    setSaving(true);
    const upserts = Object.values(presencas).map((p) => ({
      evento_id: p.evento_id,
      membro_id: p.membro_id,
      presente: p.presente || false,
      registrado_por: perfil.id,
    }));
    await supabase
      .from("presencas")
      .upsert(upserts, { onConflict: "evento_id,membro_id" });
    setSaving(false);
    alert("Presença salva com sucesso!");
  };

  const criarEvento = async () => {
    if (!formEvento.titulo.trim()) return alert("Título obrigatório");
    await supabase.from("eventos").insert({
      ...formEvento,
      clube_id: perfil.clube_id,
      created_by: perfil.id,
    });
    setModalEvento(false);
    setFormEvento(EMPTY_EVENTO);
    loadEventos();
  };

  const presentes = Object.values(presencas).filter((p) => p.presente).length;
  const pct =
    membros.length > 0 ? Math.round((presentes / membros.length) * 100) : 0;

  if (loading)
    return (
      <div className="flex items-center gap-2 p-8 text-gray-500">
        <span className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
        Carregando...
      </div>
    );

  return (
    <div className="fade-in">
      {view === "list" ? (
        <>
          <div className="flex justify-between items-start mb-5 flex-wrap gap-3">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Presença</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Registro de frequência por reunião e evento
              </p>
            </div>
            {canEdit() && (
              <button
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
                onClick={() => setModalEvento(true)}
              >
                <Plus size={16} /> Nova reunião
              </button>
            )}
          </div>

          <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
            {eventos.length === 0 ? (
              <div className="flex flex-col items-center gap-2 p-10 text-gray-400">
                <p className="text-sm">Nenhum evento cadastrado ainda</p>
              </div>
            ) : (
              eventos.map((e) => {
                const dt = parseISO(e.data_inicio);
                return (
                  <div
                    key={e.id}
                    className="flex items-center gap-3.5 px-5 py-3.5 border-b border-gray-50 last:border-0 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => abrirRegistro(e)}
                  >
                    <div className="w-10 h-11 bg-[#1a3a5c] rounded-lg flex flex-col items-center justify-center flex-shrink-0">
                      <span className="text-base font-semibold text-white leading-none">
                        {format(dt, "dd")}
                      </span>
                      <span className="text-[10px] text-white/60 uppercase">
                        {format(dt, "MMM", { locale: ptBR })}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">
                        {e.titulo}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {format(dt, "HH:mm")} · {e.local || "Local a definir"}
                      </div>
                    </div>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${e.tipo === "reuniao" ? "bg-blue-100 text-blue-700" : "bg-yellow-100 text-yellow-700"}`}
                    >
                      {e.tipo}
                    </span>
                    <span className="text-xs text-blue-600 font-medium">
                      Registrar →
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center gap-3 mb-5 flex-wrap">
            <button
              className="flex items-center gap-1 text-sm border border-gray-200 hover:bg-gray-50 px-3 py-1.5 rounded-lg transition"
              onClick={() => setView("list")}
            >
              <ChevronLeft size={14} /> Voltar
            </button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                {eventoSel?.titulo}
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {eventoSel?.data_inicio &&
                  format(
                    parseISO(eventoSel.data_inicio),
                    "dd/MM/yyyy 'às' HH:mm",
                    { locale: ptBR },
                  )}
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="flex gap-3 items-center mb-3.5 flex-wrap">
            <div className="bg-white border border-gray-100 rounded-xl px-5 py-3 flex flex-col items-center min-w-[90px]">
              <span className="text-2xl font-semibold text-green-600">
                {presentes}
              </span>
              <span className="text-xs text-gray-400">presentes</span>
            </div>
            <div className="bg-white border border-gray-100 rounded-xl px-5 py-3 flex flex-col items-center min-w-[90px]">
              <span className="text-2xl font-semibold text-red-500">
                {membros.length - presentes}
              </span>
              <span className="text-xs text-gray-400">ausentes</span>
            </div>
            <div className="bg-white border border-gray-100 rounded-xl px-5 py-3 flex flex-col items-center min-w-[90px]">
              <span className="text-2xl font-semibold text-[#1a3a5c]">
                {pct}%
              </span>
              <span className="text-xs text-gray-400">frequência</span>
            </div>
            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden min-w-[100px]">
              <div
                className="h-full bg-green-500 rounded-full transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

          {/* Ações */}
          <div className="flex gap-2 mb-3 flex-wrap">
            <button
              className="text-sm border border-gray-200 hover:bg-gray-50 px-3 py-1.5 rounded-lg transition"
              onClick={() => marcarTodos(true)}
            >
              Marcar todos presentes
            </button>
            <button
              className="text-sm border border-gray-200 hover:bg-gray-50 px-3 py-1.5 rounded-lg transition"
              onClick={() => marcarTodos(false)}
            >
              Limpar todos
            </button>
            <button
              className="flex items-center gap-1.5 ml-auto bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-1.5 rounded-lg transition disabled:opacity-60"
              onClick={salvarPresenca}
              disabled={saving}
            >
              {saving ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />{" "}
                  Salvando...
                </>
              ) : (
                <>
                  <Save size={14} /> Salvar presença
                </>
              )}
            </button>
          </div>

          <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
            {membros.map((m) => {
              const p = presencas[m.id];
              const presente = p?.presente || false;
              return (
                <div
                  key={m.id}
                  className={`flex items-center gap-3 px-5 py-3 border-b border-gray-50 last:border-0 cursor-pointer transition-colors ${presente ? "bg-green-50/40" : "hover:bg-gray-50"}`}
                  onClick={() => canEdit() && togglePresenca(m.id)}
                >
                  <div className="w-9 h-9 rounded-full bg-[#1a3a5c] text-white flex items-center justify-center text-xs font-semibold flex-shrink-0">
                    {m.nome
                      .split(" ")
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join("")}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">
                      {m.nome}
                    </div>
                    <div className="text-xs text-gray-400">{m.classe}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-sm font-medium ${presente ? "text-green-600" : "text-gray-400"}`}
                    >
                      {presente ? "Presente" : "Ausente"}
                    </span>
                    {presente ? (
                      <CheckCircle size={22} className="text-green-500" />
                    ) : (
                      <XCircle size={22} className="text-gray-300" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Modal novo evento */}
      {modalEvento &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={() => setModalEvento(false)}
          >
            <div
              className="bg-white rounded-2xl w-full max-w-lg shadow-2xl animate-scaleIn relative"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
                <h2 className="text-base font-semibold">
                  Nova reunião / evento
                </h2>
                <button
                  className="text-gray-400 hover:text-gray-600 p-1 rounded-md"
                  onClick={() => setModalEvento(false)}
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
                    value={formEvento.titulo}
                    onChange={(e) =>
                      setFormEvento((f) => ({ ...f, titulo: e.target.value }))
                    }
                    placeholder="Ex: Reunião semanal"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-gray-600">
                      Tipo
                    </label>
                    <select
                      className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                      value={formEvento.tipo}
                      onChange={(e) =>
                        setFormEvento((f) => ({ ...f, tipo: e.target.value }))
                      }
                    >
                      <option value="reuniao">Reunião</option>
                      <option value="evento">Evento</option>
                      <option value="acampamento">Acampamento</option>
                      <option value="culto">Culto</option>
                      <option value="outro">Outro</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-gray-600">
                      Data e hora
                    </label>
                    <input
                      className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                      type="datetime-local"
                      value={formEvento.data_inicio}
                      onChange={(e) =>
                        setFormEvento((f) => ({
                          ...f,
                          data_inicio: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-600">
                    Local
                  </label>
                  <input
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    value={formEvento.local}
                    onChange={(e) =>
                      setFormEvento((f) => ({ ...f, local: e.target.value }))
                    }
                    placeholder="Ex: Igreja Central — Sala 3"
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end px-6 py-4 border-t border-gray-100">
                <button
                  className="px-4 py-2 text-sm rounded-lg border border-gray-200 hover:bg-gray-50 transition"
                  onClick={() => setModalEvento(false)}
                >
                  Cancelar
                </button>
                <button
                  className="px-4 py-2 text-sm rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition"
                  onClick={criarEvento}
                >
                  Criar evento
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
