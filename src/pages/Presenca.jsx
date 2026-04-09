import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { Plus, CheckCircle, XCircle, Save, X, ChevronLeft } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const EMPTY_EVENTO = { titulo: '', tipo: 'reuniao', data_inicio: new Date().toISOString().slice(0, 16), local: '', obrigatorio: true }

export default function Presenca() {
  const { perfil, canEdit } = useAuth()
  const [eventos, setEventos] = useState([])
  const [eventoSel, setEventoSel] = useState(null)
  const [membros, setMembros] = useState([])
  const [presencas, setPresencas] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [modalEvento, setModalEvento] = useState(false)
  const [formEvento, setFormEvento] = useState(EMPTY_EVENTO)
  const [view, setView] = useState('list') // list | registrar

  useEffect(() => { if (perfil?.clube_id) loadEventos() }, [perfil])

  const loadEventos = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('eventos')
      .select('*')
      .eq('clube_id', perfil.clube_id)
      .order('data_inicio', { ascending: false })
    setEventos(data || [])
    setLoading(false)
  }

  const abrirRegistro = async (evento) => {
    setEventoSel(evento)
    setView('registrar')
    // Carregar membros
    const { data: mbs } = await supabase.from('membros').select('id, nome, classe').eq('clube_id', perfil.clube_id).eq('ativo', true).order('nome')
    setMembros(mbs || [])
    // Carregar presenças existentes
    const { data: prs } = await supabase.from('presencas').select('*').eq('evento_id', evento.id)
    const map = {}
    ;(prs || []).forEach(p => { map[p.membro_id] = p })
    setPresencas(map)
  }

  const togglePresenca = (membroId) => {
    setPresencas(prev => ({
      ...prev,
      [membroId]: {
        ...prev[membroId],
        membro_id: membroId,
        evento_id: eventoSel.id,
        presente: !(prev[membroId]?.presente),
      }
    }))
  }

  const marcarTodos = (val) => {
    const map = {}
    membros.forEach(m => { map[m.id] = { membro_id: m.id, evento_id: eventoSel.id, presente: val } })
    setPresencas(map)
  }

  const salvarPresenca = async () => {
    setSaving(true)
    const upserts = Object.values(presencas).map(p => ({
      evento_id: p.evento_id,
      membro_id: p.membro_id,
      presente: p.presente || false,
      registrado_por: perfil.id,
    }))
    await supabase.from('presencas').upsert(upserts, { onConflict: 'evento_id,membro_id' })
    setSaving(false)
    alert('Presença salva com sucesso!')
  }

  const criarEvento = async () => {
    if (!formEvento.titulo.trim()) return alert('Título obrigatório')
    await supabase.from('eventos').insert({ ...formEvento, clube_id: perfil.clube_id, created_by: perfil.id })
    setModalEvento(false)
    setFormEvento(EMPTY_EVENTO)
    loadEventos()
  }

  const presentes = Object.values(presencas).filter(p => p.presente).length
  const pct = membros.length > 0 ? Math.round((presentes / membros.length) * 100) : 0

  if (loading) return <div className="loading"><span className="spinner" />Carregando...</div>

  return (
    <div className="fade-in">
      {view === 'list' ? (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h1 className="page-title">Presença</h1>
              <p className="page-subtitle">Registro de frequência por reunião e evento</p>
            </div>
            {canEdit() && (
              <button className="btn btn-primary" onClick={() => setModalEvento(true)}>
                <Plus size={16} /> Nova reunião
              </button>
            )}
          </div>

          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {eventos.length === 0 ? (
              <div className="empty-state"><p>Nenhum evento cadastrado ainda</p></div>
            ) : (
              eventos.map(e => {
                const dt = parseISO(e.data_inicio)
                return (
                  <div key={e.id} style={s.eventoRow}
                    onClick={() => abrirRegistro(e)}
                    onMouseEnter={el => el.currentTarget.style.background = 'var(--bg-hover)'}
                    onMouseLeave={el => el.currentTarget.style.background = ''}
                  >
                    <div style={s.dateBox}>
                      <span style={s.dateDay}>{format(dt, 'dd')}</span>
                      <span style={s.dateMon}>{format(dt, 'MMM', { locale: ptBR })}</span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '14px', fontWeight: '500' }}>{e.titulo}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {format(dt, "HH:mm")} · {e.local || 'Local a definir'}
                      </div>
                    </div>
                    <span className={`badge badge-${e.tipo === 'reuniao' ? 'informativo' : 'aviso'}`}>{e.tipo}</span>
                    <span style={{ fontSize: '12px', color: 'var(--accent)', fontWeight: '500' }}>Registrar →</span>
                  </div>
                )
              })
            )}
          </div>
        </>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setView('list')}>
              <ChevronLeft size={14} /> Voltar
            </button>
            <div>
              <h1 className="page-title">{eventoSel?.titulo}</h1>
              <p className="page-subtitle">{eventoSel?.data_inicio && format(parseISO(eventoSel.data_inicio), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
            </div>
          </div>

          {/* Stats */}
          <div style={s.statsRow}>
            <div style={s.statPill}>
              <span style={{ fontSize: '22px', fontWeight: '600', color: 'var(--success)' }}>{presentes}</span>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>presentes</span>
            </div>
            <div style={{ ...s.statPill, borderColor: 'var(--danger-bg)' }}>
              <span style={{ fontSize: '22px', fontWeight: '600', color: 'var(--danger)' }}>{membros.length - presentes}</span>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>ausentes</span>
            </div>
            <div style={{ ...s.statPill }}>
              <span style={{ fontSize: '22px', fontWeight: '600', color: 'var(--navy)' }}>{pct}%</span>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>frequência</span>
            </div>
            {/* Progress bar */}
            <div style={s.progressWrap}>
              <div style={{ ...s.progressBar, width: `${pct}%` }} />
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
            <button className="btn btn-secondary btn-sm" onClick={() => marcarTodos(true)}>Marcar todos presentes</button>
            <button className="btn btn-secondary btn-sm" onClick={() => marcarTodos(false)}>Limpar todos</button>
            <button className="btn btn-primary" onClick={salvarPresenca} disabled={saving} style={{ marginLeft: 'auto' }}>
              {saving ? <><span className="spinner" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} /> Salvando...</> : <><Save size={14} /> Salvar presença</>}
            </button>
          </div>

          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {membros.map(m => {
              const p = presencas[m.id]
              const presente = p?.presente || false
              return (
                <div key={m.id} style={{ ...s.membroRow, background: presente ? 'rgba(42,157,92,0.04)' : '' }}
                  onClick={() => canEdit() && togglePresenca(m.id)}
                  onMouseEnter={el => { if (!presente) el.currentTarget.style.background = 'var(--bg-hover)' }}
                  onMouseLeave={el => { el.currentTarget.style.background = presente ? 'rgba(42,157,92,0.04)' : '' }}
                >
                  <div style={s.membroAv}>{m.nome.split(' ').map(n => n[0]).slice(0, 2).join('')}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: '500' }}>{m.nome}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{m.classe}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '13px', fontWeight: '500', color: presente ? 'var(--success)' : 'var(--text-muted)' }}>
                      {presente ? 'Presente' : 'Ausente'}
                    </span>
                    {presente
                      ? <CheckCircle size={22} color="var(--success)" fill="var(--success-bg)" />
                      : <XCircle size={22} color="var(--border)" />
                    }
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* Modal novo evento */}
      {modalEvento && (
        <div style={s.overlay} onClick={() => setModalEvento(false)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <div style={s.mHeader}>
              <h2 style={{ fontSize: '16px', fontWeight: '600' }}>Nova reunião / evento</h2>
              <button style={s.closeBtn} onClick={() => setModalEvento(false)}><X size={18} /></button>
            </div>
            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Título *</label>
                <input className="input" value={formEvento.titulo} onChange={e => setFormEvento(f => ({ ...f, titulo: e.target.value }))} placeholder="Ex: Reunião semanal" />
              </div>
              <div className="form-grid form-grid-2">
                <div className="form-group">
                  <label className="form-label">Tipo</label>
                  <select className="input" value={formEvento.tipo} onChange={e => setFormEvento(f => ({ ...f, tipo: e.target.value }))}>
                    <option value="reuniao">Reunião</option>
                    <option value="evento">Evento</option>
                    <option value="acampamento">Acampamento</option>
                    <option value="culto">Culto</option>
                    <option value="outro">Outro</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Data e hora</label>
                  <input className="input" type="datetime-local" value={formEvento.data_inicio} onChange={e => setFormEvento(f => ({ ...f, data_inicio: e.target.value }))} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Local</label>
                <input className="input" value={formEvento.local} onChange={e => setFormEvento(f => ({ ...f, local: e.target.value }))} placeholder="Ex: Igreja Central — Sala 3" />
              </div>
            </div>
            <div style={s.mFooter}>
              <button className="btn btn-secondary" onClick={() => setModalEvento(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={criarEvento}>Criar evento</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const s = {
  eventoRow: { display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 20px', borderBottom: '1px solid var(--border-light)', cursor: 'pointer', transition: 'background 0.1s' },
  dateBox: { width: '40px', height: '44px', background: 'var(--navy)', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  dateDay: { fontSize: '16px', fontWeight: '600', color: '#fff', lineHeight: '1' },
  dateMon: { fontSize: '10px', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' },
  statsRow: { display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap' },
  statPill: { background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: '12px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '90px' },
  progressWrap: { flex: 1, height: '6px', background: 'var(--border-light)', borderRadius: '99px', overflow: 'hidden', minWidth: '100px' },
  progressBar: { height: '100%', background: 'var(--success)', borderRadius: '99px', transition: 'width 0.4s' },
  membroRow: { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 20px', borderBottom: '1px solid var(--border-light)', cursor: 'pointer', transition: 'background 0.1s' },
  membroAv: { width: '36px', height: '36px', borderRadius: '50%', background: 'var(--navy)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '600', flexShrink: 0 },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' },
  modal: { background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: '480px', boxShadow: '0 24px 64px rgba(0,0,0,0.2)' },
  mHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid var(--border-light)' },
  mFooter: { display: 'flex', gap: '10px', justifyContent: 'flex-end', padding: '16px 24px', borderTop: '1px solid var(--border-light)' },
  closeBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--text-muted)', display: 'flex', borderRadius: '6px' },
}
