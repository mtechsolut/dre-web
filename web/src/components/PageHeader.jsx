import { RefreshCcw } from "lucide-react";

export default function PageHeader({
  title,
  subtitle,
  right,
  onRefresh,
  loading,
  children, // aqui entra a linha dos meses, tabs, etc
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          <div className="text-lg font-semibold tracking-tight">{title}</div>
          {subtitle ? (
            <div className="text-xs text-zinc-400 mt-0.5">{subtitle}</div>
          ) : null}
        </div>

        <div className="flex items-center gap-2 justify-end">
          {right}

          {onRefresh ? (
            <button
              onClick={onRefresh}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 text-sm hover:bg-white/10 transition"
              title="Atualizar"
            >
              <RefreshCcw size={16} className={loading ? "animate-spin" : ""} />
              Atualizar
            </button>
          ) : null}
        </div>
      </div>

      {children ? <div className="mt-4">{children}</div> : null}
    </div>
  );
}