import { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { supabase } from "../lib/supabase";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

export default function Relatorios() {
  const { perfil } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (perfil?.clube_id) load();
  }, [perfil]);

  const load = async () => {
    const cid = perfil.clube_id;
    const [{ data: membros }, { data: eventos }] = await Promise.all([
      supabase
        .from("membros")
        .select("classe, ativo, sexo, data_ingresso")
        .eq("clube_id", cid),
      supabase
        .from("eventos")
        .select("id, titulo, data_inicio, tipo")
        .eq("clube_id", cid)
        .order("data_inicio", { ascending: false })
        .limit(6),
    ]);

    const presencaData = [];
    for (const e of (eventos || []).slice(0, 5)) {
      const { count } = await supabase
        .from("presencas")
        .select("*", { count: "exact", head: true })
        .eq("evento_id", e.id)
        .eq("presente", true);
      presencaData.push({
        nome: e.titulo.slice(0, 12) + (e.titulo.length > 12 ? "..." : ""),
        presentes: count || 0,
      });
    }

    const classeCounts = {};
    (membros || [])
      .filter((m) => m.ativo)
      .forEach((m) => {
        classeCounts[m.classe] = (classeCounts[m.classe] || 0) + 1;
      });
    const byClasse = Object.entries(classeCounts).map(([name, value]) => ({
      name,
      value,
    }));

    const sexoCounts = { M: 0, F: 0 };
    (membros || [])
      .filter((m) => m.ativo)
      .forEach((m) => {
        if (m.sexo) sexoCounts[m.sexo]++;
      });
    const bySexo = [
      { name: "Masculino", value: sexoCounts.M },
      { name: "Feminino", value: sexoCounts.F },
    ].filter((i) => i.value > 0);

    setStats({
      total: membros?.length || 0,
      ativos: membros?.filter((m) => m.ativo).length || 0,
      inativos: membros?.filter((m) => !m.ativo).length || 0,
      presencaData: presencaData.reverse(),
      byClasse,
      bySexo,
    });
    setLoading(false);
  };

  const COLORS = [
    "#1a3a5c",
    "#3d9be9",
    "#2a9d5c",
    "#b86a00",
    "#c0392b",
    "#8e44ad",
  ];

  if (loading)
    return (
      <div className="flex items-center gap-2 p-8 text-gray-500">
        <span className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
        Gerando relatórios...
      </div>
    );

  return (
    <div className="fade-in">
      <div className="mb-5">
        <h1 className="text-xl font-semibold text-gray-900">Relatórios</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Dados consolidados do clube
        </p>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          {
            label: "Total de membros",
            value: stats.total,
            color: "text-[#1a3a5c]",
          },
          {
            label: "Membros ativos",
            value: stats.ativos,
            color: "text-green-600",
          },
          {
            label: "Membros inativos",
            value: stats.inativos,
            color: "text-gray-400",
          },
        ].map((i) => (
          <div
            key={i.label}
            className="bg-white border border-gray-100 rounded-xl p-4 text-center"
          >
            <div className={`text-3xl font-bold mb-1 ${i.color}`}>
              {i.value}
            </div>
            <div className="text-xs text-gray-400">{i.label}</div>
          </div>
        ))}
      </div>

      <div
        className="grid gap-3.5 mb-3.5"
        style={{ gridTemplateColumns: "minmax(0,2fr) minmax(0,1fr)" }}
      >
        {/* Presença */}
        <div className="bg-white border border-gray-100 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">
            Presença nas últimas reuniões
          </h3>
          {stats.presencaData.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">
              Nenhum dado de presença ainda
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stats.presencaData}>
                <XAxis
                  dataKey="nome"
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    fontSize: "12px",
                    border: "1px solid #f3f4f6",
                    borderRadius: "8px",
                  }}
                />
                <Bar
                  dataKey="presentes"
                  fill="#1a3a5c"
                  radius={[4, 4, 0, 0]}
                  name="Presentes"
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Sexo */}
        <div className="bg-white border border-gray-100 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">
            Distribuição por sexo
          </h3>
          {stats.bySexo.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">Sem dados</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie
                    data={stats.bySexo}
                    cx="50%"
                    cy="50%"
                    outerRadius={60}
                    dataKey="value"
                    label={({ value }) => `${value}`}
                  >
                    {stats.bySexo.map((_, i) => (
                      <Cell key={i} fill={COLORS[i]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      fontSize: "12px",
                      border: "1px solid #f3f4f6",
                      borderRadius: "8px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex gap-3 justify-center mt-2">
                {stats.bySexo.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-1.5 text-xs text-gray-500"
                  >
                    <div
                      className="w-2.5 h-2.5 rounded-sm"
                      style={{ background: COLORS[i] }}
                    />
                    {item.name}: {item.value}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Por classe */}
      <div className="bg-white border border-gray-100 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-gray-800 mb-4">
          Membros por classe
        </h3>
        {stats.byClasse.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">
            Nenhum membro cadastrado
          </p>
        ) : (
          <div className="flex flex-col gap-2.5">
            {stats.byClasse.map((c, i) => {
              const pct = Math.round((c.value / stats.ativos) * 100);
              return (
                <div key={c.name}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-gray-800">{c.name}</span>
                    <span className="text-gray-400">
                      {c.value} membros ({pct}%)
                    </span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${pct}%`,
                        background: COLORS[i % COLORS.length],
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
