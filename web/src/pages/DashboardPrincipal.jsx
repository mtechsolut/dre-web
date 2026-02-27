import { useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import { RefreshCcw } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LabelList,
} from "recharts";

const MONTHS = [
  { key: "01", label: "jan" }, { key: "02", label: "fev" }, { key: "03", label: "mar" },
  { key: "04", label: "abr" }, { key: "05", label: "mai" }, { key: "06", label: "jun" },
  { key: "07", label: "jul" }, { key: "08", label: "ago" }, { key: "09", label: "set" },
  { key: "10", label: "out" }, { key: "11", label: "nov" }, { key: "12", label: "dez" },
];

function yearsAroundNow(count = 8) {
  const y = new Date().getFullYear();
  const list = [];
  for (let i = 0; i < count; i++) list.push(String(y - i));
  return list;
}

function money(v) {
  if (v === null || v === undefined) return "—";
  const n = Number(v);
  if (!Number.isFinite(n)) return "—";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);
}

function pctInt(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return "—";
  return `${Math.round(n)}%`;
}

function Panel({ title, subtitle, children }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.04] shadow-[0_20px_60px_rgba(0,0,0,0.45)] overflow-hidden">
      <div className="px-4 py-3 border-b border-white/10">
        <div className="text-sm font-semibold text-zinc-100">{title}</div>
        {subtitle ? <div className="text-xs text-zinc-400 mt-0.5">{subtitle}</div> : null}
      </div>
      <div className="p-3">{children}</div>
    </div>
  );
}

/**
 * ✅ KPI com % AO LADO do valor
 */
function KpiCard({ title, valueLeft, valueRight, subtitle, colorClass, icon }) {
  return (
    <div className={["rounded-xl p-4 text-white shadow-lg bg-gradient-to-r", colorClass].join(" ")}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-sm opacity-90 font-medium">{title}</div>

          <div className="mt-2 flex items-center justify-between gap-3">
            <div className="text-xl font-semibold truncate">{valueLeft}</div>
            {valueRight ? (
              <div className="text-sm font-semibold opacity-95 shrink-0">{valueRight}</div>
            ) : null}
          </div>

          {subtitle ? <div className="text-xs opacity-80 mt-1">{subtitle}</div> : null}
        </div>

        <div className="opacity-90 text-lg shrink-0">{icon}</div>
      </div>
    </div>
  );
}

/** Tooltip pequeno e escuro (barras) */
function SmallDarkTooltip({ active, payload, label, mode = "yoy" }) {
  if (!active || !payload?.length) return null;

  const wrapStyle = {
    background: "rgba(0,0,0,0.78)",
    border: "1px solid rgba(255,255,255,0.14)",
    borderRadius: 12,
    padding: "8px 10px",
    boxShadow: "0 20px 60px rgba(0,0,0,0.55)",
    maxWidth: 260,
    pointerEvents: "none",
  };

  const titleStyle = {
    color: "rgba(255,255,255,0.92)",
    fontSize: 12,
    fontWeight: 900,
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  };

  const rowStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    fontSize: 12,
    color: "rgba(255,255,255,0.90)",
    marginTop: 4,
  };

  const dotStyle = (c) => ({
    width: 8,
    height: 8,
    borderRadius: 999,
    background: c,
    display: "inline-block",
    marginRight: 8,
    boxShadow: "0 0 0 2px rgba(255,255,255,0.10)",
  });

  const prettyName = (key) => {
    if (key === "anoAnterior") return "Ano anterior";
    if (key === "anoSelecionado") return "Ano selecionado";
    if (key === "receitaPct") return "Receita";
    if (key === "despesaPct") return "Despesa";
    return key;
  };

  const fullRow = payload?.[0]?.payload;

  return (
    <div style={wrapStyle}>
      <div style={titleStyle}>{label}</div>

      {mode === "yoy" && (
        <>
          {payload.map((p) => (
            <div key={p.dataKey} style={rowStyle}>
              <span style={{ display: "flex", alignItems: "center" }}>
                <span style={dotStyle(p.color)} />
                {prettyName(p.dataKey)}
              </span>
              <span style={{ fontWeight: 900 }}>{money(p.value)}</span>
            </div>
          ))}
        </>
      )}

      {mode === "revexp" && (
        <>
          <div style={rowStyle}>
            <span style={{ display: "flex", alignItems: "center" }}>
              <span style={dotStyle(payload.find((x) => x.dataKey === "receitaPct")?.color || "#888")} />
              Receita
            </span>
            <span style={{ fontWeight: 900 }}>
              {pctInt(fullRow?.receitaPct)} • {money(fullRow?.receitaVal)}
            </span>
          </div>

          <div style={rowStyle}>
            <span style={{ display: "flex", alignItems: "center" }}>
              <span style={dotStyle(payload.find((x) => x.dataKey === "despesaPct")?.color || "#888")} />
              Despesa
            </span>
            <span style={{ fontWeight: 900 }}>
              {pctInt(fullRow?.despesaPct)} • {money(fullRow?.despesaVal)}
            </span>
          </div>

          <div style={{ marginTop: 6, fontSize: 11, color: "rgba(255,255,255,0.70)" }}>
            Total: <b style={{ color: "rgba(255,255,255,0.92)" }}>{money(fullRow?.totalVal)}</b>
          </div>
        </>
      )}
    </div>
  );
}

