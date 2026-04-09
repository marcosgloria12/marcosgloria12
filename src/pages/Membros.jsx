import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { Plus, Search, Filter, Edit2, Trash2, Phone, Mail, X } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const CLASSES = ['Amigo', 'Companheiro', 'Pesquisador', 'Pioneiro', 'Excursionista', 'Guia']
const EMPTY_FORM = {
  nome: '', data_nascimento: '', sexo: '', telefone: '', email: '',
  nome_responsavel: '', telefone_responsavel: '', classe: 'Amigo',
  observacoes: '', ativo: true, data_ingresso: new Date().toISOString().split('T')[0],
}

export default function Membros() {
  const { perfil, canEdit } = useAuth()
  const [membros, setMembros] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('ativo')
  const [modal, setModal] = useState(false)
  const [editando, setEditando] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [deletando, setDeletando] = useState(null)

  useEffect(() => { if (perfil?.clube_id) load() }, [perfil, filtroStatus])

  const load = async () => {
    setLoading(true)
    let q = supabase.from('membros').select('*').eq('clube_id', perfil.clube_id).order('nome')
    if (filtroStatus !== 'todos') q = q.eq('ativo', filtroStatus === 'ativo')
    const { data } = await q
    setMembros(data || [])
    setLoading(false)
  }

  const filtered = membros.filter(m =>
    m.nome.toLowerCase().includes(search.toLowerCase()) ||
    (m.classe || '').toLowerCase().includes(search.toLowerCase())
  )

  const openNew = () => { setForm(EMPTY_FORM); setEditando(null); setModal(true) }
  const openEdit = (m) => { setForm({ ...m }); setEditando(m.id); setModal(true) }
  const closeModal = () => { setModal(false); setEditando(null); setForm(EMPTY_FORM) }

  const save = async () => {
    if (!form.nome.trim()) return alert('Nome é obrigatório')
    setSaving(true)
    if (editando) {
      await supabase.from('membros').update({ ...form }).eq('id', editando)
    } else {
      await supabase.from('membros').insert({ ...form, clube_id: perfil.clube_id })
    }
    setSaving(false)
    closeModal()
    load()
  }

  const remove = async (id) => {
    if (!window.confirm('Desativar este membro?')) return
    setDeletando(id)
    await supabase.from('membros').update({ ativo: false }).eq('id', id)
    setDeletando(null)
    load()
  }

  const field = (key, val) => setForm(f => ({ ...f, [key]: val }))
  const idade = (dob) => {
    if (!dob) return null
    const diff = new Date() - new Date(dob)
    return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000))
  }

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px', gap: '12px', flexWrap: 'wrap' }}>
        <div>
          <h1 className="page-title">Membros</h1>
          <p className="page-subtitle">{filtered.length} {filtroStatus === 'ativo' ? 'ativos' : 'membros'} encontrados</p>
        </div>
        {canEdit() && (
          <button className="btn btn-primary" onClick={openNew}>
            <Plus size={16} /> Novo membro
          </button>
        )}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <div style={s.searchWrap}>
          <Search size={15} color="var(--text-muted)" />
          <input
            style={s.searchInput}
            placeholder="Buscar por nome ou classe..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select className="input" style={{ width: 'auto' }} value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}>
          <option value="ativo">Ativos</option>
          <option value="inativo">Inativos</option>
          <option value="todos">Todos</option>
        </select>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div className="loading"><span className="spinner" />Carregando...</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <Users size={32} />
            <p>Nenhum membro encontrado</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={s.table}>
              <thead>
                <tr style={s.thead}>
                  <th style={s.th}>Nome</th>
                  <th style={s.th} className="hide-mobile">Classe</th>
                  <th style={s.th} className="hide-mobile">Idade</th>
                  <th style={s.th} className="hide-mobile">Responsável</th>
                  <th style={s.th}>Status</th>
                  {canEdit() && <th style={s.th}></th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map(m => (
                  <tr key={m.id} style={s.tr} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'} onMouseLeave={e => e.currentTarget.style.background = ''}>
                    <td style={s.td}>
                      <div style={s.memberCell}>
                        <div style={s.memberAv}>{m.nome.split(' ').map(n => n[0]).slice(0, 2).join('')}</div>
                        <div>
                          <div style={s.memberName}>{m.nome}</div>
                          <div style={s.memberContact}>
                            {m.email && <span style={s.contactChip}><Mail size={10} />{m.email}</span>}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={s.td} className="hide-mobile">
                      <span style={s.classBadge}>{m.classe}</span>
                    </td>
                    <td style={s.td} className="hide-mobile">
                      {idade(m.data_nascimento) !== null ? `${idade(m.data_nascimento)} anos` : '—'}
                    </td>
                    <td style={s.td} className="hide-mobile">
                      <div style={{ fontSize: '13px' }}>{m.nome_responsavel || '—'}</div>
                      {m.telefone_responsavel && (
                        <div style={s.memberContact}><Phone size={10} />{m.telefone_responsavel}</div>
                      )}
                    </td>
                    <td style={s.td}>
                      <span className={`badge badge-${m.ativo ? 'ativo' : 'inativo'}`}>
                        {m.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    {canEdit() && (
                      <td style={{ ...s.td, textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                          <button style={s.actionBtn} onClick={() => openEdit(m)} title="Editar">
                            <Edit2 size={14} />
                          </button>
                          <button style={{ ...s.actionBtn, color: 'var(--danger)' }} onClick={() => remove(m.id)} disabled={deletando === m.id} title="Desativar">
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
        <div style={s.modalOverlay} onClick={closeModal}>
          <div style={s.modalBox} onClick={e => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <h2 style={{ fontSize: '16px', fontWeight: '600' }}>{editando ? 'Editar membro' : 'Novo membro'}</h2>
              <button style={s.closeBtn} onClick={closeModal}><X size={18} /></button>
            </div>
            <div style={s.modalBody}>
              <div className="form-grid form-grid-2">
                <div className="form-group">
                  <label className="form-label">Nome completo *</label>
                  <input className="input" value={form.nome} onChange={e => field('nome', e.target.value)} placeholder="Nome do desbravador" />
                </div>
                <div className="form-group">
                  <label className="form-label">Data de nascimento</label>
                  <input className="input" type="date" value={form.data_nascimento} onChange={e => field('data_nascimento', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Sexo</label>
                  <select className="input" value={form.sexo} onChange={e => field('sexo', e.target.value)}>
                    <option value="">Selecione</option>
                    <option value="M">Masculino</option>
                    <option value="F">Feminino</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Classe</label>
                  <select className="input" value={form.classe} onChange={e => field('classe', e.target.value)}>
                    {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Telefone</label>
                  <input className="input" value={form.telefone} onChange={e => field('telefone', e.target.value)} placeholder="(27) 99999-9999" />
                </div>
                <div className="form-group">
                  <label className="form-label">E-mail</label>
                  <input className="input" type="email" value={form.email} onChange={e => field('email', e.target.value)} placeholder="email@exemplo.com" />
                </div>
                <div className="form-group">
                  <label className="form-label">Nome do responsável</label>
                  <input className="input" value={form.nome_responsavel} onChange={e => field('nome_responsavel', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Telefone do responsável</label>
                  <input className="input" value={form.telefone_responsavel} onChange={e => field('telefone_responsavel', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Data de ingresso</label>
                  <input className="input" type="date" value={form.data_ingresso} onChange={e => field('data_ingresso', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="input" value={form.ativo} onChange={e => field('ativo', e.target.value === 'true')}>
                    <option value="true">Ativo</option>
                    <option value="false">Inativo</option>
                  </select>
                </div>
              </div>
              <div className="form-group" style={{ marginTop: '14px' }}>
                <label className="form-label">Observações</label>
                <textarea className="input" value={form.observacoes} onChange={e => field('observacoes', e.target.value)} rows={3} placeholder="Notas adicionais..." style={{ resize: 'vertical' }} />
              </div>
            </div>
            <div style={s.modalFooter}>
              <button className="btn btn-secondary" onClick={closeModal}>Cancelar</button>
              <button className="btn btn-primary" onClick={save} disabled={saving}>
                {saving ? <><span className="spinner" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} /> Salvando...</> : (editando ? 'Salvar alterações' : 'Cadastrar membro')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const s = {
  searchWrap: {
    display: 'flex', alignItems: 'center', gap: '8px',
    background: 'var(--bg-card)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)', padding: '8px 12px', flex: 1, maxWidth: '360px',
  },
  searchInput: { border: 'none', outline: 'none', background: 'none', fontSize: '13px', color: 'var(--text-primary)', flex: 1 },
  table: { width: '100%', borderCollapse: 'collapse' },
  thead: { background: 'var(--bg-page)' },
  th: { padding: '10px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid var(--border-light)', whiteSpace: 'nowrap' },
  tr: { transition: 'background 0.1s' },
  td: { padding: '12px 16px', borderBottom: '1px solid var(--border-light)', fontSize: '13px', color: 'var(--text-primary)', verticalAlign: 'middle' },
  memberCell: { display: 'flex', alignItems: 'center', gap: '10px' },
  memberAv: {
    width: '34px', height: '34px', borderRadius: '50%',
    background: 'var(--navy)', color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '11px', fontWeight: '600', flexShrink: 0,
  },
  memberName: { fontSize: '13px', fontWeight: '500' },
  memberContact: { display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' },
  contactChip: { display: 'flex', alignItems: 'center', gap: '3px' },
  classBadge: { fontSize: '12px', color: 'var(--text-secondary)', background: 'var(--bg-page)', padding: '3px 10px', borderRadius: '99px', border: '1px solid var(--border-light)' },
  actionBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: '5px', borderRadius: '6px', color: 'var(--text-secondary)', transition: 'background 0.1s', display: 'flex', alignItems: 'center' },
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' },
  modalBox: { background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: '640px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 64px rgba(0,0,0,0.2)' },
  modalHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid var(--border-light)' },
  modalBody: { padding: '20px 24px', overflowY: 'auto', flex: 1 },
  modalFooter: { display: 'flex', gap: '10px', justifyContent: 'flex-end', padding: '16px 24px', borderTop: '1px solid var(--border-light)' },
  closeBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--text-muted)', display: 'flex', borderRadius: '6px' },
}
