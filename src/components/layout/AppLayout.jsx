import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import {
  LayoutDashboard, Users, CheckSquare, Newspaper, Megaphone,
  Tent, BarChart2, Headphones, Settings, LogOut, Bell, Menu, X, ChevronDown
} from 'lucide-react'

const NAV_ITEMS = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', section: 'principal' },
  { to: '/membros', icon: Users, label: 'Membros', section: 'principal' },
  { to: '/presenca', icon: CheckSquare, label: 'Presença', section: 'principal' },
  { to: '/noticias', icon: Newspaper, label: 'Notícias', section: 'conteúdo' },
  { to: '/avisos', icon: Megaphone, label: 'Comunicação', section: 'conteúdo' },
  { to: '/eventos', icon: Tent, label: 'Eventos', section: 'conteúdo' },
  { to: '/relatorios', icon: BarChart2, label: 'Relatórios', section: 'gestão' },
  { to: '/suporte', icon: Headphones, label: 'Suporte', section: 'gestão' },
  { to: '/configuracoes', icon: Settings, label: 'Configurações', section: 'gestão' },
]

const MOBILE_NAV = [
  { to: '/', icon: LayoutDashboard, label: 'Home' },
  { to: '/membros', icon: Users, label: 'Membros' },
  { to: '/avisos', icon: Megaphone, label: 'Avisos' },
  { to: '/eventos', icon: Tent, label: 'Eventos' },
  { to: '/configuracoes', icon: Settings, label: 'Perfil' },
]

