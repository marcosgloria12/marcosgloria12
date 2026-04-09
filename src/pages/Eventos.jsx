// Eventos.jsx
import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { Plus, X, Tent } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const EMPTY = { titulo: '', descricao: '', tipo: 'evento', data_inicio: '', data_fim: '', local: '', obrigatorio: false }

export default function Eventos() {
  const { perfil, canEdit } = useAuth()
  const [eventos, setEventos] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)

  useEffect(() => { if (perfil?.clube_id) load() }, [perfil])

  const load = async () => {
    setLoading(true)
    const { data } = await supabase.from('eventos').select('*').eq('clube_id', perfil.clube_id).order('data_inicio', { ascending: false })
    setEventos(data || [])
    setLoading(false)
  }

  const save = async () => {
    if (!form.titulo.trim() || !form.data_inicio) return alert('Título e data obrigatórios')
    setSaving(true)
    await supabase.from('eventos').insert({ ...form, clube_id: perfil.clube_id, created_by: perfil.id })
    setSaving(false); setModal(false); setForm(EMPTY); load()
  }

  const field = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const tipoIcon = { reuniao: '📋', evento: '🎯', acampamento: '🏕', culto: '✝️', outro: '📌' }

  if (loading) return <div className="loading"><span className="spinner" />Carregando...</div>

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 className="page-title">Eventos</h1>
          <p className="page-subtitle">Calendário de atividades do clube</p>
        </div>
        {canEdit() && <button className="btn btn-primary" onClick={() => setModal(true)}><Plus size={16} /> Novo evento</button>}
      </div>

      {eventos.length === 0
        ? <div className="card"><div className="empty-state"><Tent size={32} /><p>Nenhum evento cadastrado</p></div></div>
        : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
            {eventos.map(e => {
              const dt = parseISO(e.data_inicio)
              return (
                <div key={e.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '40px', height: '44px', background: 'var(--navy)', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontSize: '16px', fontWeight: '600', color: '#fff', lineHeight: 1 }}>{format(dt, 'dd')}</span>
                      <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' }}>{format(dt, 'MMM', { locale: ptBR })}</span>
                    </div>
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: '600' }}>{e.titulo}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{tipoIcon[e.tipo]} {e.tipo}</div>
                    </div>
                  </div>
                  {e.descricao && <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{e.descricao}</p>}
                  {e.local && <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>📍 {e.local}</div>}
                  {e.data_fim && <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Até {format(parseISO(e.data_fim), "dd/MM/yyyy", { locale: ptBR })}</div>}
                </div>
              )
            })}
          </div>
      }

      {modal && (
        <div style={s.ov} onClick={() => setModal(false)}>
          <div style={s.md} onClick={e => e.stopPropagation()}>
            <div style={s.mh}><h2 style={{ fontSize: '16px', fontWeight: '600' }}>Novo evento</h2><button style={s.cb} onClick={() => setModal(false)}><X size={18} /></button></div>
            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group"><label className="form-label">Título *</label><input className="input" value={form.titulo} onChange={e => field('titulo', e.target.value)} /></div>
              <div className="form-grid form-grid-2">
                <div className="form-group"><label className="form-label">Tipo</label>
                  <select className="input" value={form.tipo} onChange={e => field('tipo', e.target.value)}>
                    {['reuniao','evento','acampamento','culto','outro'].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="form-group"><label className="form-label">Início *</label><input className="input" type="datetime-local" value={form.data_inicio} onChange={e => field('data_inicio', e.target.value)} /></div>
                <div className="form-group"><label className="form-label">Fim</label><input className="input" type="datetime-local" value={form.data_fim} onChange={e => field('data_fim', e.target.value)} /></div>
                <div className="form-group"><label className="form-label">Local</label><input className="input" value={form.local} onChange={e => field('local', e.target.value)} /></div>
              </div>
              <div className="form-group"><label className="form-label">Descrição</label><textarea className="input" value={form.descricao} onChange={e => field('descricao', e.target.value)} rows={3} style={{ resize: 'vertical' }} /></div>
            </div>
            <div style={s.mf}>
              <button className="btn btn-secondary" onClick={() => setModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Salvando...' : 'Criar evento'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const s = {
  ov: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' },
  md: { background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: '520px', boxShadow: '0 24px 64px rgba(0,0,0,0.2)' },
  mh: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid var(--border-light)' },
  mf: { display: 'flex', gap: '10px', justifyContent: 'flex-end', padding: '16px 24px', borderTop: '1px solid var(--border-light)' },
  cb: { background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--text-muted)', display: 'flex', borderRadius: '6px' },
}
