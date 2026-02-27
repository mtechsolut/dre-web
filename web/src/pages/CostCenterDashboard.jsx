import { useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import { RefreshCcw } from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
  LineChart,
  Line,
} from "recharts";

const MONTHS = [
  { key: "01", label: "jan" }, { key: "02", label: "fev" }, { key: "03", label: "mar" },
  { key: "04", label: "abr" }, { key: "05", label: "mai" }, { key: "06", label: "jun" },
  { key: "07", label: "jul" }, { key: "08", label: "ago" }, { key: "09", label: "set" },
  { key: "10", label: "out" }, { key: "11", label: "nov" }, { key: "12", label: "dez" },
];

function yearsAroundNow(count = 7) {
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

function pct(v) {
  if (!Number.isFinite(v)) return "—";
  return `${v.toFixed(1)}%`;
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

/** KPI com gradiente (mais “estiloso”) */
function KpiCard({ title, value, subtitle, icon, gradientClass }) {
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
    </div>
  );
}

/** Tooltip pequeno escuro */
function SmallTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-white/10 bg-black/80 px-3 py-2 text-xs text-zinc-200">
      {label ? <div className="text-[11px] text-zinc-400 mb-1">{label}</div> : null}
      <div className="space-y-1">
        {payload.map((p) => (
          <div key={p.dataKey} className="flex justify-between gap-4">
            <span className="opacity-90">{p.name}</span>
            <span className="font-semibold">{money(p.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const donutColors = [
  "#60a5fa", "#34d399", "#fbbf24", "#f87171", "#a78bfa",
  "#22d3ee", "#fb7185", "#c084fc", "#f59e0b", "#10b981"
];

/**
 * Gauge simples (1 anel)
 * - percent pode ser <0 ou >100 (label mostra real)
 * - ring fill fica entre 0..100 para não “estourar”
 */
function RingGauge({ title, percent, valueLabel, color, subtitle }) {
  const raw = Number(percent || 0);
  const fillPct = Math.max(0, Math.min(100, raw)); // só para desenhar o anel

  const data = [
    { name: "ok", value: fillPct },
    { name: "rest", value: 100 - fillPct },
  ];

  return (
    <div className="rounded-xl border border-white/10 bg-black/10 p-3">
      <div className="text-xs text-zinc-400">{title}</div>

      <div className="mt-2 flex items-center gap-3">
        <div className="h-[92px] w-[92px] shrink-0 overflow-visible">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
              <Pie
                data={data}
                dataKey="value"
                startAngle={90}
                endAngle={-270}
                innerRadius={28}
                outerRadius={40}
                stroke="rgba(255,255,255,0.10)"
                strokeWidth={1}
              >
                <Cell fill={color} />
                <Cell fill="rgba(255,255,255,0.08)" />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="min-w-0">
          <div className="text-lg font-semibold leading-tight">{pctInt(raw)}</div>
          <div className="text-[11px] text-zinc-300 leading-tight break-words">
            {valueLabel}
          </div>
          {subtitle ? <div className="mt-1 text-[11px] text-zinc-500">{subtitle}</div> : null}
        </div>
      </div>
    </div>
  );
}

export default function CostCenterDashboard({ token, companyId }) {
  const [competenceMonth, setCompetenceMonth] = useState(
    localStorage.getItem("competenceMonth") || new Date().toISOString().slice(0, 7)
  );

  const [entries, setEntries] = useState([]);
  const [costCenters, setCostCenters] = useState([]);

  // ✅ série do ANO (pra gráfico de linhas)
  const [yearEntries, setYearEntries] = useState({}); // { "YYYY-MM": entries[] }

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const [selectedYear, selectedMM] = useMemo(() => {
    const [y, m] = String(competenceMonth || "").split("-");
    return [y || String(new Date().getFullYear()), m || "01"];
  }, [competenceMonth]);

  const availableYears = useMemo(() => yearsAroundNow(8), []);

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
      const monthsOfYear = MONTHS.map((m) => `${selectedYear}-${m.key}`);

      const [ccRes, enRes, ...yearRes] = await Promise.all([
        api(`/cost-centers?companyId=${companyId}`, { token }),
        api(`/entries?companyId=${companyId}&competenceMonth=${competenceMonth}`, { token }),
        ...monthsOfYear.map((ym) =>
          api(`/entries?companyId=${companyId}&competenceMonth=${ym}`, { token })
        ),
      ]);

      setCostCenters(ccRes.costCenters || []);

      const list = Array.isArray(enRes) ? enRes : (enRes.entries || []);
      setEntries(list);

      const byMonth = {};
      monthsOfYear.forEach((ym, idx) => {
        const r = yearRes[idx];
        byMonth[ym] = Array.isArray(r) ? r : (r.entries || []);
      });
      setYearEntries(byMonth);
    } catch (e) {
      setErr(e.message);
      setCostCenters([]);
      setEntries([]);
      setYearEntries({});
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

  /**
   * ✅ Totais do MÊS + por centro
   */
  const { totals, rows, donutData } = useMemo(() => {
    const ccMap = new Map((costCenters || []).map((c) => [c.id, c]));

    const byCC = new Map();
    let totalRevenue = 0;
    let totalExpense = 0;

    for (const e of entries || []) {
      const ccId = e.costCenterId || e.costCenter?.id;
      if (!ccId) continue;

      const cc = ccMap.get(ccId);
      const name = cc?.name || e.costCenter?.name || "Sem Centro";
      const type = cc?.type || e.type || "EXPENSE";

      const val = Number(e.amount || 0);
      if (!Number.isFinite(val)) continue;

      const isRevenue = (cc?.type || e.type) === "REVENUE";
      if (isRevenue) totalRevenue += val;
      else totalExpense += val;

      if (!byCC.has(ccId)) byCC.set(ccId, { id: ccId, name, type: cc?.type || type, value: 0 });
      byCC.get(ccId).value += val;
    }

    const list = Array.from(byCC.values()).sort((a, b) => Math.abs(b.value) - Math.abs(a.value));

    const base = Math.max(1, totalRevenue);
    const withPct = list.map((r) => ({
      ...r,
      percent: (Math.abs(r.value) / base) * 100
    }));

    const margem = totalRevenue - totalExpense;
    const margemPct = (margem / base) * 100;

    // donut TOP 8 + Outros
    const top = [...withPct].slice(0, 8);
    const otherSum = withPct.slice(8).reduce((acc, x) => acc + Math.abs(x.value), 0);

    const donut = top.map((x) => ({ name: x.name, value: Math.abs(x.value) }));
    if (otherSum > 0) donut.push({ name: "Outros", value: otherSum });

    return {
      totals: { totalRevenue, totalExpense, margem, margemPct },
      rows: withPct,
      donutData: donut,
    };
  }, [entries, costCenters]);

  /**
   * ✅ Resumo em barras (APENAS 3 itens): Receita, Despesa, Resultado
   */
  const summary3 = useMemo(() => {
    return [
      { name: "Receita", value: Number(totals.totalRevenue || 0), key: "receita" },
      { name: "Despesa", value: Number(totals.totalExpense || 0), key: "despesa" },
      { name: "Resultado", value: Number(totals.margem || 0), key: "resultado" },
    ];
  }, [totals.totalRevenue, totals.totalExpense, totals.margem]);

  /**
   * ✅ Série do ANO (para gráfico de linhas): Receita, Despesa Fixa, Despesa Variável
   */
  const lineYearData = useMemo(() => {
    const ccMap = new Map((costCenters || []).map((c) => [c.id, c]));

    return MONTHS.map((m) => {
      const ym = `${selectedYear}-${m.key}`;
      const list = yearEntries?.[ym] || [];

      let receita = 0;
      let fixa = 0;
      let variavel = 0;

      for (const e of list) {
        const ccId = e.costCenterId || e.costCenter?.id;
        const cc = ccId ? ccMap.get(ccId) : null;

        const type = cc?.type || e.type || "EXPENSE";
        const val = Number(e.amount || 0);
        if (!Number.isFinite(val)) continue;

        if (type === "REVENUE") {
          receita += val;
        } else {
          const cls = String(cc?.expenseClass || "VARIABLE").toUpperCase();
          if (cls === "FIXED") fixa += val;
          else variavel += val;
        }
      }

      return {
        month: m.label.toUpperCase(),
        receita,
        fixa,
        variavel,
      };
    });
  }, [yearEntries, costCenters, selectedYear]);

  /**
   * ✅ OPÇÃO 3 (bases corretas)
   * Rentabilidade (base Receita):
   *  - Margem % = Resultado / Receita
   *  - Despesa % = (Fixa+Variável) / Receita
   *
   * Estrutura de custos (base Despesa Total):
   *  - Fixa % = Fixa / (Fixa+Variável)
   *  - Variável % = Variável / (Fixa+Variável)
   */
  const indicators = useMemo(() => {
    const receitaAno = lineYearData.reduce((acc, x) => acc + Number(x.receita || 0), 0);
    const fixaAno = lineYearData.reduce((acc, x) => acc + Number(x.fixa || 0), 0);
    const variavelAno = lineYearData.reduce((acc, x) => acc + Number(x.variavel || 0), 0);

    const despesaAno = fixaAno + variavelAno;
    const resultadoAno = receitaAno - despesaAno;

    const baseReceita = Math.max(1, receitaAno);     // evita divisão por 0
    const baseDespesa = Math.max(1, despesaAno);     // evita divisão por 0

    const margemPct = (resultadoAno / baseReceita) * 100;
    const despesaPct = (despesaAno / baseReceita) * 100;

    const fixaPct = (fixaAno / baseDespesa) * 100;
    const variavelPct = (variavelAno / baseDespesa) * 100;

    return {
      receitaAno,
      fixaAno,
      variavelAno,
      despesaAno,
      resultadoAno,
      margemPct,
      despesaPct,
      fixaPct,
      variavelPct,
    };
  }, [lineYearData]);

  return (
    <div className="w-full overflow-x-hidden space-y-4">
      {/* Header */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-lg font-semibold tracking-tight">CENTRO DE CUSTO • ANÁLISE</div>
            <div className="text-xs text-zinc-400 mt-0.5">
              Selecione ano e mês • gráficos por centro + margem/resultado
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 justify-end">
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2">
              <div className="text-xs text-zinc-400">Ano</div>
              <select
                value={selectedYear}
                onChange={(e) => onChangeYear(e.target.value)}
                className="bg-transparent text-sm outline-none"
              >
                {availableYears.map((y) => (
                  <option key={y} value={y} className="bg-[#0b0e16]">{y}</option>
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
                    ? "border-indigo-400/60 bg-indigo-500/25 ring-2 ring-indigo-400/40 text-white shadow-[0_0_0_1px_rgba(99,102,241,0.35)]"
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

      {/* ✅ KPIs ESTILOSOS (não mexi) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <KpiCard
          title="Receita líquida"
          value={money(totals.totalRevenue)}
          subtitle={`Competência ${competenceMonth}`}
          icon={"💲"}
          gradientClass="from-blue-600 to-blue-500"
        />
        <KpiCard
          title="Despesa"
          value={money(totals.totalExpense)}
          subtitle="Custos + operacionais"
          icon={"⬇️"}
          gradientClass="from-purple-600 to-fuchsia-500"
        />
        <KpiCard
          title="Resultado"
          value={money(totals.margem)}
          subtitle="Receita - Despesa"
          icon={"📈"}
          gradientClass="from-emerald-500 to-teal-400"
        />
        <KpiCard
          title="Margem %"
          value={pct(totals.margemPct)}
          subtitle="Base: Receita"
          icon={"🧮"}
          gradientClass="from-orange-500 to-amber-400"
        />
      </div>

      {/* ✅ 1ª LINHA: gráfico de linhas + indicadores (bloco inteiro) */}
      <div className="grid grid-cols-1 gap-3">
        <Panel
          title="Receita x Despesa fixa x Despesa variável"
          subtitle={`Ano ${selectedYear} • tendência mensal (linhas)`}
        >
          <div className="h-[240px] rounded-xl border border-white/10 bg-black/10 p-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineYearData} margin={{ top: 10, right: 18, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.18} vertical={false} />
                <XAxis dataKey="month" tick={{ fill: "rgba(255,255,255,0.75)", fontSize: 12 }} />
                <YAxis tick={{ fill: "rgba(255,255,255,0.70)", fontSize: 12 }} />
                <Tooltip content={<SmallTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12, opacity: 0.9 }} />

                <Line
                  type="monotone"
                  dataKey="receita"
                  name="Receita"
                  stroke="rgba(59,130,246,0.95)"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="fixa"
                  name="Despesa fixa"
                  stroke="rgba(34,211,153,0.95)"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="variavel"
                  name="Despesa variável"
                  stroke="rgba(244,114,182,0.95)"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* ✅ OPÇÃO 3: 2 indicadores de rentabilidade + 2 de estrutura */}
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            <RingGauge
              title="Margem (Resultado / Receita)"
              percent={indicators.margemPct}
              valueLabel={money(indicators.resultadoAno)}
              subtitle={`Base: Receita do ano (${money(indicators.receitaAno)})`}
              color="rgba(52,211,153,0.90)"
            />

            <RingGauge
              title="Despesa (Despesa / Receita)"
              percent={indicators.despesaPct}
              valueLabel={money(indicators.despesaAno)}
              subtitle={`Base: Receita do ano (${money(indicators.receitaAno)})`}
              color="rgba(168,85,247,0.88)"
            />

            <RingGauge
              title="Despesa fixa (Fixa / Despesa)"
              percent={indicators.fixaPct}
              valueLabel={money(indicators.fixaAno)}
              subtitle={`Base: Despesa do ano (${money(indicators.despesaAno)})`}
              color="rgba(34,211,153,0.90)"
            />

            <RingGauge
              title="Despesa variável (Var / Despesa)"
              percent={indicators.variavelPct}
              valueLabel={money(indicators.variavelAno)}
              subtitle={`Base: Despesa do ano (${money(indicators.despesaAno)})`}
              color="rgba(244,114,182,0.90)"
            />
          </div>

          <div className="mt-2 text-[11px] text-zinc-500">
            Opção 3: margem e despesa usam base Receita; fixo/variável usam base Despesa total.
            (Se despesa &gt; receita, “Despesa/Receita” pode passar de 100%.)
          </div>
        </Panel>
      </div>

      {/* ✅ 2ª LINHA: Centro do mês + Barras + Donut (lado a lado) */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
        {/* Centro por mês (tabela) */}
        <div className="xl:col-span-1">
          <Panel
            title="Centros do mês (valor + %)"
            subtitle="Percentual baseado na Receita total do mês"
          >
            <div className="rounded-xl border border-white/10 overflow-hidden">
              <div className="max-h-[360px] overflow-y-auto overflow-x-hidden">
                <table className="w-full text-sm">
                  <thead className="text-zinc-400 bg-black/30 sticky top-0 z-10">
                    <tr>
                      <th className="text-left py-2 px-3">Centro</th>
                      <th className="text-left py-2 px-3 w-[110px]">Tipo</th>
                      <th className="text-right py-2 px-3 w-[150px]">Valor</th>
                      <th className="text-right py-2 px-3 w-[80px]">%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.id} className="border-t border-white/10">
                        <td className="py-2 px-3">{r.name}</td>
                        <td className="py-2 px-3">{r.type === "REVENUE" ? "Receita" : "Despesa"}</td>
                        <td className="py-2 px-3 text-right font-semibold">{money(r.value)}</td>
                        <td className="py-2 px-3 text-right">{pct(r.percent)}</td>
                      </tr>
                    ))}
                    {rows.length === 0 && (
                      <tr>
                        <td className="py-4 px-3 text-zinc-400" colSpan={4}>
                          Sem dados no período.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-3 text-xs text-zinc-500">
              Receita - Despesa = <b>Resultado</b> (R$ e %)
            </div>
          </Panel>
        </div>

        {/* Resumo em barras */}
        <div className="xl:col-span-1">
          <Panel
            title="Resumo do mês"
            subtitle="Somente: Receita, Despesa e Resultado"
          >
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={summary3} margin={{ top: 10, right: 12, left: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.22} vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: "rgba(255,255,255,0.75)" }} />
                  <YAxis tick={{ fill: "rgba(255,255,255,0.70)" }} />
                  <Tooltip content={<SmallTooltip />} />
                  <Bar dataKey="value" name="Valor" radius={[10, 10, 0, 0]}>
                    {summary3.map((d, i) => {
                      const fill =
                        d.key === "receita"
                          ? "rgba(59,130,246,0.88)"
                          : d.key === "despesa"
                            ? "rgba(168,85,247,0.82)"
                            : "rgba(52,211,153,0.90)";
                      return <Cell key={i} fill={fill} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        {/* Donut por centro */}
        <div className="xl:col-span-1">
          <Panel
            title="Participação por Centro"
            subtitle="Top 8 + outros (valor absoluto)"
          >
            <div className="h-[260px]">
              {donutData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip formatter={(v) => money(v)} />
                    <Legend verticalAlign="bottom" height={34} wrapperStyle={{ fontSize: 12, opacity: 0.9 }} />
                    <Pie
                      data={donutData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="44%"
                      innerRadius={58}
                      outerRadius={92}
                      paddingAngle={2}
                      stroke="rgba(255,255,255,0.25)"
                      strokeWidth={1}
                    >
                      {donutData.map((_, idx) => (
                        <Cell key={idx} fill={donutColors[idx % donutColors.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-sm text-zinc-400">
                  Sem dados no mês.
                </div>
              )}
            </div>
          </Panel>
        </div>
      </div>

      {/* Resultado final */}
      <Panel title="Resultado final" subtitle="Resumo do mês selecionado">
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-zinc-400">Receitas</span>
            <span className="font-semibold">{money(totals.totalRevenue)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-zinc-400">Despesas</span>
            <span className="font-semibold">{money(totals.totalExpense)}</span>
          </div>
          <div className="h-px bg-white/10 my-2" />
          <div className="flex items-center justify-between">
            <span className="text-zinc-300">Resultado</span>
            <span className="font-semibold">{money(totals.margem)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-zinc-300">Margem %</span>
            <span className="font-semibold">{pct(totals.margemPct)}</span>
          </div>
        </div>
      </Panel>
    </div>
  );
}