import { NavLink, Outlet } from "react-router-dom";
import { BarChart3, ClipboardList, Database, FileText, LogOut, Moon, Sun } from "lucide-react";
import CompanySwitcher from "../components/CompanySwitcher";
import CompetencePicker from "../components/CompetencePicker";

export default function AppShell({ theme, toggleTheme, onLogout }) {
  return (
    <div className="h-full bg-zinc-950 text-zinc-100 dark:bg-zinc-950 dark:text-zinc-100 bg-zinc-50 text-zinc-900">
      <div className="h-full flex">
        {/* Sidebar */}
        <aside className="w-64 border-r border-zinc-800 dark:border-zinc-800 border-zinc-200 dark:bg-zinc-950 bg-white">
          <div className="px-4 py-4">
            <div className="text-lg font-semibold tracking-tight">DRE Dashboard</div>
            <div className="text-xs text-zinc-400 dark:text-zinc-400 text-zinc-500">estilo BI</div>
          </div>

          <nav className="px-2 pb-4">
            <SideItem to="/dashboard" icon={<BarChart3 size={18} />} label="Dashboard" />
            <SideItem to="/lancamentos" icon={<ClipboardList size={18} />} label="Lançamentos" />
            <SideItem to="/cadastros" icon={<Database size={18} />} label="Cadastros" />
            <SideItem to="/relatorios" icon={<FileText size={18} />} label="Relatórios" />
          </nav>
        </aside>

        {/* Main */}
        <div className="flex-1 flex flex-col">
          {/* Topbar */}
          <header className="h-14 border-b border-zinc-800 dark:border-zinc-800 border-zinc-200 dark:bg-zinc-950 bg-white flex items-center justify-between px-4">
            <div className="flex items-center gap-3">
              <CompanySwitcher />
              <CompetencePicker />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={toggleTheme}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-zinc-800 dark:border-zinc-800 border-zinc-200 hover:bg-zinc-900/40 dark:hover:bg-zinc-900/40 hover:bg-zinc-100"
                title="Alternar tema"
              >
                {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
                <span className="text-sm">{theme === "dark" ? "Light" : "Dark"}</span>
              </button>

              <button
                onClick={onLogout}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-zinc-800 dark:border-zinc-800 border-zinc-200 hover:bg-zinc-900/40 dark:hover:bg-zinc-900/40 hover:bg-zinc-100"
                title="Sair"
              >
                <LogOut size={16} />
                <span className="text-sm">Sair</span>
              </button>
            </div>
          </header>

          {/* Content */}
          <main className="flex-1 overflow-auto p-4 dark:bg-zinc-950 bg-zinc-50">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}

function SideItem({ to, icon, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          "flex items-center gap-3 px-3 py-2 rounded-md text-sm",
          "hover:bg-zinc-900/40 dark:hover:bg-zinc-900/40 hover:bg-zinc-100",
          "text-zinc-300 dark:text-zinc-300 text-zinc-700",
          isActive ? "bg-zinc-900/50 dark:bg-zinc-900/50 bg-zinc-100 font-medium" : ""
        ].join(" ")
      }
    >
      <span className="opacity-90">{icon}</span>
      <span>{label}</span>
    </NavLink>
  );
}