import { useMemo, useState } from "react";
import { api } from "../api/client";
import { Lock, Mail, ShieldCheck } from "lucide-react";

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const canSubmit = useMemo(() => {
    return email.trim().length > 0 && password.trim().length >= 3 && !loading;
  }, [email, password, loading]);

  async function submit(e) {
    e.preventDefault();
    setErr("");
    setLoading(true);

    try {
      const data = await api("/auth/login", {
        method: "POST",
        body: { email: email.trim(), password }
      });

      // token
      if (remember) localStorage.setItem("token", data.token);
      else sessionStorage.setItem("token", data.token);

      // competência padrão (mês atual)
      const currentMonth = new Date().toISOString().slice(0, 7);
      localStorage.setItem("competenceMonth", currentMonth);

      // força escolher empresa
      localStorage.removeItem("companyId");

      onLogin(data.token);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full bg-zinc-950 text-zinc-100">
      {/* background */}
      <div className="pointer-events-none fixed inset-0 opacity-60">
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-indigo-500/25 blur-3xl" />
        <div className="absolute top-40 -right-40 h-96 w-96 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute bottom-[-120px] left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-fuchsia-500/10 blur-3xl" />
      </div>

      <div className="relative flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-md">
          {/* Brand */}
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/10">
              <ShieldCheck className="opacity-90" />
            </div>
            <div>
              <div className="text-lg font-semibold tracking-tight">DRE Dashboard</div>
              <div className="text-sm text-zinc-400">Multiempresas • Competência • Centro de custo</div>
            </div>
          </div>

          {/* Card */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur">
            <div className="mb-5">
              <div className="text-xl font-semibold">Entrar</div>
              <div className="mt-1 text-sm text-zinc-400">
                Acesse sua conta para visualizar indicadores e relatórios.
              </div>
            </div>

            {err && (
              <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
                {err}
              </div>
            )}

            <form onSubmit={submit} className="space-y-3">
              <div className="space-y-2">
                <label className="text-xs text-zinc-300">Email</label>
                <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2 focus-within:ring-2 focus-within:ring-indigo-500/40">
                  <Mail size={18} className="text-zinc-400" />
                  <input
                    className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-600"
                    placeholder="seuemail@exemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs text-zinc-300">Senha</label>
                <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2 focus-within:ring-2 focus-within:ring-indigo-500/40">
                  <Lock size={18} className="text-zinc-400" />
                  <input
                    className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-600"
                    placeholder="••••••••"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 text-sm text-zinc-300">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="h-4 w-4 accent-indigo-500"
                  />
                  Lembrar de mim
                </label>

                <button
                  type="button"
                  className="text-sm text-zinc-400 hover:text-zinc-200"
                  onClick={() => setErr("Recuperação de senha: vamos adicionar depois.")}
                >
                  Esqueci minha senha
                </button>
              </div>

              <button
                disabled={!canSubmit}
                className="
                  mt-2 w-full rounded-xl px-4 py-2.5 text-sm font-medium
                  bg-indigo-500 hover:bg-indigo-400
                  disabled:opacity-50 disabled:hover:bg-indigo-500
                  transition
                "
              >
                {loading ? "Entrando..." : "Entrar"}
              </button>
            </form>
          </div>

          <div className="mt-6 text-center text-xs text-zinc-500">
            © {new Date().getFullYear()} DRE Dashboard • Painel estilo BI
          </div>
        </div>
      </div>
    </div>
  );
}