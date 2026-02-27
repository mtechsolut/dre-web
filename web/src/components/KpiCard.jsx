import { TrendingUp, TrendingDown } from "lucide-react";

function formatCurrency(value) {
  if (value === null || value === undefined) return "—";

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value));
}

function formatPercent(value) {
  if (value === null || value === undefined) return "—";

  return `${(Number(value) * 100).toFixed(1)}%`;
}

export default function KpiCard({
  title,
  value,
  percent,
  trend = "neutral", // "up" | "down" | "neutral"
}) {
  const isUp = trend === "up";
  const isDown = trend === "down";

  return (
    <div
      className="
        rounded-xl 
        border 
        border-zinc-800 dark:border-zinc-800 border-zinc-200
        bg-zinc-900/60 dark:bg-zinc-900/60 bg-white
        p-5 
        shadow-sm
        transition-all
        hover:shadow-lg
      "
    >
      {/* Título */}
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wide text-zinc-400 dark:text-zinc-400 text-zinc-600">
          {title}
        </span>

        {isUp && (
          <TrendingUp className="text-emerald-400" size={16} />
        )}
        {isDown && (
          <TrendingDown className="text-red-400" size={16} />
        )}
      </div>

      {/* Valor principal */}
      <div className="mt-3 text-2xl font-semibold">
        {formatCurrency(value)}
      </div>

      {/* Percentual opcional */}
      {percent !== undefined && (
        <div
          className={`
            mt-2 text-sm font-medium
            ${
              isUp
                ? "text-emerald-400"
                : isDown
                ? "text-red-400"
                : "text-zinc-400 dark:text-zinc-400 text-zinc-600"
            }
          `}
        >
          {formatPercent(percent)}
        </div>
      )}
    </div>
  );
}