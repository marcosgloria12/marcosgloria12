import { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { supabase } from "../lib/supabase";
import { Plus, X, Headphones } from "lucide-react";

const EMPTY = { titulo: "", descricao: "", categoria: "duvida" };

export function Suporte() {
  const { perfil } = useAuth();
  const [tickets, setTickets] = useState([]);
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
      .from("tickets_suporte")
      .select("*")
      .eq("clube_id", perfil.clube_id)
      .order("created_at", { ascending: false });
    setTickets(data || []);
    setLoading(false);
  };

  const save = async () => {
    if (!form.titulo.trim() || !form.descricao.trim())
      return alert("Preencha todos os campos");
    setSaving(true);
    await supabase
      .from("tickets_suporte")
      .insert({ ...form, clube_id: perfil.clube_id, aberto_por: perfil.id });
    setSaving(false);
    setModal(false);
    setForm(EMPTY);
    load();
  };

  const statusBadge = (status) => {
    const map = {
      aberto: "bg-blue-100 text-blue-700",
      em_andamento: "bg-yellow-100 text-yellow-700",
      fechado: "bg-gray-100 text-gray-500",
    };
    return map[status] || "bg-gray-100 text-gray-500";
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
          <h1 className="text-xl font-semibold text-gray-900">Suporte</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Abertura e acompanhamento de chamados
          </p>
        </div>
        <button
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
          onClick={() => setModal(true)}
        >
          <Plus size={16} /> Abrir chamado
        </button>
      </div>

      {tickets.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-xl p-10 flex flex-col items-center gap-2 text-gray-400">
          <Headphones size={32} />
          <p className="text-sm">Nenhum chamado aberto</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {tickets.map((t) => (
            <div
              key={t.id}
              className="bg-white border border-gray-100 rounded-xl p-4 flex items-start gap-3.5"
            >
              <div className="flex-1">
                <div className="flex gap-2 items-center flex-wrap mb-1.5">
                  <span className="font-semibold text-sm text-gray-900">
                    {t.titulo}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusBadge(t.status)}`}
                  >
                    {t.status.replace("_", " ")}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-blue-50 text-blue-600">
                    {t.categoria}
                  </span>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">
                  {t.descricao}
                </p>
                <div className="text-xs text-gray-400 mt-2">
                  Aberto em {new Date(t.created_at).toLocaleDateString("pt-BR")}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <div
          className="fixed inset-0 bg-black/45 z-[300] flex items-center justify-center p-4"
          onClick={() => setModal(false)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <h2 className="text-base font-semibold">Novo chamado</h2>
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
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-600">
                  Categoria
                </label>
                <select
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.categoria}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, categoria: e.target.value }))
                  }
                >
                  <option value="duvida">Dúvida</option>
                  <option value="tecnico">Técnico</option>
                  <option value="sugestao">Sugestão</option>
                  <option value="erro">Erro no sistema</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-600">
                  Descrição *
                </label>
                <textarea
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                  rows={4}
                  value={form.descricao}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, descricao: e.target.value }))
                  }
                />
              </div>
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
                {saving ? "Enviando..." : "Abrir chamado"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Configuracoes ───────────────────────────────────────────────────────────

export function Configuracoes() {
  const { perfil } = useAuth();
  const [form, setForm] = useState({
    nome: perfil?.nome || "",
    telefone: perfil?.telefone || "",
  });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    await supabase
      .from("perfis")
      .update({ nome: form.nome, telefone: form.telefone })
      .eq("id", perfil?.id);
    setSaving(false);
    alert("Perfil atualizado!");
  };

  const nivelBadge = {
    admin: "bg-purple-100 text-purple-700",
    lider: "bg-blue-100 text-blue-700",
    membro: "bg-gray-100 text-gray-600",
  };

  return (
    <div className="fade-in">
      <div className="mb-5">
        <h1 className="text-xl font-semibold text-gray-900">Configurações</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Gerencie seu perfil e preferências
        </p>
      </div>

      <div
        className="grid gap-4"
        style={{ gridTemplateColumns: "minmax(0,1fr) minmax(0,2fr)" }}
      >
        {/* Card perfil */}
        <div className="bg-white border border-gray-100 rounded-xl p-5 text-center">
          <div className="w-16 h-16 rounded-full bg-[#1a3a5c] text-white flex items-center justify-center text-xl font-semibold mx-auto mb-3">
            {perfil?.nome
              ?.split(" ")
              .map((n) => n[0])
              .slice(0, 2)
              .join("")}
          </div>
          <div className="font-semibold text-base text-gray-900">
            {perfil?.nome}
          </div>
          <div className="text-xs text-gray-400 mt-1 mb-3">{perfil?.email}</div>
          <span
            className={`text-xs px-2.5 py-1 rounded-full font-medium ${nivelBadge[perfil?.nivel_acesso] || "bg-gray-100 text-gray-600"}`}
          >
            {perfil?.nivel_acesso}
          </span>
          <div className="text-xs text-gray-400 mt-3">
            Clube: {perfil?.clubes?.nome}
          </div>
        </div>

        {/* Formulário */}
        <div className="bg-white border border-gray-100 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">
            Editar perfil
          </h3>
          <div className="flex flex-col gap-3.5">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600">
                Nome completo
              </label>
              <input
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                value={form.nome}
                onChange={(e) =>
                  setForm((f) => ({ ...f, nome: e.target.value }))
                }
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600">
                Telefone
              </label>
              <input
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                value={form.telefone}
                onChange={(e) =>
                  setForm((f) => ({ ...f, telefone: e.target.value }))
                }
                placeholder="(27) 99999-9999"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600">
                E-mail
              </label>
              <input
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 opacity-60 cursor-not-allowed"
                value={perfil?.email || ""}
                disabled
              />
              <span className="text-xs text-gray-400">
                O e-mail não pode ser alterado aqui
              </span>
            </div>
            <button
              className="self-start px-4 py-2 text-sm rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition disabled:opacity-60"
              onClick={save}
              disabled={saving}
            >
              {saving ? "Salvando..." : "Salvar alterações"}
            </button>
          </div>
        </div>
      </div>

      {/* Info sistema */}
      <div className="bg-white border border-gray-100 rounded-xl p-5 mt-4">
        <h3 className="text-sm font-semibold text-gray-800 mb-3">
          Sobre o sistema
        </h3>
        <div className="grid grid-cols-3 gap-3 text-sm">
          {[
            ["Versão", "v1.0.0"],
            ["Desenvolvedor", "DesbraSys Team"],
            ["Suporte", "suporte@desbrasys.com.br"],
          ].map(([k, v]) => (
            <div key={k}>
              <div className="text-xs text-gray-400 mb-0.5">{k}</div>
              <div className="font-medium text-gray-800">{v}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Noticias ────────────────────────────────────────────────────────────────

export function Noticias() {
  const { perfil, canEdit } = useAuth();
  const [noticias, setNoticias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({
    titulo: "",
    conteudo: "",
    imagem_url: "",
    publicado: true,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (perfil?.clube_id) load();
  }, [perfil]);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("noticias")
      .select("*, perfis(nome)")
      .eq("clube_id", perfil.clube_id)
      .order("created_at", { ascending: false });
    setNoticias(data || []);
    setLoading(false);
  };

  const save = async () => {
    if (!form.titulo.trim() || !form.conteudo.trim())
      return alert("Preencha título e conteúdo");
    setSaving(true);
    await supabase
      .from("noticias")
      .insert({ ...form, clube_id: perfil.clube_id, publicado_por: perfil.id });
    setSaving(false);
    setModal(false);
    setForm({ titulo: "", conteudo: "", imagem_url: "", publicado: true });
    load();
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
          <h1 className="text-xl font-semibold text-gray-900">Notícias</h1>
          <p className="text-sm text-gray-500 mt-0.5">Publicações do clube</p>
        </div>
        {canEdit() && (
          <button
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
            onClick={() => setModal(true)}
          >
            <Plus size={16} /> Nova notícia
          </button>
        )}
      </div>

      {noticias.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-xl p-10 flex flex-col items-center gap-2 text-gray-400">
          <p className="text-sm">Nenhuma notícia publicada</p>
        </div>
      ) : (
        <div
          className="grid gap-3"
          style={{
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          }}
        >
          {noticias.map((n) => (
            <div
              key={n.id}
              className="bg-white border border-gray-100 rounded-xl p-4 flex flex-col gap-2.5"
            >
              {n.imagem_url && (
                <img
                  src={n.imagem_url}
                  alt={n.titulo}
                  className="w-full h-40 object-cover rounded-lg border border-gray-100"
                />
              )}
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium self-start ${n.publicado ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}
              >
                {n.publicado ? "Publicado" : "Rascunho"}
              </span>
              <h3 className="text-sm font-semibold text-gray-900">
                {n.titulo}
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                {n.conteudo.slice(0, 120)}
                {n.conteudo.length > 120 ? "..." : ""}
              </p>
              <div className="text-xs text-gray-400">
                Por {n.perfis?.nome} ·{" "}
                {new Date(n.created_at).toLocaleDateString("pt-BR")}
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <div
          className="fixed inset-0 bg-black/45 z-[300] flex items-center justify-center p-4"
          onClick={() => setModal(false)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <h2 className="text-base font-semibold">Nova notícia</h2>
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
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-600">
                  URL da imagem (opcional)
                </label>
                <input
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.imagem_url}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, imagem_url: e.target.value }))
                  }
                  placeholder="https://..."
                />
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
                />
              </div>
              <label className="flex items-center gap-2 text-sm cursor-pointer text-gray-700">
                <input
                  type="checkbox"
                  checked={form.publicado}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, publicado: e.target.checked }))
                  }
                />
                Publicar imediatamente
              </label>
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
                {saving ? "Salvando..." : "Publicar notícia"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
