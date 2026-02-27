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

const COLORS = [
  "#60a5fa",
  "#34d399",
  "#fbbf24",
  "#f87171",
  "#a78bfa",
  "#22d3ee",
  "#fb7185",
  "#c084fc",
];

function money(v) {
  if (v === null || v === undefined) return "—";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(v));
}

export default function CostCenterChart({ data = [] }) {
  const has = (data || []).some((d) => Math.abs(Number(d.resultado || 0)) > 0);

  return (
    <div className="h-full min-h-0 flex flex-col">
      <div className="mb-2">
        <div className="text-sm font-medium">Centros de custo</div>
        <div className="text-xs text-zinc-500">
          Resultado líquido por centro (ranking)
        </div>
      </div>

      <div className="flex-1 min-h-0">
        {has ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 70 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.25} vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12 }}
                interval={0}
                angle={-25}
                textAnchor="end"
                height={80}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v) => money(v)} />
              <Bar dataKey="resultado" radius={[10, 10, 0, 0]}>
                {data.map((_, i) => (
                  <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-sm text-zinc-400">
            Sem centros ou sem lançamentos nesta competência.
          </div>
        )}
      </div>
    </div>
  );
}