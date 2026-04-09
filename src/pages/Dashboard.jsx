import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import { Users, CheckSquare, Tent, Megaphone, TrendingUp, Clock, UserPlus, AlertCircle } from 'lucide-react'
import { format, isAfter, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function Dashboard() {
  const { perfil } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState({ membros: 0, lideres: 0, avisos: 0, proximoEvento: null })
  const [atividades, setAtividades] = useState([])
  const [avisos, setAvisos] = useState([])
  const [eventos, setEventos] = useState([])
  const [ultimaPresenca, setUltimaPresenca] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (perfil?.clube_id) loadDashboard()
  }, [perfil])

  const loadDashboard = async () => {
    const cid = perfil.clube_id
    const [
      { count: totalMembros },
      { count: totalLideres },
      { count: totalAvisos },
      { data: proxEventos },
      { data: avisosData },
      { data: membrosRecentes },
    ] = await Promise.all([
      supabase.from('membros').select('*', { count: 'exact', head: true }).eq('clube_id', cid).eq('ativo', true),
      supabase.from('perfis').select('*', { count: 'exact', head: true }).eq('clube_id', cid).eq('ativo', true),
      supabase.from('avisos').select('*', { count: 'exact', head: true }).eq('clube_id', cid).eq('ativo', true),
      supabase.from('eventos').select('*').eq('clube_id', cid).gte('data_inicio', new Date().toISOString()).order('data_inicio').limit(3),
      supabase.from('avisos').select('*').eq('clube_id', cid).eq('ativo', true).order('created_at', { ascending: false }).limit(4),
      supabase.from('membros').select('*').eq('clube_id', cid).eq('ativo', true).order('created_at', { ascending: false }).limit(4),
    ])

    // Última presença
    const { data: ultimoEvento } = await supabase
      .from('eventos')
      .select('id, titulo, data_inicio')
      .eq('clube_id', cid)
      .lte('data_inicio', new Date().toISOString())
      .order('data_inicio', { ascending: false })
      .limit(1)
      .single()

    if (ultimoEvento) {
      const { count: presentes } = await supabase
        .from('presencas')
        .select('*', { count: 'exact', head: true })
        .eq('evento_id', ultimoEvento.id)
        .eq('presente', true)
      setUltimaPresenca({ ...ultimoEvento, presentes: presentes || 0, total: totalMembros || 0 })
    }

    setStats({ membros: totalMembros || 0, lideres: totalLideres || 0, avisos: totalAvisos || 0, proximoEvento: proxEventos?.[0] || null })
    setAvisos(avisosData || [])
    setEventos(proxEventos || [])

    // Montar feed de atividades com membros recentes
    const acts = (membrosRecentes || []).map(m => ({
      icon: UserPlus,
      text: `${m.nome} foi cadastrado como membro`,
      time: m.created_at,
      color: 'var(--accent)',
    }))
    setAtividades(acts)
    setLoading(false)
  }

  if (loading) return <div className="loading"><span className="spinner" />Carregando dashboard...</div>

  const hoje = format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 className="page-title">
          Olá, {perfil?.nome?.split(' ')[0]} 👋
        </h1>
        <p className="page-subtitle" style={{ textTransform: 'capitalize' }}>{hoje}</p>
      </div>

      {/* Stat cards */}
      <div style={s.statsGrid}>
        <StatCard
          icon={<Users size={20} color="#185fa5" />}
          iconBg="#e8f4fd"
          label="Desbravadores ativos"
          value={stats.membros}
          delta="+3 este mês"
          deltaColor="var(--success)"
          onClick={() => navigate('/membros')}
        />
        <StatCard
          icon={<CheckSquare size={20} color="var(--success)" />}
          iconBg="var(--success-bg)"
          label="Última reunião"
          value={ultimaPresenca ? `${ultimaPresenca.presentes}/${ultimaPresenca.total}` : '—'}
          delta={ultimaPresenca ? `${Math.round((ultimaPresenca.presentes / (ultimaPresenca.total || 1)) * 100)}% de presença` : 'Nenhum registro'}
          deltaColor="var(--text-secondary)"
          onClick={() => navigate('/presenca')}
        />
        <StatCard
          icon={<Tent size={20} color="var(--warning)" />}
          iconBg="var(--warning-bg)"
          label="Próximo evento"
          value={stats.proximoEvento ? stats.proximoEvento.titulo : '—'}
          delta={stats.proximoEvento ? format(parseISO(stats.proximoEvento.data_inicio), "dd/MM", { locale: ptBR }) : 'Nenhum agendado'}
          deltaColor="var(--warning)"
          isText
          onClick={() => navigate('/eventos')}
        />
        <StatCard
          icon={<Megaphone size={20} color="var(--danger)" />}
          iconBg="var(--danger-bg)"
          label="Avisos ativos"
          value={stats.avisos}
          delta="Comunicados em aberto"
          deltaColor="var(--text-secondary)"
          onClick={() => navigate('/avisos')}
        />
      </div>

      <div style={s.twoCol}>
        {/* Atividades recentes */}
        <div className="card">
          <div style={s.cardHeader}>
            <div style={s.cardHeaderLeft}>
              <TrendingUp size={16} color="var(--text-secondary)" />
              <h3 style={s.cardTitle}>Atividades recentes</h3>
            </div>
          </div>
          {atividades.length === 0 ? (
            <div className="empty-state"><p>Nenhuma atividade recente</p></div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {atividades.map((a, i) => (
                <div key={i} style={s.actItem}>
                  <div style={{ ...s.actDot, background: a.color }} />
                  <div style={{ flex: 1 }}>
                    <div style={s.actText}>{a.text}</div>
                    <div style={s.actTime}>
                      <Clock size={11} />
                      {format(parseISO(a.time), "dd/MM 'às' HH:mm", { locale: ptBR })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Avisos */}
        <div className="card">
          <div style={s.cardHeader}>
            <div style={s.cardHeaderLeft}>
              <AlertCircle size={16} color="var(--text-secondary)" />
              <h3 style={s.cardTitle}>Avisos recentes</h3>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/avisos')}>Ver todos</button>
          </div>
          {avisos.length === 0 ? (
            <div className="empty-state"><p>Nenhum aviso ativo</p></div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {avisos.map(a => (
                <div key={a.id} style={{ ...s.avisoItem, borderLeftColor: a.tipo === 'urgente' ? 'var(--danger)' : a.tipo === 'aviso' ? 'var(--warning)' : 'var(--accent)' }}>
                  <div style={s.avisoHeader}>
                    <span style={s.avisoTitle}>{a.titulo}</span>
                    <span className={`badge badge-${a.tipo}`}>{a.tipo}</span>
                  </div>
                  <p style={s.avisoDesc}>{a.conteudo.slice(0, 80)}{a.conteudo.length > 80 ? '...' : ''}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Próximos eventos */}
      {eventos.length > 0 && (
        <div className="card" style={{ marginTop: '16px' }}>
          <div style={s.cardHeader}>
            <div style={s.cardHeaderLeft}>
              <Tent size={16} color="var(--text-secondary)" />
              <h3 style={s.cardTitle}>Próximos eventos</h3>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/eventos')}>Ver calendário</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {eventos.map(e => {
              const dt = parseISO(e.data_inicio)
              return (
                <div key={e.id} style={s.eventoItem}>
                  <div style={s.eventoDate}>
                    <span style={s.eventoDay}>{format(dt, 'dd')}</span>
                    <span style={s.eventoMon}>{format(dt, 'MMM', { locale: ptBR })}</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={s.eventoName}>{e.titulo}</div>
                    <div style={s.eventoMeta}>{e.local || 'Local a definir'}</div>
                  </div>
                  <span className={`badge badge-${e.tipo === 'reuniao' ? 'informativo' : 'aviso'}`}>{e.tipo}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ icon, iconBg, label, value, delta, deltaColor, isText, onClick }) {
  return (
    <div className="card" style={{ cursor: 'pointer', transition: 'box-shadow 0.15s' }}
      onClick={onClick}
      onMouseEnter={e => e.currentTarget.style.boxShadow = 'var(--shadow-md)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = 'var(--shadow-sm)'}
    >
      <div style={{ width: '36px', height: '36px', background: iconBg, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
        {icon}
      </div>
      <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '500', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
      <div style={{ fontSize: isText ? '16px' : '26px', fontWeight: '600', color: 'var(--text-primary)', lineHeight: '1.2', marginBottom: '6px' }}>{value}</div>
      <div style={{ fontSize: '12px', color: deltaColor }}>{delta}</div>
    </div>
  )
}

const s = {
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: '14px', marginBottom: '16px' },
  twoCol: { display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: '14px' },
  cardHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' },
  cardHeaderLeft: { display: 'flex', alignItems: 'center', gap: '8px' },
  cardTitle: { fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' },
  actItem: { display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '10px 0', borderBottom: '1px solid var(--border-light)' },
  actDot: { width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0, marginTop: '5px' },
  actText: { fontSize: '13px', color: 'var(--text-primary)', lineHeight: '1.4' },
  actTime: { display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--text-muted)', marginTop: '3px' },
  avisoItem: {
    padding: '10px 12px',
    borderRadius: 'var(--radius-sm)',
    background: 'var(--bg-page)',
    borderLeft: '3px solid',
  },
  avisoHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' },
  avisoTitle: { fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)' },
  avisoDesc: { fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5' },
  eventoItem: {
    display: 'flex', alignItems: 'center', gap: '14px',
    padding: '10px 0', borderBottom: '1px solid var(--border-light)',
  },
  eventoDate: {
    width: '40px', height: '44px',
    background: 'var(--navy)', borderRadius: '8px',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  eventoDay: { fontSize: '16px', fontWeight: '600', color: '#fff', lineHeight: '1' },
  eventoMon: { fontSize: '10px', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' },
  eventoName: { fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)' },
  eventoMeta: { fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' },
}
