import { useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import TrendLineChart from "../components/TrendLineChart";
import { RefreshCcw } from "lucide-react";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";

function addMonths(ym, delta) {
  const [y, m] = ym.split("-").map(Number);
  let yy = y;
  let mm = m + delta;
  while (mm <= 0) {
    mm += 12;
    yy--;
  }
  while (mm >= 13) {
    mm -= 12;
    yy++;
  }
  return `${yy}-${String(mm).padStart(2, "0")}`;
}

function rangeMonths(fromYm, toYm) {
  const out = [];
  let cur = fromYm;
  out.push(cur);
  while (cur !== toYm) {
    cur = addMonths(cur, 1);
    out.push(cur);
    if (out.length > 36) break;
  }
  return out;
}

function money(v) {
  if (v === null || v === undefined) return "—";
  const n = Number(v);
  if (!Number.isFinite(n)) return "—";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);
}

function pctInt(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return "0%";
  return `${Math.round(n)}%`;
}

const MONTHS = [
  { key: "01", label: "jan" },
  { key: "02", label: "fev" },
  { key: "03", label: "mar" },
  { key: "04", label: "abr" },
  { key: "05", label: "mai" },
  { key: "06", label: "jun" },
  { key: "07", label: "jul" },
  { key: "08", label: "ago" },
  { key: "09", label: "set" },
  { key: "10", label: "out" },
  { key: "11", label: "nov" },
  { key: "12", label: "dez" },
];

