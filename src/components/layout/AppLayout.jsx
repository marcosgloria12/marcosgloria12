import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import {
  LayoutDashboard,
  Users,
  CheckSquare,
  Newspaper,
  Megaphone,
  Tent,
  BarChart2,
  Headphones,
  Settings,
  LogOut,
  Bell,
  Menu,
  X,
  ChevronDown,
} from "lucide-react";

const NAV_ITEMS = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard", section: "principal" },
  { to: "/membros", icon: Users, label: "Membros", section: "principal" },
  {
    to: "/presenca",
    icon: CheckSquare,
    label: "Presença",
    section: "principal",
  },
  { to: "/noticias", icon: Newspaper, label: "Notícias", section: "conteúdo" },
  { to: "/avisos", icon: Megaphone, label: "Comunicação", section: "conteúdo" },
  { to: "/eventos", icon: Tent, label: "Eventos", section: "conteúdo" },
  {
    to: "/relatorios",
    icon: BarChart2,
    label: "Relatórios",
    section: "gestão",
  },
  { to: "/suporte", icon: Headphones, label: "Suporte", section: "gestão" },
  {
    to: "/configuracoes",
    icon: Settings,
    label: "Configurações",
    section: "gestão",
  },
];

export default function AppLayout() {
  const { perfil, signOut } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const initials =
    perfil?.nome
      ?.split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "U";

  const sections = [...new Set(NAV_ITEMS.map((i) => i.section))];

  async function handleLogout() {
    await signOut();
    navigate("/login");
  }

  return (
    <div className="flex min-h-screen bg-slate-100">
      {/* overlay mobile - aqui é pra display de celualre */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR - sidebar é a parte que fica na parte da esquerda do site  */}
      <aside
        className={`
    fixed inset-y-0 left-0 z-50
    h-screen w-64
    bg-slate-900 text-white
    flex flex-col
    transition-transform duration-200
    ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
    md:static md:translate-x-0
  `}
      >
        {/* logo - logo di bagui */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-white/10">
          <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center font-bold">
            D
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold">DesbraSys</div>
            <div className="text-xs text-white/50 truncate">
              {perfil?.clubes?.nome || "Gestão de Clubes"}
            </div>
          </div>
          <button className="md:hidden" onClick={() => setSidebarOpen(false)}>
            <X size={18} />
          </button>
        </div>

        {/* nav */}
        <nav className="flex-1 overflow-y-auto py-2">
          {sections.map((section) => (
            <div key={section}>
              <div className="px-4 py-2 text-[10px] font-semibold uppercase tracking-widest text-white/40">
                {section}
              </div>

              {NAV_ITEMS.filter((i) => i.section === section).map(
                ({ to, icon: Icon, label }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={to === "/"}
                    className={({ isActive }) =>
                      `
                    flex items-center gap-3 px-4 py-2 text-sm
                    border-l-2 transition
                    ${
                      isActive
                        ? "bg-white/10 text-white border-blue-400"
                        : "text-white/60 border-transparent hover:text-white"
                    }
                    `
                    }
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Icon size={16} />
                    {label}
                  </NavLink>
                ),
              )}
            </div>
          ))}
        </nav>

        {/* footer - rodapé lá em baixo*/}
        <div className="border-t border-white/10 px-4 py-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-xs font-semibold">
            {initials}
          </div>
          <div className="flex-1">
            <div className="text-sm truncate">{perfil?.nome}</div>
            <div className="text-xs text-white/50 capitalize">
              {perfil?.nivel_acesso}
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="text-white/50 hover:text-white"
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* MAIN - conteudi pribncipal, fica no meio da page  */}
      <div className="flex-1 flex flex-col">
        {/* TOPBAR */}
        <header className="h-14 bg-white border-b flex items-center px-4 gap-3 sticky top-0 z-10">
          <button className="md:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu size={20} />
          </button>

          <div className="flex-1">
            <div className="text-sm font-semibold">{perfil?.clubes?.nome}</div>
            <div className="text-xs text-slate-500">
              {perfil?.clubes?.cidade} · {perfil?.clubes?.estado}
            </div>
          </div>

          <button className="relative p-2 rounded-md border">
            <Bell size={18} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          </button>

          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => setProfileOpen(!profileOpen)}
          >
            <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs">
              {initials}
            </div>
            <span className="hidden md:block text-sm">
              {perfil?.nome?.split(" ")[0]}
            </span>
            <ChevronDown size={14} />
          </div>

          {profileOpen && (
            <div className="absolute right-4 top-14 bg-white border rounded-lg shadow-md w-48 p-2">
              <button
                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-slate-100 rounded"
                onClick={() => navigate("/configuracoes")}
              >
                <Settings size={14} /> Configurações
              </button>
              <button
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded"
                onClick={handleLogout}
              >
                <LogOut size={14} /> Sair
              </button>
            </div>
          )}
        </header>

        {/* CONTENT */}
        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
