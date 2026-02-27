import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

function money(v) {
  if (v === null || v === undefined) return "—";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(v));
}

function toBarData(totais) {
  if (!totais) return [];
  return [
    { name: "Receita Líq.", value: Number(totais.receitaLiquida || 0) },
    { name: "Custos", value: Number(totais.custos || 0) },
    { name: "Despesas", value: Number(totais.despesasOperacionais || 0) },
    { name: "Resultado", value: Number(totais.resultadoLiquido || 0) },
  ];
}

function toPieData(grupos) {
  if (!grupos) return [];
  return Object.entries(grupos)
    .map(([k, v]) => ({ name: k, value: Math.abs(Number(v || 0)) }))
    .filter((x) => x.value > 0)
    .slice(0, 8);
}

const colors = [
  "#60a5fa",
  "#34d399",
  "#fbbf24",
  "#f87171",
  "#a78bfa",
  "#22d3ee",
  "#fb7185",
  "#c084fc",
];

export function BarSummaryChart({ totals }) {
  const barData = toBarData(totals);
  const hasBar = barData.some((d) => Math.abs(d.value) > 0);

  return (
    <div className="h-full w-full">
      {hasBar ? (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={barData} margin={{ top: 10, right: 10, left: 0, bottom: 30 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip formatter={(v) => money(v)} />
            <Bar dataKey="value" fill="#60a5fa" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-full flex items-center justify-center text-sm text-zinc-400">
          Sem dados para esta competência.
        </div>
      )}
    </div>
  );
}

export function GroupDonutChart({ groups }) {
  const pieData = toPieData(groups);
  const hasPie = pieData.some((d) => d.value > 0);

  return (
    <div className="h-full w-full">
      {hasPie ? (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip formatter={(v) => money(v)} />
            <Legend verticalAlign="bottom" height={32} wrapperStyle={{ fontSize: 12, opacity: 0.9 }} />
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="46%"
              innerRadius={55}
              outerRadius={90}
              paddingAngle={2}
              stroke="rgba(255,255,255,0.25)"
              strokeWidth={1}
            >
              {pieData.map((_, idx) => (
                <Cell key={idx} fill={colors[idx % colors.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-full flex items-center justify-center text-sm text-zinc-400">
          Sem dados por grupo ainda.
        </div>
      )}
    </div>
  );
}

// Mantém export default antigo se você ainda usa em outros lugares (compatibilidade)
export default function DreCharts() {
  return null;
}