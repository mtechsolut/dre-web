import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

function money(v) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(v || 0));
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="rounded-lg border border-white/10 bg-[#111827] px-3 py-2 text-xs shadow-xl">
      <div className="text-zinc-400 mb-1">{label}</div>

      {payload.map((entry, index) => (
        <div key={index} className="flex justify-between gap-4">
          <span style={{ color: entry.color }} className="font-medium">
            {entry.name}
          </span>
          <span className="text-zinc-200 font-semibold">
            {money(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function TrendLineChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />

        <XAxis
          dataKey="month"
          stroke="#a1a1aa"
          fontSize={12}
        />

        <YAxis
          stroke="#a1a1aa"
          fontSize={12}
          tickFormatter={(v) => `R$ ${v / 1000}k`}
        />

        <Tooltip content={<CustomTooltip />} />

        {/* ✅ Receita (verde) */}
        <Line
          type="monotone"
          dataKey="receita"
          stroke="#22c55e"
          strokeWidth={3}
          dot={{ r: 4 }}
          name="Receita"
        />

        {/* ✅ Despesa (vermelho) */}
        <Line
          type="monotone"
          dataKey="despesa"
          stroke="#ef4444"
          strokeWidth={3}
          dot={{ r: 4 }}
          name="Despesa"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}