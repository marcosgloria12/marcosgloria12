import { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { supabase } from "../lib/supabase";
import { Plus, Search, Edit2, Trash2, Phone, Mail, X } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

const CLASSES = [
  "Amigo",
  "Companheiro",
  "Pesquisador",
  "Pioneiro",
  "Excursionista",
  "Guia",
];
const EMPTY_FORM = {
  nome: "",
  data_nascimento: "",
  sexo: "",
  telefone: "",
  email: "",
  nome_responsavel: "",
  telefone_responsavel: "",
  classe: "Amigo",
  observacoes: "",
  ativo: true,
  data_ingresso: new Date().toISOString().split("T")[0],
};

export default function Membros() {
  const { perfil, canEdit } = useAuth();
  const [membros, setMembros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("ativo");
  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deletando, setDeletando] = useState(null);

  useEffect(() => {
    if (perfil?.clube_id) load();
  }, [perfil, filtroStatus]);

  const load = async () => {
    setLoading(true);
    let q = supabase
      .from("membros")
      .select("*")
      .eq("clube_id", perfil.clube_id)
      .order("nome");
    if (filtroStatus !== "todos") q = q.eq("ativo", filtroStatus === "ativo");
    const { data } = await q;
    setMembros(data || []);
    setLoading(false);
  };

  const filtered = membros.filter(
    (m) =>
      m.nome.toLowerCase().includes(search.toLowerCase()) ||
      (m.classe || "").toLowerCase().includes(search.toLowerCase()),
  );

  const openNew = () => {
    setForm(EMPTY_FORM);
    setEditando(null);
    setModal(true);
  };
  const openEdit = (m) => {
    setForm({ ...m });
    setEditando(m.id);
    setModal(true);
  };
  const closeModal = () => {
    setModal(false);
    setEditando(null);
    setForm(EMPTY_FORM);
  };

  const save = async () => {
    if (!form.nome.trim()) return alert("Nome é obrigatório");
    setSaving(true);
    if (editando) {
      await supabase
        .from("membros")
        .update({ ...form })
        .eq("id", editando);
    } else {
      await supabase
        .from("membros")
        .insert({ ...form, clube_id: perfil.clube_id });
    }
    setSaving(false);
    closeModal();
    load();
  };

  const remove = async (id) => {
    if (!window.confirm("Desativar este membro?")) return;
    setDeletando(id);
    await supabase.from("membros").update({ ativo: false }).eq("id", id);
    setDeletando(null);
    load();
  };

  const field = (key, val) => setForm((f) => ({ ...f, [key]: val }));
  const idade = (dob) => {
    if (!dob) return null;
    const diff = new Date() - new Date(dob);
    return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
  };

  return (
    <div className="fade-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-5 gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Membros</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {filtered.length} {filtroStatus === "ativo" ? "ativos" : "membros"}{" "}
            encontrados
          </p>
        </div>
        {canEdit() && (
          <button
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
            onClick={openNew}
          >
            <Plus size={16} /> Novo membro
          </button>
        )}
      </div>

      {/* Filtros */}
      <div className="flex gap-2.5 mb-4 flex-wrap">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 flex-1 max-w-sm">
          <Search size={15} className="text-gray-400" />
          <input
            className="border-none outline-none bg-transparent text-sm text-gray-800 flex-1 placeholder-gray-400"
            placeholder="Buscar por nome ou classe..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          value={filtroStatus}
          onChange={(e) => setFiltroStatus(e.target.value)}
        >
          <option value="ativo">Ativos</option>
          <option value="inativo">Inativos</option>
          <option value="todos">Todos</option>
        </select>
      </div>

      {/* Tabela */}
      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center gap-2 p-8 text-gray-500">
            <span className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
            Carregando...
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 p-10 text-gray-400">
            <p className="text-sm">Nenhum membro encontrado</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="bg-gray-50">
                <tr>
                  {["Nome", "Classe", "Idade", "Responsável", "Status", ""].map(
                    (h, i) => (
                      <th
                        key={i}
                        className="px-4 py-2.5 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide border-b border-gray-100 whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {filtered.map((m) => (
                  <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 border-b border-gray-50 text-sm text-gray-800">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-[#1a3a5c] text-white flex items-center justify-center text-xs font-semibold flex-shrink-0">
                          {m.nome
                            .split(" ")
                            .map((n) => n[0])
                            .slice(0, 2)
                            .join("")}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {m.nome}
                          </div>
                          {m.email && (
                            <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                              <Mail size={10} />
                              {m.email}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 border-b border-gray-50 text-sm hidden md:table-cell">
                      <span className="text-xs text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full border border-gray-200">
                        {m.classe}
                      </span>
                    </td>
                    <td className="px-4 py-3 border-b border-gray-50 text-sm text-gray-600 hidden md:table-cell">
                      {idade(m.data_nascimento) !== null
                        ? `${idade(m.data_nascimento)} anos`
                        : "—"}
                    </td>
                    <td className="px-4 py-3 border-b border-gray-50 hidden md:table-cell">
                      <div className="text-sm text-gray-800">
                        {m.nome_responsavel || "—"}
                      </div>
                      {m.telefone_responsavel && (
                        <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                          <Phone size={10} />
                          {m.telefone_responsavel}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 border-b border-gray-50">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${m.ativo ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}
                      >
                        {m.ativo ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    {canEdit() && (
                      <td className="px-4 py-3 border-b border-gray-50 text-right">
                        <div className="flex gap-1 justify-end">
                          <button
                            className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 transition"
                            onClick={() => openEdit(m)}
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            className="p-1.5 rounded-md hover:bg-red-50 text-red-400 transition"
                            onClick={() => remove(m.id)}
                            disabled={deletando === m.id}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div
          className="fixed inset-0 bg-black/45 z-[300] flex items-center justify-center p-4"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <h2 className="text-base font-semibold">
                {editando ? "Editar membro" : "Novo membro"}
              </h2>
              <button
                className="text-gray-400 hover:text-gray-600 p-1 rounded-md"
                onClick={closeModal}
              >
                <X size={18} />
              </button>
            </div>
            <div className="px-6 py-5 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-3">
                {[
                  {
                    label: "Nome completo *",
                    key: "nome",
                    type: "text",
                    placeholder: "Nome do desbravador",
                  },
                  {
                    label: "Data de nascimento",
                    key: "data_nascimento",
                    type: "date",
                  },
                ].map(({ label, key, type, placeholder }) => (
                  <div key={key} className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-gray-600">
                      {label}
                    </label>
                    <input
                      className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                      type={type}
                      value={form[key]}
                      onChange={(e) => field(key, e.target.value)}
                      placeholder={placeholder}
                    />
                  </div>
                ))}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-600">
                    Sexo
                  </label>
                  <select
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    value={form.sexo}
                    onChange={(e) => field("sexo", e.target.value)}
                  >
                    <option value="">Selecione</option>
                    <option value="M">Masculino</option>
                    <option value="F">Feminino</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-600">
                    Classe
                  </label>
                  <select
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    value={form.classe}
                    onChange={(e) => field("classe", e.target.value)}
                  >
                    {CLASSES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                {[
                  {
                    label: "Telefone",
                    key: "telefone",
                    placeholder: "(27) 99999-9999",
                  },
                  {
                    label: "E-mail",
                    key: "email",
                    type: "email",
                    placeholder: "email@exemplo.com",
                  },
                  { label: "Nome do responsável", key: "nome_responsavel" },
                  {
                    label: "Telefone do responsável",
                    key: "telefone_responsavel",
                  },
                  {
                    label: "Data de ingresso",
                    key: "data_ingresso",
                    type: "date",
                  },
                ].map(({ label, key, type = "text", placeholder }) => (
                  <div key={key} className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-gray-600">
                      {label}
                    </label>
                    <input
                      className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                      type={type}
                      value={form[key]}
                      onChange={(e) => field(key, e.target.value)}
                      placeholder={placeholder}
                    />
                  </div>
                ))}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-600">
                    Status
                  </label>
                  <select
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    value={form.ativo}
                    onChange={(e) => field("ativo", e.target.value === "true")}
                  >
                    <option value="true">Ativo</option>
                    <option value="false">Inativo</option>
                  </select>
                </div>
              </div>
              <div className="flex flex-col gap-1 mt-3">
                <label className="text-xs font-medium text-gray-600">
                  Observações
                </label>
                <textarea
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                  value={form.observacoes}
                  onChange={(e) => field("observacoes", e.target.value)}
                  rows={3}
                  placeholder="Notas adicionais..."
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end px-6 py-4 border-t border-gray-100">
              <button
                className="px-4 py-2 text-sm rounded-lg border border-gray-200 hover:bg-gray-50 transition"
                onClick={closeModal}
              >
                Cancelar
              </button>
              <button
                className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition disabled:opacity-60"
                onClick={save}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />{" "}
                    Salvando...
                  </>
                ) : editando ? (
                  "Salvar alterações"
                ) : (
                  "Cadastrar membro"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