/** ✅ Tooltip “fixo” (pies) — não tapa o donut */
function PieTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  return (
    <div
      style={{
        background: "rgba(0,0,0,0.78)",
        border: "1px solid rgba(255,255,255,0.14)",
        borderRadius: 12,
        padding: "8px 10px",
        boxShadow: "0 20px 60px rgba(0,0,0,0.55)",
        color: "rgba(255,255,255,0.92)",
        fontSize: 12,
        pointerEvents: "none",
        maxWidth: 220,
      }}
    >
      <div style={{ fontWeight: 900, marginBottom: 4 }}>{String(p?.name || "")}</div>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <span style={{ opacity: 0.85 }}>Valor</span>
        <span style={{ fontWeight: 900 }}>{money(p?.value)}</span>
      </div>
    </div>
  );
}

/**
 * ✅ Label estilo “risquinho + %” (fora do donut) — igual seu exemplo
 * Recharts passa: cx, cy, midAngle, outerRadius, percent...
 */
function DonutCalloutLabel({ cx, cy, midAngle, outerRadius, percent }) {
  if (!Number.isFinite(percent)) return null;

  const pct = percent * 100;
  if (pct < 4) return null; // evita sujeira em fatia muito pequena

  const RAD = Math.PI / 180;

  // ponto no contorno
  const sx = cx + outerRadius * Math.cos(-midAngle * RAD);
  const sy = cy + outerRadius * Math.sin(-midAngle * RAD);

  // risquinho pra fora
  const ex = cx + (outerRadius + 10) * Math.cos(-midAngle * RAD);
  const ey = cy + (outerRadius + 10) * Math.sin(-midAngle * RAD);

  // “cotovelo” horizontal (fica bonito)
  const isRight = Math.cos(-midAngle * RAD) >= 0;
  const hx = ex + (isRight ? 16 : -16);
  const hy = ey;

  const textAnchor = isRight ? "start" : "end";

  return (
    <g style={{ pointerEvents: "none" }}>
      <path
        d={`M${sx},${sy} L${ex},${ey} L${hx},${hy}`}
        stroke="rgba(255,255,255,0.55)"
        strokeWidth={2}
        fill="none"
      />
      <text
        x={hx + (isRight ? 6 : -6)}
        y={hy}
        textAnchor={textAnchor}
        dominantBaseline="central"
        fill="rgba(255,255,255,0.92)"
        fontSize={12}
        fontWeight={900}
      >
        {pctInt(pct)}
      </text>
    </g>
  );
}

const donutColors = ["rgba(96,165,250,0.95)", "rgba(52,211,153,0.95)"]; // Receita, Despesa
const fixVarColors = ["rgba(59,130,246,0.95)", "rgba(168,85,247,0.95)"]; // Variável, Fixo

