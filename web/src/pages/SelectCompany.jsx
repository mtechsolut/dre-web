import { useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import { Building2, Plus, Search, ChevronRight, RefreshCcw } from "lucide-react";

export default function SelectCompany({ token, onSelect }) {
  const [companies, setCompanies] = useState([]);
  const [query, setQuery] = useState("");
  const [newName, setNewName] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  async function load() {
    setErr("");
    setLoading(true);
    try {
      const data = await api("/companies", { token });
      setCompanies(data.companies || []);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function createCompany() {
    setErr("");
    const name = newName.trim();
    if (!name) return setErr("Digite o nome da empresa.");

    setCreating(true);
    try {
      const res = await api("/companies", {
        method: "POST",
        token,
        body: { name }
      });

      setNewName("");
      await load();

      // seleciona automaticamente
      if (res?.company?.id) onSelect(res.company.id);
    } catch (e) {
      setErr(e.message);
    } finally {
      setCreating(false);
    }
  }

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return companies;
    return companies.filter(c => (c.name || "").toLowerCase().includes(q));
  }, [companies, query]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* background glow */}
      <div className="pointer-events-none fixed inset-0 opacity-60">
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute top-40 -right-40 h-96 w-96 rounded-full bg-cyan-500/15 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-5xl px-4 py-10">
        {/* Header */}
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Escolha a empresa</h1>
            <p className="mt-1 text-sm text-zinc-400">
              Selecione uma empresa para entrar no dashboard. Você também pode criar uma nova.
            </p>
          </div>

          <button
            onClick={load}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10 transition"
            title="Recarregar"
          >
            <RefreshCcw size={16} className={loading ? "animate-spin" : ""} />
            Recarregar
          </button>
        </div>

        {/* Errors */}
        {err && (
          <div className="mt-5 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
            {err}
          </div>
        )}

        {/* Top controls */}
        <div className="mt-6 grid grid-cols-1 gap-3 lg:grid-cols-3">
          {/* Search */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-sm font-medium">Buscar</div>
            <div className="mt-2 flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2">
              <Search size={16} className="text-zinc-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-600"
                placeholder="Digite o nome da empresa…"
              />
            </div>
            <div className="mt-2 text-xs text-zinc-500">
              {companies.length} empresas • {filtered.length} visíveis
            </div>
          </div>

          {/* Create */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 lg:col-span-2">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-medium">Criar empresa</div>
                <div className="mt-1 text-xs text-zinc-500">
                  Você será marcado como <b>OWNER</b>.
                </div>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                <Plus />
              </div>
            </div>

            <div className="mt-3 flex flex-col gap-2 md:flex-row">
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="h-10 flex-1 rounded-xl border border-white/10 bg-black/20 px-3 text-sm outline-none placeholder:text-zinc-600 focus:ring-2 focus:ring-indigo-500/40"
                placeholder="Ex: Matriz Fortaleza LTDA"
              />
              <button
                onClick={createCompany}
                disabled={creating}
                className="h-10 rounded-xl bg-indigo-500 px-4 text-sm font-medium hover:bg-indigo-400 disabled:opacity-60 transition"
              >
                {creating ? "Criando..." : "Criar e acessar"}
              </button>
            </div>
          </div>
        </div>

        {/* Cards list */}
        <div className="mt-6">
          <div className="mb-3 text-sm font-medium">Minhas empresas</div>

          {loading ? (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-24 rounded-2xl border border-white/10 bg-white/5 animate-pulse"
                />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-zinc-400">
              Nenhuma empresa encontrada.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map((c) => (
                <button
                  key={c.id}
                  onClick={() => onSelect(c.id)}
                  className="group text-left rounded-2xl border border-white/10 bg-white/5 p-4 hover:bg-white/10 transition"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                        <Building2 />
                      </div>
                      <div>
                        <div className="font-medium leading-tight">{c.name}</div>
                        <div className="mt-1 text-xs text-zinc-500">Acesso: {c.role}</div>
                      </div>
                    </div>

                    <ChevronRight className="opacity-0 group-hover:opacity-100 transition" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="mt-8 text-center text-xs text-zinc-600">
          Dica: depois a gente adiciona “favoritar” e “última empresa acessada”.
        </div>
      </div>
    </div>
  );
}