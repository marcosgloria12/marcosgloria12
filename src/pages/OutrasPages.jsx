// Suporte.jsx
import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { Plus, X, Headphones } from 'lucide-react'

const EMPTY = { titulo: '', descricao: '', categoria: 'duvida' }

export function Suporte() {
  const { perfil } = useAuth()
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)

  useEffect(() => { if (perfil?.clube_id) load() }, [perfil])

  const load = async () => {
    setLoading(true)
    const { data } = await supabase.from('tickets_suporte').select('*').eq('clube_id', perfil.clube_id).order('created_at', { ascending: false })
    setTickets(data || [])
    setLoading(false)
  }

  const save = async () => {
    if (!form.titulo.trim() || !form.descricao.trim()) return alert('Preencha todos os campos')
    setSaving(true)
    await supabase.from('tickets_suporte').insert({ ...form, clube_id: perfil.clube_id, aberto_por: perfil.id })
    setSaving(false); setModal(false); setForm(EMPTY); load()
  }

  if (loading) return <div className="loading"><span className="spinner" />Carregando...</div>

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 className="page-title">Suporte</h1>
          <p className="page-subtitle">Abertura e acompanhamento de chamados</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal(true)}><Plus size={16} /> Abrir chamado</button>
      </div>

      {tickets.length === 0
        ? <div className="card"><div className="empty-state"><Headphones size={32} /><p>Nenhum chamado aberto</p></div></div>
        : <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {tickets.map(t => (
              <div key={t.id} className="card" style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '6px' }}>
                    <span style={{ fontWeight: '600', fontSize: '14px' }}>{t.titulo}</span>
                    <span className={`badge badge-${t.status}`}>{t.status.replace('_', ' ')}</span>
                    <span className="badge badge-informativo">{t.categoria}</span>
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{t.descricao}</p>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>
                    Aberto em {new Date(t.created_at).toLocaleDateString('pt-BR')}
                  </div>
                </div>
              </div>
            ))}
          </div>
      }

      {modal && (
        <div style={s.ov} onClick={() => setModal(false)}>
          <div style={s.md} onClick={e => e.stopPropagation()}>
            <div style={s.mh}><h2 style={{ fontSize: '16px', fontWeight: '600' }}>Novo chamado</h2><button style={s.cb} onClick={() => setModal(false)}><X size={18} /></button></div>
            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group"><label className="form-label">Título *</label><input className="input" value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))} /></div>
              <div className="form-group"><label className="form-label">Categoria</label>
                <select className="input" value={form.categoria} onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))}>
                  <option value="duvida">Dúvida</option><option value="tecnico">Técnico</option><option value="sugestao">Sugestão</option><option value="erro">Erro no sistema</option>
                </select>
              </div>
              <div className="form-group"><label className="form-label">Descrição *</label><textarea className="input" rows={4} value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} style={{ resize: 'vertical' }} /></div>
            </div>
            <div style={s.mf}>
              <button className="btn btn-secondary" onClick={() => setModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Enviando...' : 'Abrir chamado'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Configuracoes.jsx
export function Configuracoes() {
  const { perfil } = useAuth()
  const [form, setForm] = useState({ nome: perfil?.nome || '', telefone: perfil?.telefone || '' })
  const [saving, setSaving] = useState(false)
  // supabase já importado no topo

  const save = async () => {
    setSaving(true)
    await supabase.from('perfis').update({ nome: form.nome, telefone: form.telefone }).eq('id', perfil?.id)
    setSaving(false)
    alert('Perfil atualizado!')
  }

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '20px' }}>
        <h1 className="page-title">Configurações</h1>
        <p className="page-subtitle">Gerencie seu perfil e preferências</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,2fr)', gap: '16px', alignItems: 'start' }}>
        {/* Perfil card */}
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--navy)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', fontWeight: '600', margin: '0 auto 12px' }}>
            {perfil?.nome?.split(' ').map(n => n[0]).slice(0, 2).join('')}
          </div>
          <div style={{ fontWeight: '600', fontSize: '16px' }}>{perfil?.nome}</div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px', marginBottom: '12px' }}>{perfil?.email}</div>
          <span className={`badge badge-${perfil?.nivel_acesso}`}>{perfil?.nivel_acesso}</span>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '12px' }}>
            Clube: {perfil?.clubes?.nome}
          </div>
        </div>

        {/* Edit form */}
        <div className="card">
          <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '16px' }}>Editar perfil</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label">Nome completo</label>
              <input className="input" value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Telefone</label>
              <input className="input" value={form.telefone} onChange={e => setForm(f => ({ ...f, telefone: e.target.value }))} placeholder="(27) 99999-9999" />
            </div>
            <div className="form-group">
              <label className="form-label">E-mail</label>
              <input className="input" value={perfil?.email || ''} disabled style={{ opacity: 0.6, cursor: 'not-allowed' }} />
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>O e-mail não pode ser alterado aqui</span>
            </div>
            <button className="btn btn-primary" style={{ alignSelf: 'flex-start' }} onClick={save} disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar alterações'}
            </button>
          </div>
        </div>
      </div>

      {/* Info sistema */}
      <div className="card" style={{ marginTop: '16px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>Sobre o sistema</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', fontSize: '13px' }}>
          {[['Versão', 'v1.0.0'], ['Desenvolvedor', 'DesbraSys Team'], ['Suporte', 'suporte@desbrasys.com.br']].map(([k, v]) => (
            <div key={k}>
              <div style={{ color: 'var(--text-muted)', fontSize: '11px', marginBottom: '2px' }}>{k}</div>
              <div style={{ fontWeight: '500' }}>{v}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Noticias.jsx
export function Noticias() {
  const { perfil, canEdit } = useAuth()
  const [noticias, setNoticias] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ titulo: '', conteudo: '', imagem_url: '', publicado: true })
  const [saving, setSaving] = useState(false)

  useEffect(() => { if (perfil?.clube_id) load() }, [perfil])

  const load = async () => {
    setLoading(true)
    const { data } = await supabase.from('noticias').select('*, perfis(nome)').eq('clube_id', perfil.clube_id).order('created_at', { ascending: false })
    setNoticias(data || [])
    setLoading(false)
  }

  const save = async () => {
    if (!form.titulo.trim() || !form.conteudo.trim()) return alert('Preencha título e conteúdo')
    setSaving(true)
    await supabase.from('noticias').insert({ ...form, clube_id: perfil.clube_id, publicado_por: perfil.id })
    setSaving(false); setModal(false); setForm({ titulo: '', conteudo: '', imagem_url: '', publicado: true }); load()
  }

  if (loading) return <div className="loading"><span className="spinner" />Carregando...</div>

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div><h1 className="page-title">Notícias</h1><p className="page-subtitle">Publicações do clube</p></div>
        {canEdit() && <button className="btn btn-primary" onClick={() => setModal(true)}><Plus size={16} /> Nova notícia</button>}
      </div>

      {noticias.length === 0
        ? <div className="card"><div className="empty-state"><p>Nenhuma notícia publicada</p></div></div>
        : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
            {noticias.map(n => (
              <div key={n.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {n.imagem_url && <img src={n.imagem_url} alt={n.titulo} style={{ width: '100%', height: '160px', objectFit: 'cover', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }} />}
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span className={`badge badge-${n.publicado ? 'ativo' : 'inativo'}`}>{n.publicado ? 'Publicado' : 'Rascunho'}</span>
                </div>
                <h3 style={{ fontSize: '15px', fontWeight: '600' }}>{n.titulo}</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{n.conteudo.slice(0, 120)}{n.conteudo.length > 120 ? '...' : ''}</p>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Por {n.perfis?.nome} · {new Date(n.created_at).toLocaleDateString('pt-BR')}</div>
              </div>
            ))}
          </div>
      }

      {modal && (
        <div style={s.ov} onClick={() => setModal(false)}>
          <div style={s.md} onClick={e => e.stopPropagation()}>
            <div style={s.mh}><h2 style={{ fontSize: '16px', fontWeight: '600' }}>Nova notícia</h2><button style={s.cb} onClick={() => setModal(false)}><X size={18} /></button></div>
            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group"><label className="form-label">Título *</label><input className="input" value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))} /></div>
              <div className="form-group"><label className="form-label">URL da imagem (opcional)</label><input className="input" value={form.imagem_url} onChange={e => setForm(f => ({ ...f, imagem_url: e.target.value }))} placeholder="https://..." /></div>
              <div className="form-group"><label className="form-label">Conteúdo *</label><textarea className="input" rows={5} value={form.conteudo} onChange={e => setForm(f => ({ ...f, conteudo: e.target.value }))} style={{ resize: 'vertical' }} /></div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                <input type="checkbox" checked={form.publicado} onChange={e => setForm(f => ({ ...f, publicado: e.target.checked }))} /> Publicar imediatamente
              </label>
            </div>
            <div style={s.mf}>
              <button className="btn btn-secondary" onClick={() => setModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Salvando...' : 'Publicar notícia'}</button>
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