function yearsAroundNow(count = 7) {
  const y = new Date().getFullYear();
  const list = [];
  for (let i = 0; i < count; i++) list.push(String(y - i));
  return list;
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

// ✅ legenda overlay (canto superior direito), como no outro dashboard
function OverlayLegendTopRight({ items }) {
  return (
    <div className="absolute right-3 top-3 z-10 flex flex-col gap-2 text-xs select-none">
      {items.map((it) => (
        <div key={it.name} className="flex items-center gap-2 text-zinc-200/90">
          <span
            className="inline-block h-3 w-3 rounded-sm"
            style={{ background: it.color, boxShadow: "0 0 0 2px rgba(255,255,255,0.08)" }}
          />
          <span className="font-semibold">{it.name}</span>
        </div>
      ))}
    </div>
  );
}

// ✅ % com “tracinho” (leader line) do jeito que você pediu
function renderDonutPercentLabel(props) {
  const { cx, cy, midAngle, outerRadius, percent } = props;

  // esconde label muito pequena (evita poluir)
  if (!percent || percent < 0.02) return null;

  const RAD = Math.PI / 180;

  // ponto inicial do tracinho (na borda do donut)
  const r0 = outerRadius + 2;
  // ponto intermediário (para fora)
  const r1 = outerRadius + 14;

  const x0 = cx + r0 * Math.cos(-midAngle * RAD);
  const y0 = cy + r0 * Math.sin(-midAngle * RAD);

  const x1 = cx + r1 * Math.cos(-midAngle * RAD);
  const y1 = cy + r1 * Math.sin(-midAngle * RAD);

  const isRight = x1 >= cx;
  const x2 = x1 + (isRight ? 16 : -16); // “cotovelo”
  const y2 = y1;

  const label = `${Math.round(percent * 100)}%`;
  const textAnchor = isRight ? "start" : "end";

  return (
    <g>
      {/* tracinho (2 segmentos) */}
      <path
        d={`M ${x0} ${y0} L ${x1} ${y1} L ${x2} ${y2}`}
        stroke="rgba(255,255,255,0.65)"
        strokeWidth={1.5}
        fill="none"
      />
      {/* % */}
      <text
        x={x2 + (isRight ? 6 : -6)}
        y={y2 + 4}
        textAnchor={textAnchor}
        fill="rgba(255,255,255,0.90)"
        fontSize={12}
        fontWeight={800}
      >
        {label}
      </text>
    </g>
  );
}

// ✅ Card “bloco com mini-gráfico”
function SparkBlock({ title, value, icon, gradientClass, data, dataKey, subtitle }) {
  const gid = useMemo(
    () => `g_${title.replace(/\s+/g, "_")}_${Math.random().toString(16).slice(2)}`,
    [title]
  );

  return (
    <div className={["rounded-xl p-4 text-white shadow-lg bg-gradient-to-r", gradientClass].join(" ")}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm opacity-90 font-medium">{title}</div>
          <div className="mt-2 text-xl font-semibold truncate">{value}</div>
          {subtitle ? <div className="mt-1 text-[11px] opacity-85">{subtitle}</div> : null}
        </div>
        <div className="opacity-90 text-lg">{icon}</div>
      </div>

      <div className="mt-3 h-[64px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 6, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(255,255,255,0.55)" />
                <stop offset="100%" stopColor="rgba(255,255,255,0.05)" />
              </linearGradient>
            </defs>

            <XAxis dataKey="label" hide />
            <YAxis hide domain={["dataMin", "dataMax"]} />

            {/* tooltip escuro (sem branco) */}
            <Tooltip
              cursor={false}
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                return (
                  <div className="rounded-lg border border-white/15 bg-black/75 px-3 py-2 text-xs shadow-[0_18px_50px_rgba(0,0,0,0.55)]">
                    <div className="text-[11px] opacity-80 mb-1">{label}</div>
                    <div className="flex justify-between gap-6">
                      <span className="opacity-90">{title}</span>
                      <span className="font-semibold">{money(payload[0].value)}</span>
                    </div>
                  </div>
                );
              }}
            />

            <Area
              type="monotone"
              dataKey={dataKey}
              stroke="rgba(255,255,255,0.95)"
              strokeWidth={2}
              fill={`url(#${gid})`}
              dot={false}
              isAnimationActive
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default function Dashboard({ token, companyId }) {
  const [seriesYear, setSeriesYear] = useState(null);

  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  // ✅ chave de animação pro donut (FORÇA remount quando muda ano)
  const [pieAnimKey, setPieAnimKey] = useState(0);

  const [competenceMonth, setCompetenceMonth] = useState(
    localStorage.getItem("competenceMonth") || new Date().toISOString().slice(0, 7)
  );

  const [selectedYear, selectedMM] = useMemo(() => {
    const [y, m] = String(competenceMonth || "").split("-");
    return [y || String(new Date().getFullYear()), m || "01"];
  }, [competenceMonth]);

  const availableYears = useMemo(() => yearsAroundNow(8), []);

  const nowYM = useMemo(() => new Date().toISOString().slice(0, 7), []);
  const nowYear = useMemo(() => nowYM.slice(0, 4), [nowYM]);
  const nowMM = useMemo(() => nowYM.slice(5, 7), [nowYM]);

  async function load() {
    setErr("");
    if (!companyId) return;

    setLoading(true);
    try {
      const yearFrom = `${selectedYear}-01`;
      const yearTo = `${selectedYear}-12`;

      const serieRes = await api(
        `/reports/dre-series?companyId=${companyId}&from=${yearFrom}&to=${yearTo}`,
        { token }
      );

      setSeriesYear(serieRes);
    } catch (e) {
      setErr(e.message);
      setSeriesYear(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    localStorage.setItem("competenceMonth", competenceMonth);
  }, [competenceMonth]);

  // ✅ recarrega quando muda empresa OU ano selecionado
  // ✅ e força a animação do donut (key muda)
  useEffect(() => {
    load();
    setPieAnimKey((k) => k + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId, selectedYear]);

  function onChangeYear(y) {
    setCompetenceMonth(`${y}-${selectedMM}`);
  }

  const yearRange = useMemo(() => {
    const yearFrom = `${selectedYear}-01`;
    const yearTo = `${selectedYear}-12`;
    return { yearFrom, yearTo, months: rangeMonths(yearFrom, yearTo) };
  }, [selectedYear]);

  // ✅ Trend do ANO: Receita x Despesa (12 pontos: Jan..Dez)
  const trendDataYear = useMemo(() => {
    const map = new Map(
      (seriesYear?.series || []).map((row) => [
        row.month,
        {
          receita: Number(row.totais?.receitaLiquida || 0),
          // 🔸 total de despesa (variável + fixa)
          despesa: Number(row.totais?.custos || 0) + Number(row.totais?.despesasOperacionais || 0),
          // 🔸 variável (custos) para margem de contribuição
          variavel: Number(row.totais?.custos || 0),
        },
      ])
    );

    return yearRange.months.map((m) => {
      const item = map.get(m) || { receita: 0, despesa: 0, variavel: 0 };
      return { month: m, receita: item.receita, despesa: item.despesa, variavel: item.variavel };
    });
  }, [seriesYear, yearRange.months]);

  // ✅ Dados pros blocos: soma do ano + mini chart (Jan..Dez)
  // Agora com: Margem de contribuição = Receita - Variável (custos)
  const blocks = useMemo(() => {
    const mmLabel = (ym) => {
      const mm = String(ym).slice(5, 7) || "01";
      return (MONTHS.find((x) => x.key === mm)?.label || mm).toUpperCase();
    };

    const rows = trendDataYear.map((r) => {
      const receita = Number(r.receita || 0);
      const despesa = Number(r.despesa || 0);
      const variavel = Number(r.variavel || 0);
      const margemContrib = receita - variavel;
      const lucro = receita - despesa;

      return {
        label: mmLabel(r.month),
        receita,
        despesa,
        margemContrib,
        lucro,
      };
    });

    const sum = (key) => rows.reduce((acc, r) => acc + Number(r[key] || 0), 0);

    return {
      rows,
      sumReceita: sum("receita"),
      sumDespesa: sum("despesa"),
      sumMargemContrib: sum("margemContrib"),
      sumLucro: sum("lucro"),
      label: `${selectedYear} (jan → dez)`,
    };
  }, [trendDataYear, selectedYear]);

  // ✅ Donut: Receita x Despesa do ANO
  const donutData = useMemo(() => {
    return [
      { name: "RECEITA", value: Math.max(0, blocks.sumReceita) },
      { name: "DESPESA", value: Math.max(0, blocks.sumDespesa) },
    ];
  }, [blocks.sumReceita, blocks.sumDespesa]);

  const donutColors = ["#60a5fa", "#34d399"];

  return (
    <div className="w-full min-h-full space-y-4 overflow-x-hidden">
      {/* Header */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-lg font-semibold tracking-tight">VISÃO GERAL</div>
            <div className="text-xs text-zinc-400 mt-0.5">DRE • Dados do ano selecionado</div>
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

        {/* Meses: só visual */}
        <div className="mt-4 flex flex-wrap gap-2">
          {MONTHS.map((m) => {
            const active = selectedYear === nowYear && m.key === nowMM;
            return (
              <div
                key={m.key}
                className={[
                  "px-3 py-1.5 rounded-lg text-xs font-semibold uppercase border select-none",
                  active
                    ? "border-white/30 bg-white/15 text-white shadow-[0_0_0_2px_rgba(99,102,241,0.25)]"
                    : "border-white/10 bg-white/[0.03] text-zinc-500 opacity-60",
                ].join(" ")}
                title={active ? "Mês atual" : ""}
              >
                {m.label}
              </div>
            );
          })}
        </div>

        {err && (
          <div className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
            {err}
          </div>
        )}
      </div>

      {/* ✅ 4 blocos (ANO selecionado): Receita, Despesa, Margem Contribuição, Lucro */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <SparkBlock
          title={`Receita (${selectedYear})`}
          value={money(blocks.sumReceita)}
          subtitle={blocks.label}
          icon={"💲"}
          gradientClass="from-blue-600 to-blue-500"
          data={blocks.rows}
          dataKey="receita"
        />

        <SparkBlock
          title={`Despesa (${selectedYear})`}
          value={money(blocks.sumDespesa)}
          subtitle={blocks.label}
          icon={"🧾"}
          gradientClass="from-purple-600 to-fuchsia-500"
          data={blocks.rows}
          dataKey="despesa"
        />

        <SparkBlock
          title={`Margem de contribuição (${selectedYear})`}
          value={money(blocks.sumMargemContrib)}
          subtitle={blocks.label}
          icon={"🧮"}
          gradientClass="from-emerald-500 to-teal-400"
          data={blocks.rows}
          dataKey="margemContrib"
        />

        <SparkBlock
          title={`Lucro (${selectedYear})`}
          value={money(blocks.sumLucro)}
          subtitle={blocks.label}
          icon={"📈"}
          gradientClass="from-orange-500 to-amber-400"
          data={blocks.rows}
          dataKey="lucro"
        />
      </div>

      {/* Linha + Donut */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
        {/* Linha */}
        <div className="xl:col-span-2">
          <Panel title="Receita e Despesa ao longo do ano" subtitle={`${selectedYear} • jan → dez • Receita x Despesa`}>
            <div className="h-[260px]">
              <TrendLineChart data={trendDataYear} />
            </div>
          </Panel>
        </div>

        {/* ✅ Donut (estilo colado) + Tooltip preto + % com tracinho + animação por key */}
        <Panel title="Receita x Despesa (ano)" subtitle={`Participação no total • ${selectedYear}`}>
          <div className="relative h-[260px]">
            <OverlayLegendTopRight
              items={[
                { name: "Receita", color: donutColors[0] },
                { name: "Despesa", color: donutColors[1] },
              ]}
            />

            {(donutData[0].value + donutData[1].value) > 0 ? (
              <div className="h-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart key={`donut-year-${pieAnimKey}`}>
                    <Tooltip
                      cursor={false}
                      position={{ x: 12, y: 8 }}
                      wrapperStyle={{ outline: "none", zIndex: 50 }}
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;

                        const total = donutData.reduce((acc, x) => acc + Number(x.value || 0), 0);
                        const name = payload[0]?.name || "";
                        const value = Number(payload[0]?.value || 0);
                        const percent = total > 0 ? (value / total) * 100 : 0;

                        return (
                          <div className="rounded-xl border border-white/15 bg-black/80 px-3 py-2 text-xs shadow-[0_18px_50px_rgba(0,0,0,0.55)]">
                            <div className="opacity-80 text-[11px] mb-1">Detalhe</div>
                            <div className="flex items-center justify-between gap-8">
                              <span className="font-semibold text-zinc-100">{String(name).toUpperCase()}</span>
                              <span className="font-bold text-white">
                                {pctInt(percent)} • {money(value)}
                              </span>
                            </div>
                          </div>
                        );
                      }}
                    />

                    <Pie
                      data={donutData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="55%"
                      innerRadius={62}
                      outerRadius={96}
                      paddingAngle={0}
                      stroke="transparent"
                      strokeWidth={0}
                      isAnimationActive
                      animationDuration={650}
                      labelLine={false}
                      label={renderDonutPercentLabel}
                    >
                      <Cell fill={donutColors[0]} stroke="transparent" strokeWidth={0} />
                      <Cell fill={donutColors[1]} stroke="transparent" strokeWidth={0} />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-zinc-400">
                Sem dados no ano selecionado.
              </div>
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}