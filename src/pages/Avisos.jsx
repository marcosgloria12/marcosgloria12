import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { Plus, Trash2, X, Megaphone } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const EMPTY = { titulo: '', conteudo: '', tipo: 'aviso' }

export default function Avisos() {
  const { perfil, canEdit } = useAuth()
  const [avisos, setAvisos] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)

  useEffect(() => { if (perfil?.clube_id) load() }, [perfil])

  const load = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('avisos')
      .select('*, perfis(nome)')
      .eq('clube_id', perfil.clube_id)
      .eq('ativo', true)
      .order('created_at', { ascending: false })
    setAvisos(data || [])
    setLoading(false)
  }

  const save = async () => {
    if (!form.titulo.trim() || !form.conteudo.trim()) return alert('Preencha título e conteúdo')
    setSaving(true)
    await supabase.from('avisos').insert({ ...form, clube_id: perfil.clube_id, publicado_por: perfil.id })
    setSaving(false)
    setModal(false)
    setForm(EMPTY)
    load()
  }

  const remover = async (id) => {
    if (!window.confirm('Remover este aviso?')) return
    await supabase.from('avisos').update({ ativo: false }).eq('id', id)
    load()
  }

  const tipoColor = { urgente: 'var(--danger)', aviso: 'var(--warning)', informativo: 'var(--accent)' }
  const tipoBg = { urgente: 'var(--danger-bg)', aviso: 'var(--warning-bg)', informativo: 'var(--accent-light)' }

  if (loading) return <div className="loading"><span className="spinner" />Carregando...</div>

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 className="page-title">Comunicação</h1>
          <p className="page-subtitle">{avisos.length} avisos ativos</p>
        </div>
        {canEdit() && (
          <button className="btn btn-primary" onClick={() => setModal(true)}>
            <Plus size={16} /> Novo aviso
          </button>
        )}
      </div>

      {avisos.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <Megaphone size={32} />
            <p>Nenhum aviso publicado ainda</p>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {avisos.map(a => (
            <div key={a.id} className="card" style={{ borderLeft: `4px solid ${tipoColor[a.tipo]}`, padding: '16px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: tipoBg[a.tipo], display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '16px' }}>
                  {a.tipo === 'urgente' ? '🚨' : a.tipo === 'aviso' ? '📢' : 'ℹ️'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
                    <span style={{ fontSize: '15px', fontWeight: '600' }}>{a.titulo}</span>
                    <span className={`badge badge-${a.tipo}`}>{a.tipo}</span>
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '10px' }}>{a.conteudo}</p>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Publicado por {a.perfis?.nome || 'Sistema'} · {format(parseISO(a.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </div>
                </div>
                {canEdit() && (
                  <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px', display: 'flex', borderRadius: '6px' }} onClick={() => remover(a.id)}>
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <div style={s.overlay} onClick={() => setModal(false)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <div style={s.mh}>
              <h2 style={{ fontSize: '16px', fontWeight: '600' }}>Novo aviso</h2>
              <button style={s.closeBtn} onClick={() => setModal(false)}><X size={18} /></button>
            </div>
            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Título *</label>
                <input className="input" value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))} placeholder="Título do aviso" />
              </div>
              <div className="form-group">
                <label className="form-label">Tipo</label>
                <select className="input" value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}>
                  <option value="informativo">Informativo</option>
                  <option value="aviso">Aviso</option>
                  <option value="urgente">Urgente</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Conteúdo *</label>
                <textarea className="input" value={form.conteudo} onChange={e => setForm(f => ({ ...f, conteudo: e.target.value }))} rows={5} placeholder="Escreva o comunicado..." style={{ resize: 'vertical' }} />
              </div>
            </div>
            <div style={s.mf}>
              <button className="btn btn-secondary" onClick={() => setModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={save} disabled={saving}>
                {saving ? 'Publicando...' : 'Publicar aviso'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const s = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' },
  modal: { background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: '500px', boxShadow: '0 24px 64px rgba(0,0,0,0.2)' },
  mh: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid var(--border-light)' },
  mf: { display: 'flex', gap: '10px', justifyContent: 'flex-end', padding: '16px 24px', borderTop: '1px solid var(--border-light)' },
  closeBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--text-muted)', display: 'flex', borderRadius: '6px' },
}