export default function AppLayout() {
  const { perfil, signOut } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)

  const sections = [...new Set(NAV_ITEMS.map(i => i.section))]

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  const initials = perfil?.nome?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() || 'U'

  return (
    <div style={s.root}>
      {/* Sidebar overlay mobile */}
      {sidebarOpen && (
        <div style={s.overlay} onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside style={{ ...s.sidebar, ...(sidebarOpen ? s.sidebarOpen : {}) }}>
        <div style={s.sidebarLogo}>
          <div style={s.logoMark}>D</div>
          <div>
            <div style={s.logoName}>DesbraSys</div>
            <div style={s.logoSub}>{perfil?.clubes?.nome || 'Gestão de Clubes'}</div>
          </div>
          <button style={s.closeBtn} onClick={() => setSidebarOpen(false)} className="hide-desktop">
            <X size={16} color="rgba(255,255,255,0.6)" />
          </button>
        </div>

        <nav style={s.nav}>
          {sections.map(section => (
            <div key={section}>
              <div style={s.navSection}>{section}</div>
              {NAV_ITEMS.filter(i => i.section === section).map(({ to, icon: Icon, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/'}
                  style={({ isActive }) => ({ ...s.navItem, ...(isActive ? s.navItemActive : {}) })}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon size={16} />
                  <span>{label}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div style={s.sidebarFooter}>
          <div style={s.sidebarUser}>
            <div style={s.userAv}>{initials}</div>
            <div style={s.userInfo}>
              <div style={s.userName}>{perfil?.nome?.split(' ')[0]}</div>
              <div style={s.userRole}>{perfil?.nivel_acesso}</div>
            </div>
          </div>
          <button onClick={handleLogout} style={s.logoutBtn}>
            <LogOut size={14} />
          </button>
        </div>
      </aside>

      {/* Main */}
      <div style={s.main}>
        {/* Topbar */}
        <header style={s.topbar}>
          <button style={s.menuBtn} onClick={() => setSidebarOpen(true)}>
            <Menu size={20} color="var(--text-secondary)" />
          </button>

          <div style={s.topbarClub}>
            <span style={s.topbarClubName}>{perfil?.clubes?.nome || 'Clube'}</span>
            <span style={s.topbarClubLoc}>
              {perfil?.clubes?.cidade} · {perfil?.clubes?.estado}
            </span>
          </div>

          <div style={s.topbarRight}>
            <button style={s.iconBtn}>
              <Bell size={18} color="var(--text-secondary)" />
              <span style={s.notifDot} />
            </button>

            <div style={s.profileBtn} onClick={() => setProfileOpen(!profileOpen)}>
              <div style={s.profileAv}>{initials}</div>
              <span style={s.profileName} className="hide-mobile">{perfil?.nome?.split(' ')[0]}</span>
              <ChevronDown size={14} color="var(--text-secondary)" className="hide-mobile" />
            </div>

            {profileOpen && (
              <div style={s.profileMenu}>
                <div style={s.profileMenuHeader}>
                  <div style={s.profileMenuName}>{perfil?.nome}</div>
                  <span className={`badge badge-${perfil?.nivel_acesso}`}>{perfil?.nivel_acesso}</span>
                </div>
                <div style={s.profileMenuDivider} />
                <button style={s.profileMenuItem} onClick={() => { navigate('/configuracoes'); setProfileOpen(false) }}>
                  <Settings size={14} /> Configurações
                </button>
                <button style={{ ...s.profileMenuItem, color: 'var(--danger)' }} onClick={handleLogout}>
                  <LogOut size={14} /> Sair
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Page content */}
        <main style={s.content}>
          <Outlet />
        </main>

        {/* Bottom nav mobile */}
        <nav style={s.bottomNav} className="bottom-nav">
          {MOBILE_NAV.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              style={({ isActive }) => ({ ...s.bnItem, ...(isActive ? s.bnItemActive : {}) })}
            >
              {({ isActive }) => (
                <>
                  <Icon size={20} color={isActive ? 'var(--navy)' : 'var(--text-muted)'} />
                  <span style={{ fontSize: '10px', color: isActive ? 'var(--navy)' : 'var(--text-muted)', fontWeight: isActive ? '600' : '400' }}>
                    {label}
                  </span>
                  {isActive && <div style={s.bnDot} />}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  )
}

const s = {
  root: { display: 'flex', minHeight: '100vh', position: 'relative' },
  overlay: {
    position: 'fixed', inset: 0,
    background: 'rgba(0,0,0,0.4)',
    zIndex: 99,
  },
  sidebar: {
    width: 'var(--sidebar-width)',
    background: 'var(--navy)',
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
    position: 'sticky',
    top: 0,
    height: '100vh',
    zIndex: 100,
    '@media(max-width:768px)': { position: 'fixed' },
  },
  sidebarOpen: {
    position: 'fixed',
    left: 0,
    top: 0,
    height: '100%',
  },
  sidebarLogo: {
    display: 'flex', alignItems: 'center', gap: '10px',
    padding: '18px 16px 14px',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    flexShrink: 0,
  },
  logoMark: {
    width: '32px', height: '32px',
    background: '#3d9be9',
    borderRadius: '8px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '16px', fontWeight: '700', color: '#fff',
    flexShrink: 0,
  },
  logoName: { fontSize: '14px', fontWeight: '600', color: '#fff' },
  logoSub: { fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginTop: '1px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '120px' },
  closeBtn: { marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', padding: '4px' },
  nav: { flex: 1, padding: '8px 0', overflowY: 'auto' },
  navSection: {
    padding: '10px 16px 4px',
    fontSize: '10px', fontWeight: '600',
    color: 'rgba(255,255,255,0.3)',
    textTransform: 'uppercase', letterSpacing: '1px',
  },
  navItem: {
    display: 'flex', alignItems: 'center', gap: '10px',
    padding: '9px 16px',
    color: 'rgba(255,255,255,0.6)',
    fontSize: '13px',
    borderLeft: '2px solid transparent',
    transition: 'all 0.15s',
    textDecoration: 'none',
  },
  navItemActive: {
    background: 'rgba(255,255,255,0.1)',
    color: '#fff',
    borderLeftColor: '#3d9be9',
  },
  sidebarFooter: {
    padding: '12px 16px',
    borderTop: '1px solid rgba(255,255,255,0.08)',
    display: 'flex', alignItems: 'center', gap: '8px',
    flexShrink: 0,
  },
  sidebarUser: { display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 },
  userAv: {
    width: '30px', height: '30px', borderRadius: '50%',
    background: '#3d9be9', color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '11px', fontWeight: '600', flexShrink: 0,
  },
  userInfo: { minWidth: 0 },
  userName: { fontSize: '12px', fontWeight: '500', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  userRole: { fontSize: '10px', color: 'rgba(255,255,255,0.4)', textTransform: 'capitalize' },
  logoutBtn: {
    background: 'none', border: 'none', cursor: 'pointer',
    padding: '6px', borderRadius: '6px',
    display: 'flex', alignItems: 'center',
    color: 'rgba(255,255,255,0.4)',
    transition: 'color 0.15s',
  },
  main: { flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 },
  topbar: {
    height: 'var(--topbar-height)',
    background: 'var(--bg-card)',
    borderBottom: '1px solid var(--border-light)',
    display: 'flex', alignItems: 'center',
    padding: '0 20px', gap: '12px',
    position: 'sticky', top: 0, zIndex: 10,
    flexShrink: 0,
  },
  menuBtn: {
    background: 'none', border: 'none', cursor: 'pointer',
    padding: '6px', display: 'none',
  },
  topbarClub: { flex: 1, display: 'flex', alignItems: 'baseline', gap: '8px' },
  topbarClubName: { fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' },
  topbarClubLoc: { fontSize: '12px', color: 'var(--text-muted)' },
  topbarRight: { display: 'flex', alignItems: 'center', gap: '8px', position: 'relative' },
  iconBtn: {
    width: '34px', height: '34px',
    background: 'var(--bg-page)',
    border: '1px solid var(--border-light)',
    borderRadius: 'var(--radius-sm)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', position: 'relative',
  },
  notifDot: {
    position: 'absolute', top: '7px', right: '7px',
    width: '7px', height: '7px', borderRadius: '50%',
    background: '#e74c3c',
    border: '1.5px solid var(--bg-card)',
  },
  profileBtn: {
    display: 'flex', alignItems: 'center', gap: '8px',
    cursor: 'pointer', padding: '4px 8px',
    borderRadius: 'var(--radius-sm)',
    transition: 'background 0.15s',
  },
  profileAv: {
    width: '32px', height: '32px', borderRadius: '50%',
    background: 'var(--navy)', color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '11px', fontWeight: '600',
  },
  profileName: { fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)' },
  profileMenu: {
    position: 'absolute', top: '44px', right: 0,
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-md)',
    boxShadow: 'var(--shadow-md)',
    padding: '8px',
    minWidth: '200px',
    zIndex: 200,
  },
  profileMenuHeader: { padding: '8px', display: 'flex', flexDirection: 'column', gap: '4px' },
  profileMenuName: { fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' },
  profileMenuDivider: { height: '1px', background: 'var(--border-light)', margin: '4px 0' },
  profileMenuItem: {
    display: 'flex', alignItems: 'center', gap: '8px',
    width: '100%', padding: '8px 10px',
    background: 'none', border: 'none',
    borderRadius: 'var(--radius-sm)',
    fontSize: '13px', color: 'var(--text-secondary)',
    cursor: 'pointer', transition: 'background 0.15s',
    textAlign: 'left',
  },
  content: {
    flex: 1, padding: '24px',
    overflowY: 'auto',
    paddingBottom: '80px',
  },
  bottomNav: {
    display: 'none',
    position: 'fixed', bottom: 0, left: 0, right: 0,
    background: 'var(--bg-card)',
    borderTop: '1px solid var(--border-light)',
    padding: '8px 0',
    zIndex: 50,
  },
  bnItem: {
    flex: 1, display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: '3px',
    textDecoration: 'none', position: 'relative',
    padding: '4px',
  },
  bnItemActive: {},
  bnDot: {
    width: '4px', height: '4px', borderRadius: '50%',
    background: 'var(--navy)',
    position: 'absolute', bottom: '-2px',
  },
}

// Inject responsive CSS
const styleTag = document.createElement('style')
styleTag.textContent = `
  @media (max-width: 768px) {
    aside { position: fixed !important; left: -220px; transition: left 0.25s; }
    aside.open { left: 0 !important; }
    .hide-mobile { display: none !important; }
    nav[style*="bottom-nav"], .bottom-nav { display: flex !important; }
    [style*="menuBtn"] { display: flex !important; }
  }
  @media (min-width: 769px) {
    .hide-desktop { display: none !important; }
  }
`
document.head.appendChild(styleTag)
