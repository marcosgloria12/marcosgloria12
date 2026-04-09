import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

export default function Relatorios() {
  const { perfil } = useAuth()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { if (perfil?.clube_id) load() }, [perfil])

  const load = async () => {
    const cid = perfil.clube_id
    const [
      { data: membros },
      { data: eventos },
    ] = await Promise.all([
      supabase.from('membros').select('classe, ativo, sexo, data_ingresso').eq('clube_id', cid),
      supabase.from('eventos').select('id, titulo, data_inicio, tipo').eq('clube_id', cid).order('data_inicio', { ascending: false }).limit(6),
    ])

    // Presença por evento
    const presencaData = []
    for (const e of (eventos || []).slice(0, 5)) {
      const { count } = await supabase.from('presencas').select('*', { count: 'exact', head: true }).eq('evento_id', e.id).eq('presente', true)
      presencaData.push({ nome: e.titulo.slice(0, 12) + (e.titulo.length > 12 ? '...' : ''), presentes: count || 0 })
    }

    // Por classe
    const classeCounts = {}
    ;(membros || []).filter(m => m.ativo).forEach(m => {
      classeCounts[m.classe] = (classeCounts[m.classe] || 0) + 1
    })
    const byClasse = Object.entries(classeCounts).map(([name, value]) => ({ name, value }))

    // Por sexo
    const sexoCounts = { M: 0, F: 0 }
    ;(membros || []).filter(m => m.ativo).forEach(m => { if (m.sexo) sexoCounts[m.sexo]++ })
    const bySexo = [{ name: 'Masculino', value: sexoCounts.M }, { name: 'Feminino', value: sexoCounts.F }].filter(i => i.value > 0)

    setStats({
      total: membros?.length || 0,
      ativos: membros?.filter(m => m.ativo).length || 0,
      inativos: membros?.filter(m => !m.ativo).length || 0,
      presencaData: presencaData.reverse(),
      byClasse,
      bySexo,
    })
    setLoading(false)
  }

  const COLORS = ['#1a3a5c', '#3d9be9', '#2a9d5c', '#b86a00', '#c0392b', '#8e44ad']

  if (loading) return <div className="loading"><span className="spinner" />Gerando relatórios...</div>

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '20px' }}>
        <h1 className="page-title">Relatórios</h1>
        <p className="page-subtitle">Dados consolidados do clube</p>
      </div>

      {/* Stat summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: '12px', marginBottom: '20px' }}>
        {[
          { label: 'Total de membros', value: stats.total, color: 'var(--navy)' },
          { label: 'Membros ativos', value: stats.ativos, color: 'var(--success)' },
          { label: 'Membros inativos', value: stats.inativos, color: 'var(--text-muted)' },
        ].map(i => (
          <div key={i.label} className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '32px', fontWeight: '700', color: i.color, marginBottom: '4px' }}>{i.value}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{i.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,2fr) minmax(0,1fr)', gap: '14px', marginBottom: '14px' }}>
        {/* Presença chart */}
        <div className="card">
          <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '16px' }}>Presença nas últimas reuniões</h3>
          {stats.presencaData.length === 0
            ? <div className="empty-state"><p>Nenhum dado de presença ainda</p></div>
            : <ResponsiveContainer width="100%" height={200}>
                <BarChart data={stats.presencaData}>
                  <XAxis dataKey="nome" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ fontSize: '12px', border: '1px solid var(--border)', borderRadius: '8px' }} />
                  <Bar dataKey="presentes" fill="var(--navy)" radius={[4, 4, 0, 0]} name="Presentes" />
                </BarChart>
              </ResponsiveContainer>
          }
        </div>

        {/* Sexo pie */}
        <div className="card">
          <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '16px' }}>Distribuição por sexo</h3>
          {stats.bySexo.length === 0
            ? <div className="empty-state"><p>Sem dados</p></div>
            : <>
                <ResponsiveContainer width="100%" height={140}>
                  <PieChart>
                    <Pie data={stats.bySexo} cx="50%" cy="50%" outerRadius={60} dataKey="value" label={({ name, value }) => `${value}`}>
                      {stats.bySexo.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ fontSize: '12px', border: '1px solid var(--border)', borderRadius: '8px' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '8px' }}>
                  {stats.bySexo.map((item, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: COLORS[i] }} />
                      {item.name}: {item.value}
                    </div>
                  ))}
                </div>
              </>
          }
        </div>
      </div>

      {/* Por classe */}
      <div className="card">
        <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '16px' }}>Membros por classe</h3>
        {stats.byClasse.length === 0
          ? <div className="empty-state"><p>Nenhum membro cadastrado</p></div>
          : <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {stats.byClasse.map((c, i) => {
                const pct = Math.round((c.value / stats.ativos) * 100)
                return (
                  <div key={c.name}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                      <span style={{ fontWeight: '500' }}>{c.name}</span>
                      <span style={{ color: 'var(--text-muted)' }}>{c.value} membros ({pct}%)</span>
                    </div>
                    <div style={{ height: '6px', background: 'var(--border-light)', borderRadius: '99px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: COLORS[i % COLORS.length], borderRadius: '99px', transition: 'width 0.6s' }} />
                    </div>
                  </div>
                )
              })}
            </div>
        }
      </div>
    </div>
  )
}