export default function DashboardPrincipal({ token, companyId }) {
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const [competenceMonth, setCompetenceMonth] = useState(
    localStorage.getItem("competenceMonth") || new Date().toISOString().slice(0, 7)
  );

  const [selectedYear, selectedMM] = useMemo(() => {
    const [y, m] = String(competenceMonth || "").split("-");
    return [y || String(new Date().getFullYear()), m || "01"];
  }, [competenceMonth]);

  const availableYears = useMemo(() => yearsAroundNow(8), []);

  const [dreMonth, setDreMonth] = useState(null);
  const [serieYear, setSerieYear] = useState(null);
  const [serieYearLY, setSerieYearLY] = useState(null);

  function onChangeYear(y) {
    setCompetenceMonth(`${y}-${selectedMM}`);
  }

  function onPickMonth(mm) {
    setCompetenceMonth(`${selectedYear}-${mm}`);
  }

  async function load() {
    setErr("");
    if (!companyId) return;

    setLoading(true);
    try {
      const year = selectedYear;
      const prevYear = String(Number(selectedYear) - 1);

      const fromY = `${year}-01`;
      const toY = `${year}-12`;

      const fromLY = `${prevYear}-01`;
      const toLY = `${prevYear}-12`;

      const [dreRes, serieRes, serieLyRes] = await Promise.all([
        api(`/reports/dre?companyId=${companyId}&competenceMonth=${competenceMonth}`, { token }),
        api(`/reports/dre-series?companyId=${companyId}&from=${fromY}&to=${toY}`, { token }),
        api(`/reports/dre-series?companyId=${companyId}&from=${fromLY}&to=${toLY}`, { token }),
      ]);

      setDreMonth(dreRes);
      setSerieYear(serieRes);
      setSerieYearLY(serieLyRes);
    } catch (e) {
      setErr(e.message);
      setDreMonth(null);
      setSerieYear(null);
      setSerieYearLY(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    localStorage.setItem("competenceMonth", competenceMonth);
  }, [competenceMonth]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId, competenceMonth]);

  // ✅ KPIs + split fixo/variável vindo do backend (totais.despesaFixa / totais.despesaVariavel)
  const kpis = useMemo(() => {
    const t = dreMonth?.totais || {};
    const receita = Number(t.receitaLiquida || 0);

    const fixo = Number(t.despesaFixa ?? 0);
    const variavel = Number(t.despesaVariavel ?? 0);

    const despesaTotal = Math.max(0, fixo + variavel);

    const margemContrib = receita - variavel;
    const resultadoFinal = margemContrib - fixo;

    const margemPct = receita > 0 ? (margemContrib / receita) * 100 : 0;
    const resultadoPct = receita > 0 ? (resultadoFinal / receita) * 100 : 0;

    const fixoPct = despesaTotal > 0 ? (fixo / despesaTotal) * 100 : 0;
    const variavelPct = despesaTotal > 0 ? (variavel / despesaTotal) * 100 : 0;

    return {
      receita,
      fixo,
      variavel,
      despesaTotal,
      margemContrib,
      resultadoFinal,
      margemPct,
      resultadoPct,
      fixoPct,
      variavelPct,
    };
  }, [dreMonth]);

  const revenueYoY = useMemo(() => {
    const mapY = new Map((serieYear?.series || []).map((r) => [r.month, Number(r.totais?.receitaLiquida || 0)]));
    const mapLY = new Map((serieYearLY?.series || []).map((r) => [r.month, Number(r.totais?.receitaLiquida || 0)]));

    return MONTHS.map((m) => {
      const ymY = `${selectedYear}-${m.key}`;
      const ymLY = `${String(Number(selectedYear) - 1)}-${m.key}`;
      return {
        month: m.label,
        anoSelecionado: mapY.get(ymY) ?? 0,
        anoAnterior: mapLY.get(ymLY) ?? 0,
      };
    });
  }, [serieYear, serieYearLY, selectedYear]);

  const revenueVsExpensePct = useMemo(() => {
    const mapY = new Map(
      (serieYear?.series || []).map((r) => [
        r.month,
        {
          receita: Number(r.totais?.receitaLiquida || 0),
          despesa: Number(r.totais?.custos || 0) + Number(r.totais?.despesasOperacionais || 0),
        },
      ])
    );

    return MONTHS.map((m) => {
      const ym = `${selectedYear}-${m.key}`;
      const row = mapY.get(ym) || { receita: 0, despesa: 0 };

      const total = Math.max(0, row.receita + row.despesa);
      const receitaPct = total > 0 ? (row.receita / total) * 100 : 0;
      const despesaPct = total > 0 ? (row.despesa / total) * 100 : 0;

      return {
        month: m.label,
        receitaPct,
        despesaPct,
        receitaVal: row.receita,
        despesaVal: row.despesa,
        totalVal: total,
      };
    });
  }, [serieYear, selectedYear]);

  // ✅ Donut Receita x Despesa (mês) — VALORES
  const donutReceitaDespesa = useMemo(() => {
    return [
      { name: "Receita", value: Math.max(0, kpis.receita) },
      { name: "Despesa", value: Math.max(0, kpis.despesaTotal) },
    ];
  }, [kpis.receita, kpis.despesaTotal]);

  // ✅ Donut Estrutura da Despesa (mês) — VALORES
  // (Ordem igual seu exemplo: Variável primeiro, Fixo depois)
  const donutFixVar = useMemo(() => {
    return [
      { name: "Variável", value: Math.max(0, kpis.variavel) },
      { name: "Fixo", value: Math.max(0, kpis.fixo) },
    ];
  }, [kpis.variavel, kpis.fixo]);

  // ✅ legenda vertical simples (lado esquerdo)
  function OverlayLegend({ items }) {
  return (
    <div className="absolute right-3 top-3 z-10">
      <div className="space-y-2">
        {items.map((it) => (
          <div key={it.name} className="flex items-center gap-2">
            <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: it.color }} />
            <div className="text-xs text-zinc-200 font-semibold">{it.name}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

  // ✅ label dentro das barras (%)
  function LabelInside({ x, y, width, height, value }) {
    if (!value || value < 1) return null;
    if (height < 18) return null;
    return (
      <text
        x={x + width / 2}
        y={y + height / 2 + 4}
        textAnchor="middle"
        fill="rgba(255,255,255,0.92)"
        fontSize={12}
        fontWeight={900}
        style={{ pointerEvents: "none" }}
      >
        {pctInt(value)}
      </text>
    );
  }

  // ✅ “efeito” quando muda o mês (força remount do Pie) + animação
  const pieAnimKey = competenceMonth;

  return (
    <div className="w-full min-h-full space-y-4 overflow-x-hidden">
      {/* Header */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-lg font-semibold tracking-tight">DASHBOARD PRINCIPAL</div>
            <div className="text-xs text-zinc-400 mt-0.5">Selecione o ano e o mês</div>
          </div>

          <div className="flex flex-wrap items-center gap-2 justify-end">
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2">
              <div className="text-xs text-zinc-400">Ano:</div>
              <select
                value={selectedYear}
                onChange={(e) => onChangeYear(e.target.value)}
                className="bg-transparent text-sm outline-none"
              >
                {availableYears.map((y) => (
                  <option key={y} value={y} className="bg-[#0b0e16]">
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={load}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 text-sm hover:bg-white/10 transition"
              title="Atualizar"
            >
              <RefreshCcw size={16} className={loading ? "animate-spin" : ""} />
              Atualizar
            </button>
          </div>
        </div>

        {/* Meses */}
        <div className="mt-4 flex flex-wrap gap-2">
          {MONTHS.map((m) => {
            const active = m.key === selectedMM;
            return (
              <button
                key={m.key}
                onClick={() => onPickMonth(m.key)}
                className={[
                  "px-3 py-1.5 rounded-lg text-xs font-semibold uppercase border transition",
                  active
                    ? "border-white/30 bg-white/15 text-white shadow-[0_0_0_2px_rgba(99,102,241,0.25)]"
                    : "border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10",
                ].join(" ")}
              >
                {m.label}
              </button>
            );
          })}
        </div>

        {err && (
          <div className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
            {err}
          </div>
        )}
      </div>

      {/* ✅ 4 KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <KpiCard
          title="Receita"
          valueLeft={money(kpis.receita)}
          icon={"💲"}
          colorClass="from-blue-600 to-blue-500"
        />

        <KpiCard
          title="Despesa"
          valueLeft={money(kpis.despesaTotal)}
          subtitle={`Fixo: ${money(kpis.fixo)} • Variável: ${money(kpis.variavel)}`}
          icon={"⬇️"}
          colorClass="from-purple-600 to-fuchsia-500"
        />

        <KpiCard
          title="Margem de contribuição"
          valueLeft={money(kpis.margemContrib)}
          valueRight={pctInt(kpis.margemPct)}
          icon={"🧾"}
          colorClass="from-emerald-500 to-teal-400"
        />

        <KpiCard
          title="Resultado final"
          valueLeft={money(kpis.resultadoFinal)}
          valueRight={pctInt(kpis.resultadoPct)}
          icon={"📈"}
          colorClass="from-orange-500 to-amber-400"
        />
      </div>

      {/* ✅ Gráficos (INVERTIDO como você pediu):
          - em cima: Receita x Despesa (mês)
          - embaixo: Estrutura da Despesa (Fixo x Variável)
      */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
        {/* Receita YoY */}
        <div className="xl:col-span-2">
          <Panel title="Receita ao longo do tempo" subtitle="Ano anterior x Ano selecionado">
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueYoY} margin={{ top: 10, right: 12, left: 18, bottom: 0 }}>
                  <XAxis dataKey="month" tick={{ fill: "rgba(255,255,255,0.75)" }} />
                  <YAxis
                    width={78}
                    tickMargin={8}
                    tick={{ fill: "rgba(255,255,255,0.65)" }}
                    tickFormatter={(v) => `R$ ${(Number(v) / 1000).toFixed(0)}k`}
                  />
                  <Tooltip cursor={{ fill: "rgba(255,255,255,0.04)" }} content={<SmallDarkTooltip mode="yoy" />} />
                  <Legend
                    wrapperStyle={{ fontSize: 12, opacity: 0.9 }}
                    formatter={(v) => (v === "anoSelecionado" ? "Ano selecionado" : "Ano anterior")}
                  />
                  <Bar dataKey="anoAnterior" fill="rgba(99,102,241,0.55)" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="anoSelecionado" fill="rgba(59,130,246,0.85)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        {/* ✅ (EM CIMA) Receita x Despesa (mês) — estilo do seu exemplo */}
        <Panel title="Receita x Despesa (mês)" subtitle={`Competência: ${competenceMonth}`}>
  <div className="h-[260px] relative">
    {(donutReceitaDespesa[0].value + donutReceitaDespesa[1].value) > 0 ? (
      <>
        {/* ✅ legenda no topo esquerdo */}
        <OverlayLegend
          items={[
            { name: "Receita", color: donutColors[0] },
            { name: "Despesa", color: donutColors[1] },
          ]}
        />

        {/* ✅ gráfico centralizado */}
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip
              content={<PieTooltip />}
              // opcional: fixa a tooltip no topo (não cobre o centro)
              position={{ x: 12, y: 8 }}
              cursor={false}
              wrapperStyle={{ outline: "none" }}
            />

            <Pie
            key={`fixvar-${pieAnimKey}`}
  data={donutReceitaDespesa}
  dataKey="value"
  nameKey="name"
  cx="50%"
  cy="50%"
  innerRadius={62}
  outerRadius={92}
  paddingAngle={0}        // ✅ sem espaço entre fatias
  stroke="transparent"     // ✅ sem borda
  strokeWidth={0}          // ✅ sem borda
  labelLine={false}
  label={DonutCalloutLabel}
  isAnimationActive
  animationDuration={650}
  animationEasing="ease-out"
>
  <Cell fill={donutColors[0]} />
  <Cell fill={donutColors[1]} />
</Pie>
          </PieChart>
        </ResponsiveContainer>
      </>
    ) : (
      <div className="h-full flex items-center justify-center text-sm text-zinc-400">
        Sem dados no mês selecionado.
      </div>
    )}
  </div>
</Panel>

        {/* ✅ Barra 100% Receita x Despesa ao longo do tempo */}
        <div className="xl:col-span-2">
          <Panel title="Receita e Despesa ao longo do tempo" subtitle="Percentual por mês (receita x despesa)">
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={revenueVsExpensePct}
                  barCategoryGap={18}
                  barGap={0}
                  margin={{ top: 10, right: 12, left: 8, bottom: 0 }}
                >
                  <XAxis dataKey="month" tick={{ fill: "rgba(255,255,255,0.75)" }} />
                  <YAxis
                    width={52}
                    tickMargin={8}
                    tick={{ fill: "rgba(255,255,255,0.65)" }}
                    domain={[0, 100]}
                    tickFormatter={(v) => `${v}%`}
                  />

                  <Tooltip
                    cursor={{ fill: "rgba(255,255,255,0.04)" }}
                    content={<SmallDarkTooltip mode="revexp" />}
                  />

                  <Legend
                    wrapperStyle={{ fontSize: 12, opacity: 0.9 }}
                    formatter={(v) => (v === "receitaPct" ? "Receita" : "Despesa")}
                  />

                  <Bar
                    dataKey="receitaPct"
                    stackId="a"
                    name="Receita"
                    fill="rgba(59,130,246,0.88)"
                    stroke="transparent"
                    radius={[0, 0, 0, 0]}
                    barSize={42}
                    isAnimationActive={false}
                  >
                    <LabelList dataKey="receitaPct" content={LabelInside} />
                  </Bar>

                  <Bar
                    dataKey="despesaPct"
                    stackId="a"
                    name="Despesa"
                    fill="rgba(168,85,247,0.80)"
                    stroke="transparent"
                    radius={[0, 0, 0, 0]}
                    barSize={42}
                    isAnimationActive={false}
                  >
                    <LabelList dataKey="despesaPct" content={LabelInside} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        {/* ✅ (EMBAIXO) Estrutura da Despesa — mesmo padrão (donut + risquinho + %) */}
        <Panel title="Estrutura da Despesa" subtitle={`Fixo x Variável • ${competenceMonth}`}>
  <div className="h-[260px] relative">
    {(donutFixVar[0].value + donutFixVar[1].value) > 0 ? (
      <>
        {/* ✅ legenda no topo esquerdo */}
        <OverlayLegend
          items={[
            { name: "Variável", color: fixVarColors[0] },
            { name: "Fixo", color: fixVarColors[1] },
          ]}
        />

        {/* ✅ gráfico centralizado */}
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip
              content={<PieTooltip />}
              position={{ x: 12, y: 8 }}
              cursor={false}
              wrapperStyle={{ outline: "none" }}
            />

            <Pie
            key={`fixvar-${pieAnimKey}`}
  data={donutFixVar}
  dataKey="value"
  nameKey="name"
  cx="50%"
  cy="50%"
  innerRadius={62}
  outerRadius={92}
  paddingAngle={0}        // ✅ colado
  stroke="transparent"     // ✅ sem “linha preta”
  strokeWidth={0}
  labelLine={false}
  label={DonutCalloutLabel}
  isAnimationActive
  animationDuration={650}
  animationEasing="ease-out"
>
  <Cell fill={fixVarColors[0]} />
  <Cell fill={fixVarColors[1]} />
</Pie>
          </PieChart>
        </ResponsiveContainer>
      </>
    ) : (
      <div className="h-full flex flex-col items-center justify-center text-sm text-zinc-400">
        <div>Sem despesas fixas/variáveis no mês.</div>
        <div className="mt-1 text-[11px] text-zinc-500">
          (A API precisa retornar totais.despesaFixa e totais.despesaVariavel)
        </div>
      </div>
    )}
  </div>
</Panel>
      </div>
    </div>
  );
}