const prisma = require("../config/prisma");
const { buildDRE } = require("../utils/dre");

function add(groupTotals, group, value) {
  if (!groupTotals[group]) groupTotals[group] = 0;
  groupTotals[group] += Number(value);
}

async function requireMembership(userId, companyId) {
  return prisma.companyUser.findUnique({
    where: { userId_companyId: { userId, companyId } },
    select: { userId: true, companyId: true, role: true }
  });
}

function ymToInt(ym) {
  const [y, m] = String(ym || "").split("-");
  const yy = Number(y);
  const mm = Number(m);
  if (!Number.isFinite(yy) || !Number.isFinite(mm)) return null;
  return yy * 100 + mm;
}

function betweenYM(ym, from, to) {
  const v = ymToInt(ym);
  const a = ymToInt(from);
  const b = ymToInt(to);
  if (v === null || a === null || b === null) return false;
  return v >= a && v <= b;
}

function toNum(x) {
  const n = Number(x);
  return Number.isFinite(n) ? n : 0;
}

module.exports = {
  // GET /reports/dre?companyId=...&competenceMonth=YYYY-MM&costCenterId=...
  async dre(req, res) {
    try {
      let { companyId, competenceMonth, costCenterId } = req.query;

      if (!companyId || !competenceMonth) {
        return res.status(400).json({ error: "companyId e competenceMonth são obrigatórios" });
      }

      const membership = await requireMembership(req.userId, companyId);
      if (!membership) return res.status(403).json({ error: "Sem acesso a essa empresa" });

      const entries = await prisma.entry.findMany({
        where: {
          companyId,
          competenceMonth,
          ...(costCenterId ? { costCenterId } : {})
        },
        select: {
          amount: true,
          type: true, // ✅ importante
          account: { select: { group: true } },
          costCenter: { select: { type: true, expenseClass: true } } // ✅ importante
        }
      });

      const groupTotals = {};

      // ✅ novos totais: fixo/variável
      let despesaFixa = 0;
      let despesaVariavel = 0;

      for (const e of entries) {
        const group = e.account?.group || "SEM_GRUPO";
        add(groupTotals, group, e.amount);

        const val = toNum(e.amount);

        // Decide receita/despesa preferindo o tipo do centro, senão entry.type
        const ccType = e.costCenter?.type;
        const entryType = e.type;
        const isRevenue = (ccType || entryType) === "REVENUE";

        if (!isRevenue) {
          const cls = String(e.costCenter?.expenseClass || "VARIABLE").toUpperCase();
          if (cls === "FIXED") despesaFixa += val;
          else despesaVariavel += val;
        }
      }

      const dre = buildDRE(groupTotals);

      return res.json({
        companyId,
        competenceMonth,
        costCenterId: costCenterId || null,
        grupos: groupTotals,
        ...dre,
        totais: {
          ...dre.totais,
          despesaFixa,
          despesaVariavel,
          despesaTotal: despesaFixa + despesaVariavel
        }
      });
    } catch (err) {
      console.error("reports.controller dre error:", err);
      return res.status(500).json({ error: "Erro ao gerar DRE" });
    }
  },

  // GET /reports/dre-by-cost-center?companyId=...&competenceMonth=YYYY-MM
  async dreByCostCenter(req, res) {
    try {
      const { companyId, competenceMonth } = req.query;

      if (!companyId || !competenceMonth) {
        return res.status(400).json({ error: "companyId e competenceMonth são obrigatórios" });
      }

      const membership = await requireMembership(req.userId, companyId);
      if (!membership) return res.status(403).json({ error: "Sem acesso a essa empresa" });

      const entries = await prisma.entry.findMany({
        where: { companyId, competenceMonth },
        select: {
          amount: true,
          type: true,
          account: { select: { group: true } },
          costCenter: { select: { name: true, type: true, expenseClass: true } }
        }
      });

      const byCC = {}; // { "Administrativo": { groupTotals... }, ... }
      const byCCExtra = {}; // { "Administrativo": { despesaFixa, despesaVariavel }, ... }

      for (const e of entries) {
        const ccName = e.costCenter?.name || "Sem Centro";
        const group = e.account?.group || "SEM_GRUPO";

        if (!byCC[ccName]) byCC[ccName] = {};
        add(byCC[ccName], group, e.amount);

        if (!byCCExtra[ccName]) byCCExtra[ccName] = { despesaFixa: 0, despesaVariavel: 0 };

        const val = toNum(e.amount);
        const isRevenue = (e.costCenter?.type || e.type) === "REVENUE";

        if (!isRevenue) {
          const cls = String(e.costCenter?.expenseClass || "VARIABLE").toUpperCase();
          if (cls === "FIXED") byCCExtra[ccName].despesaFixa += val;
          else byCCExtra[ccName].despesaVariavel += val;
        }
      }

      const centros = {};
      for (const ccName of Object.keys(byCC)) {
        const dre = buildDRE(byCC[ccName]);
        const extra = byCCExtra[ccName] || { despesaFixa: 0, despesaVariavel: 0 };

        centros[ccName] = {
          grupos: byCC[ccName],
          ...dre,
          totais: {
            ...dre.totais,
            despesaFixa: extra.despesaFixa,
            despesaVariavel: extra.despesaVariavel,
            despesaTotal: extra.despesaFixa + extra.despesaVariavel
          }
        };
      }

      return res.json({ companyId, competenceMonth, centros });
    } catch (err) {
      console.error("reports.controller dreByCostCenter error:", err);
      return res.status(500).json({ error: "Erro ao gerar DRE por centro de custo" });
    }
  },

  // GET /reports/dre-series?companyId=...&from=YYYY-MM&to=YYYY-MM
  async dreSeries(req, res) {
    try {
      const { companyId, from, to } = req.query;

      if (!companyId || !from || !to) {
        return res.status(400).json({ error: "companyId, from e to são obrigatórios" });
      }

      const membership = await requireMembership(req.userId, companyId);
      if (!membership) return res.status(403).json({ error: "Sem acesso a essa empresa" });

      const entries = await prisma.entry.findMany({
        where: { companyId },
        select: {
          competenceMonth: true,
          amount: true,
          type: true,
          account: { select: { group: true } },
          costCenter: { select: { type: true, expenseClass: true } } // ✅ chave
        }
      });

      // map: { "YYYY-MM": { groupTotals, despesaFixa, despesaVariavel } }
      const map = {};

      for (const e of entries) {
        const month = String(e.competenceMonth || "");
        if (!betweenYM(month, from, to)) continue;

        if (!map[month]) {
          map[month] = { groupTotals: {}, despesaFixa: 0, despesaVariavel: 0 };
        }

        const group = e.account?.group || "SEM_GRUPO";
        add(map[month].groupTotals, group, e.amount);

        const val = toNum(e.amount);
        const isRevenue = (e.costCenter?.type || e.type) === "REVENUE";

        if (!isRevenue) {
          const cls = String(e.costCenter?.expenseClass || "VARIABLE").toUpperCase();
          if (cls === "FIXED") map[month].despesaFixa += val;
          else map[month].despesaVariavel += val;
        }
      }

      const series = Object.keys(map)
        .sort((a, b) => a.localeCompare(b))
        .map((month) => {
          const dre = buildDRE(map[month].groupTotals);
          return {
            month,
            grupos: map[month].groupTotals,
            ...dre,
            totais: {
              ...dre.totais,
              despesaFixa: map[month].despesaFixa,
              despesaVariavel: map[month].despesaVariavel,
              despesaTotal: map[month].despesaFixa + map[month].despesaVariavel
            }
          };
        });

      return res.json({ companyId, from, to, series });
    } catch (err) {
      console.error("reports.controller dreSeries error:", err);
      return res.status(500).json({ error: "Erro ao gerar série do DRE" });
    }
  }
};