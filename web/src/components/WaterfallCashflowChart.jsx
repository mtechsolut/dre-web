import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from "recharts";

function money(v) {
  if (v === null || v === undefined) return "—";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(v));
}

function makeWaterfall(data) {
  const rows = Array.isArray(data) ? data : [];
  if (rows.length === 0) return [];

  // ordena por month (YYYY-MM)
  const sorted = [...rows].sort((a, b) => String(a.month).localeCompare(String(b.month)));

  const out = [];
  let prev = null;
  for (const r of sorted) {
    const cur = Number(r.resultado || 0);
    const delta = prev === null ? cur : cur - prev;
    out.push({
      month: r.month,
      delta,
      resultado: cur,
    });
    prev = cur;
  }
  return out;
}

export default function WaterfallCashflowChart({ data }) {
  const wf = makeWaterfall(data);
  const has = wf.some((d) => Math.abs(Number(d.delta || 0)) > 0);

  return (
    <div className="h-full min-h-0 flex flex-col">
      <div className="flex-1 min-h-0 p-4">
        {has ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={wf} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(v, name, props) => {
                  if (name === "delta") return [`Δ ${money(v)}`, "Variação"];
                  return [money(v), name];
                }}
                labelFormatter={(label) => `Mês: ${label}`}
              />
              <Bar dataKey="delta" radius={[8, 8, 0, 0]}>
                {wf.map((row, i) => (
                  <Cell
                    key={i}
                    fill={row.delta >= 0 ? "#34d399" : "#f87171"} // verde / vermelho
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-sm text-zinc-400">
            Sem dados suficientes para waterfall (precisa de meses diferentes).
          </div>
        )}
      </div>

      <div className="px-4 pb-4 text-xs text-zinc-400">
        Dica: isso é uma aproximação (waterfall por variação do Resultado Líquido).
        Depois podemos fazer waterfall real por linhas do DRE (receita, custos, despesas…).
      </div>
    </div>
  );
}