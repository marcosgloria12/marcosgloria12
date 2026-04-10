import { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";
import {
  Users,
  CheckSquare,
  Tent,
  Megaphone,
  TrendingUp,
  Clock,
  UserPlus,
  AlertCircle,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Dashboard() {
  const { perfil } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    membros: 0,
    lideres: 0,
    avisos: 0,
    proximoEvento: null,
  });
  const [atividades, setAtividades] = useState([]);
  const [avisos, setAvisos] = useState([]);
  const [eventos, setEventos] = useState([]);
  const [ultimaPresenca, setUltimaPresenca] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (perfil?.clube_id) loadDashboard();
  }, [perfil]);

  const loadDashboard = async () => {
    console.log("clube_id:", perfil?.clube_id); // ← adicione isso
    console.log("perfil completo:", perfil); // ← e isso

    const cid = perfil.clube_id;
    const [
      { count: totalMembros },
      { count: totalLideres },
      { count: totalAvisos },
      { data: proxEventos },
      { data: avisosData },
      { data: membrosRecentes },
    ] = await Promise.all([
      supabase
        .from("membros")
        .select("*", { count: "exact", head: true })
        .eq("clube_id", cid)
        .eq("ativo", true),
      supabase
        .from("perfis")
        .select("*", { count: "exact", head: true })
        .eq("clube_id", cid)
        .eq("ativo", true),
      supabase
        .from("avisos")
        .select("*", { count: "exact", head: true })
        .eq("clube_id", cid)
        .eq("ativo", true),
      supabase
        .from("eventos")
        .select("*")
        .eq("clube_id", cid)
        .gte("data_inicio", new Date().toISOString())
        .order("data_inicio")
        .limit(3),
      supabase
        .from("avisos")
        .select("*")
        .eq("clube_id", cid)
        .eq("ativo", true)
        .order("created_at", { ascending: false })
        .limit(4),
      supabase
        .from("membros")
        .select("*")
        .eq("clube_id", cid)
        .eq("ativo", true)
        .order("created_at", { ascending: false })
        .limit(4),
    ]);

    const { data: ultimoEvento } = await supabase
      .from("eventos")
      .select("id, titulo, data_inicio")
      .eq("clube_id", cid)
      .lte("data_inicio", new Date().toISOString())
      .order("data_inicio", { ascending: false })
      .limit(1)
      .single();

    if (ultimoEvento) {
      const { count: presentes } = await supabase
        .from("presencas")
        .select("*", { count: "exact", head: true })
        .eq("evento_id", ultimoEvento.id)
        .eq("presente", true);
      setUltimaPresenca({
        ...ultimoEvento,
        presentes: presentes || 0,
        total: totalMembros || 0,
      });
    }

    setStats({
      membros: totalMembros || 0,
      lideres: totalLideres || 0,
      avisos: totalAvisos || 0,
      proximoEvento: proxEventos?.[0] || null,
    });
    setAvisos(avisosData || []);
    setEventos(proxEventos || []);

    const acts = (membrosRecentes || []).map((m) => ({
      icon: UserPlus,
      text: `${m.nome} foi cadastrado como membro`,
      time: m.created_at,
      color: "bg-blue-500",
    }));
    setAtividades(acts);
    setLoading(false);
  };

  if (loading)
    return (
      <div className="flex items-center gap-2 p-8 text-gray-500">
        <span className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
        Carregando dashboard...
      </div>
    );

  const hoje = format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", {
    locale: ptBR,
  });

  const tipoBorderColor = {
    urgente: "border-red-400",
    aviso: "border-yellow-400",
    informativo: "border-blue-400",
  };
  const tipoBadge = {
    urgente: "bg-red-100 text-red-700",
    aviso: "bg-yellow-100 text-yellow-700",
    informativo: "bg-blue-100 text-blue-700",
  };

  return (
    <div className="fade-in">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">
          Olá, {perfil?.nome?.split(" ")[0]} 👋
        </h1>
        <p className="text-sm text-gray-500 mt-0.5 capitalize">{hoje}</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-4">
        <StatCard
          icon={<Users size={20} className="text-blue-600" />}
          iconBg="bg-blue-50"
          label="Desbravadores ativos"
          value={stats.membros}
          delta="+3 este mês"
          deltaClass="text-green-600"
          onClick={() => navigate("/membros")}
        />
        <StatCard
          icon={<CheckSquare size={20} className="text-green-600" />}
          iconBg="bg-green-50"
          label="Última reunião"
          value={
            ultimaPresenca
              ? `${ultimaPresenca.presentes}/${ultimaPresenca.total}`
              : "—"
          }
          delta={
            ultimaPresenca
              ? `${Math.round((ultimaPresenca.presentes / (ultimaPresenca.total || 1)) * 100)}% de presença`
              : "Nenhum registro"
          }
          deltaClass="text-gray-500"
          onClick={() => navigate("/presenca")}
        />
        <StatCard
          icon={<Tent size={20} className="text-yellow-500" />}
          iconBg="bg-yellow-50"
          label="Próximo evento"
          value={stats.proximoEvento ? stats.proximoEvento.titulo : "—"}
          delta={
            stats.proximoEvento
              ? format(parseISO(stats.proximoEvento.data_inicio), "dd/MM", {
                  locale: ptBR,
                })
              : "Nenhum agendado"
          }
          deltaClass="text-yellow-600"
          isText
          onClick={() => navigate("/eventos")}
        />
        <StatCard
          icon={<Megaphone size={20} className="text-red-500" />}
          iconBg="bg-red-50"
          label="Avisos ativos"
          value={stats.avisos}
          delta="Comunicados em aberto"
          deltaClass="text-gray-500"
          onClick={() => navigate("/avisos")}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
        {/* Atividades recentes */}
        <div className="bg-white border border-gray-100 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={16} className="text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-800">
              Atividades recentes
            </h3>
          </div>
          {atividades.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">
              Nenhuma atividade recente
            </p>
          ) : (
            <div className="flex flex-col gap-0.5">
              {atividades.map((a, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2.5 py-2.5 border-b border-gray-50 last:border-0"
                >
                  <div
                    className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${a.color}`}
                  />
                  <div className="flex-1">
                    <div className="text-xs text-gray-800 leading-snug">
                      {a.text}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                      <Clock size={11} />
                      {format(parseISO(a.time), "dd/MM 'às' HH:mm", {
                        locale: ptBR,
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Avisos */}
        <div className="bg-white border border-gray-100 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} className="text-gray-400" />
              <h3 className="text-sm font-semibold text-gray-800">
                Avisos recentes
              </h3>
            </div>
            <button
              className="text-xs text-blue-600 hover:underline"
              onClick={() => navigate("/avisos")}
            >
              Ver todos
            </button>
          </div>
          {avisos.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">
              Nenhum aviso ativo
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {avisos.map((a) => (
                <div
                  key={a.id}
                  className={`px-3 py-2.5 rounded-lg bg-gray-50 border-l-4 ${tipoBorderColor[a.tipo]}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-gray-800">
                      {a.titulo}
                    </span>
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${tipoBadge[a.tipo]}`}
                    >
                      {a.tipo}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    {a.conteudo.slice(0, 80)}
                    {a.conteudo.length > 80 ? "..." : ""}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Próximos eventos */}
      {eventos.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-xl p-5 mt-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Tent size={16} className="text-gray-400" />
              <h3 className="text-sm font-semibold text-gray-800">
                Próximos eventos
              </h3>
            </div>
            <button
              className="text-xs text-blue-600 hover:underline"
              onClick={() => navigate("/eventos")}
            >
              Ver calendário
            </button>
          </div>
          <div className="flex flex-col gap-2">
            {eventos.map((e) => {
              const dt = parseISO(e.data_inicio);
              return (
                <div
                  key={e.id}
                  className="flex items-center gap-3.5 py-2.5 border-b border-gray-50 last:border-0"
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
                    <div className="text-sm font-medium text-gray-800">
                      {e.titulo}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {e.local || "Local a definir"}
                    </div>
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${e.tipo === "reuniao" ? "bg-blue-100 text-blue-700" : "bg-yellow-100 text-yellow-700"}`}
                  >
                    {e.tipo}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon,
  iconBg,
  label,
  value,
  delta,
  deltaClass,
  isText,
  onClick,
}) {
  return (
    <div
      className="bg-white border border-gray-100 rounded-xl p-4 cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <div
        className={`w-9 h-9 ${iconBg} rounded-xl flex items-center justify-center mb-3`}
      >
        {icon}
      </div>
      <div className="text-[10px] text-gray-400 font-medium uppercase tracking-wide mb-1">
        {label}
      </div>
      <div
        className={`font-semibold text-gray-900 mb-1.5 leading-tight ${isText ? "text-base" : "text-2xl"}`}
      >
        {value}
      </div>
      <div className={`text-xs ${deltaClass}`}>{delta}</div>
    </div>
  );
}
