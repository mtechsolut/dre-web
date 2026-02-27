import { useState } from "react";
import Login from "./pages/Login";
import SelectCompany from "./pages/SelectCompany";

import Dashboard from "./pages/Dashboard"; // FIXO 12 meses
import DashboardPrincipal from "./pages/DashboardPrincipal"; // Dashboard do mês selecionado

import Entries from "./pages/Entries";
import CostCenters from "./pages/CostCenters";
import CostCenterDashboard from "./pages/CostCenterDashboard";

function IconBtn({ active, label, onClick, children, danger = false }) {
  return (
    <button
      onClick={onClick}
      className={[
        "group relative h-10 w-10 rounded-xl border transition flex items-center justify-center",
        danger
          ? "border-red-500/30 bg-red-500/10 hover:bg-red-500/20"
          : active
          ? "border-white/20 bg-white/10"
          : "border-white/10 bg-white/5 hover:bg-white/10",
      ].join(" ")}
      aria-label={label}
      title={label}
      type="button"
    >
      {children}

      {/* Tooltip */}
      <div className="pointer-events-none absolute left-12 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition">
        <div className="rounded-lg border border-white/10 bg-black/80 px-2 py-1 text-xs text-zinc-200 whitespace-nowrap">
          {label}
        </div>
      </div>
    </button>
  );
}

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [companyId, setCompanyId] = useState(localStorage.getItem("companyId") || "");
  const [page, setPage] = useState("dashboard");
  // dashboard | dashboard-principal | entries | cc-dashboard | cost-centers | config

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("companyId");
    setCompanyId("");
    setToken("");
  }

  function onLogin(t) {
    localStorage.setItem("token", t);
    setToken(t);
    setCompanyId("");
  }

  function onSelectCompany(id) {
    localStorage.setItem("companyId", id);
    setCompanyId(id);
    setPage("dashboard");
  }

  function changeCompany() {
    localStorage.removeItem("companyId");
    setCompanyId("");
  }

  if (!token) return <Login onLogin={onLogin} />;

  if (!companyId) {
    return (
      <div className="min-h-screen w-screen bg-zinc-950 text-zinc-100">
        <header className="w-full px-4 md:px-6 py-4 flex justify-end">
          <button
            onClick={logout}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10 transition"
          >
            Sair
          </button>
        </header>

        <main className="w-full px-4 md:px-6">
          <SelectCompany token={token} onSelect={onSelectCompany} />
        </main>
      </div>
    );
  }

  return (
    <div className="w-screen min-h-screen bg-[#0b0e16] text-zinc-100">
      <div className="min-h-screen w-screen bg-[radial-gradient(900px_450px_at_20%_-10%,rgba(139,92,246,0.22),transparent),radial-gradient(900px_450px_at_90%_10%,rgba(59,130,246,0.18),transparent),radial-gradient(900px_450px_at_50%_90%,rgba(236,72,153,0.12),transparent)]">
        <div className="w-full px-4 md:px-6 py-5">
          {/* ✅ FLEX em vez de GRID (mais estável para sidebar fixa) */}
          <div className="flex gap-4 items-start">
            {/* ✅ Sidebar "fixa" com sticky (não mexe com scroll das páginas) */}
            <aside className="sticky top-5 h-[calc(100vh-40px)] w-[64px] shrink-0 rounded-2xl border border-white/10 bg-white/[0.03] p-3 flex flex-col items-center gap-3">
              {/* Logo */}
              <div
                className="h-10 w-10 rounded-xl bg-gradient-to-tr from-purple-500 to-blue-500"
                title="DRE Web"
              />

              {/* Dashboard (12 meses) */}
              <IconBtn
                label="Dashboard (12 meses)"
                active={page === "dashboard"}
                onClick={() => setPage("dashboard")}
              >
                <span className="text-sm">📊</span>
              </IconBtn>

              {/* Dashboard principal */}
              <IconBtn
                label="Dashboard principal"
                active={page === "dashboard-principal"}
                onClick={() => setPage("dashboard-principal")}
              >
                <span className="text-sm">🧠</span>
              </IconBtn>

              {/* Dashboard Centro de Custo */}
              <IconBtn
                label="Dashboard Centro de Custo"
                active={page === "cc-dashboard"}
                onClick={() => setPage("cc-dashboard")}
              >
                <span className="text-sm">🧩</span>
              </IconBtn>

              {/* Centro de custo (cadastro) */}
              <IconBtn
                label="Centro de custo (cadastro)"
                active={page === "cost-centers"}
                onClick={() => setPage("cost-centers")}
              >
                <span className="text-sm">🏷️</span>
              </IconBtn>

              {/* Lançamentos */}
              <IconBtn
                label="Lançamentos"
                active={page === "entries"}
                onClick={() => setPage("entries")}
              >
                <span className="text-sm">🧾</span>
              </IconBtn>
              
              {/* ✅ empurra pro final */}
              <div className="mt-auto" />

              {/* ✅ Trocar empresa (AGORA NA SIDEBAR) */}
              <IconBtn
                label="Trocar empresa"
                active={false}
                onClick={changeCompany}
              >
                <span className="text-sm">🔁</span>
              </IconBtn>

              {/* ✅ Sair (AGORA NA SIDEBAR) */}
              <IconBtn
                label="Sair"
                active={false}
                onClick={logout}
                danger
              >
                <span className="text-sm">🚪</span>
              </IconBtn>

              {/* Config */}
              <IconBtn
                label="Config"
                active={page === "config"}
                onClick={() => setPage("config")}
              >
                <span className="text-sm">⚙️</span>
              </IconBtn>
            </aside>

            {/* Main */}
            <main className="min-w-0 flex-1">
              {/* ✅ removi a Top bar daqui */}
              {page === "dashboard" && <Dashboard token={token} companyId={companyId} />}

              {page === "dashboard-principal" && (
                <DashboardPrincipal token={token} companyId={companyId} />
              )}

              {page === "entries" && <Entries token={token} companyId={companyId} />}
              {page === "cc-dashboard" && (
                <CostCenterDashboard token={token} companyId={companyId} />
              )}
              {page === "cost-centers" && <CostCenters token={token} companyId={companyId} />}

              {page === "config" && (
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                  <div className="text-sm font-semibold">Config</div>
                  <div className="text-xs text-zinc-400 mt-1">
                    (depois colocamos tema dark/light, perfil, etc.)
                  </div>
                </div>
              )}
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}