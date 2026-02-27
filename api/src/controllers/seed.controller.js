const prisma = require("../config/prisma");

async function requireMembership(userId, companyId) {
  return prisma.companyUser.findUnique({
    where: { userId_companyId: { userId, companyId } },
    select: { role: true }
  });
}

function uniqByName(items) {
  const seen = new Set();
  const out = [];
  for (const it of items) {
    const key = `${it.companyId}::${it.name}`.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(it);
  }
  return out;
}

module.exports = {
  // POST /seed/defaults { companyId }
  async defaults(req, res) {
    try {
      const { companyId } = req.body;
      if (!companyId) return res.status(400).json({ error: "companyId é obrigatório" });

      const membership = await requireMembership(req.userId, companyId);
      if (!membership) return res.status(403).json({ error: "Sem acesso a essa empresa" });

      // ✅ Modelo Varejo (você pode editar depois)
      const accounts = [
        // RECEITAS (Excel: dinheiro/pix/cartão/vale)
        { companyId, name: "Vendas em Dinheiro", type: "REVENUE", group: "RECEITA_BRUTA", order: 1 },
        { companyId, name: "Vendas em Pix", type: "REVENUE", group: "RECEITA_BRUTA", order: 2 },
        { companyId, name: "Vendas em Cartão", type: "REVENUE", group: "RECEITA_BRUTA", order: 3 },
        { companyId, name: "Vendas em Vale", type: "REVENUE", group: "RECEITA_BRUTA", order: 4 },
        { companyId, name: "Recebimento de Vale (Dinheiro)", type: "REVENUE", group: "RECEITA_BRUTA", order: 5 },
        { companyId, name: "Recebimento de Vale (Pix)", type: "REVENUE", group: "RECEITA_BRUTA", order: 6 },
        { companyId, name: "Recebimento de Vale (Cartão)", type: "REVENUE", group: "RECEITA_BRUTA", order: 7 },

        // CUSTOS VARIÁVEIS (fornecedores)
        { companyId, name: "Fornecedor à Vista", type: "EXPENSE", group: "CUSTOS", order: 20 },
        { companyId, name: "Fornecedor a Prazo", type: "EXPENSE", group: "CUSTOS", order: 21 },

        // IMPOSTOS (DAS, INSS, etc.)
        { companyId, name: "Pagamento de DAS (Simples Nacional)", type: "EXPENSE", group: "IMPOSTOS", order: 30 },
        { companyId, name: "INSS", type: "EXPENSE", group: "IMPOSTOS", order: 31 },

        // CUSTOS FIXOS (despesas operacionais)
        { companyId, name: "Água", type: "EXPENSE", group: "DESPESAS_OPERACIONAIS", order: 40 },
        { companyId, name: "Energia", type: "EXPENSE", group: "DESPESAS_OPERACIONAIS", order: 41 },
        { companyId, name: "Internet", type: "EXPENSE", group: "DESPESAS_OPERACIONAIS", order: 42 },
        { companyId, name: "Aluguel", type: "EXPENSE", group: "DESPESAS_OPERACIONAIS", order: 43 },
        { companyId, name: "Sistema", type: "EXPENSE", group: "DESPESAS_OPERACIONAIS", order: 44 },
        { companyId, name: "Contador", type: "EXPENSE", group: "DESPESAS_OPERACIONAIS", order: 45 },

        // PESSOAL (folha, extra, pro labore)
        { companyId, name: "Folha de Pagamento", type: "EXPENSE", group: "PESSOAL", order: 60 },
        { companyId, name: "Hora Extra", type: "EXPENSE", group: "PESSOAL", order: 61 },
        { companyId, name: "Pró-labore", type: "EXPENSE", group: "PESSOAL", order: 62 },
      ];

      const paymentMethods = [
        { companyId, name: "Dinheiro" },
        { companyId, name: "Pix" },
        { companyId, name: "Cartão" },
        { companyId, name: "Vale" },
        { companyId, name: "Boleto" },
        { companyId, name: "Transferência" },
      ];

      const costCenters = [
        { companyId, name: "Administrativo" },
        { companyId, name: "Comercial" },
        { companyId, name: "Operação" },
      ];

      // cria só o que não existe (idempotente)
      // Accounts (sem @@unique, então fazemos checagem por name)
      const existingAcc = await prisma.account.findMany({
        where: { companyId },
        select: { name: true }
      });
      const accNames = new Set(existingAcc.map(a => a.name.toLowerCase()));
      const accToCreate = uniqByName(accounts).filter(a => !accNames.has(a.name.toLowerCase()));

      if (accToCreate.length) {
        await prisma.account.createMany({ data: accToCreate });
      }

      // PaymentMethods tem @@unique([companyId,name]) então createMany com skipDuplicates funciona
      await prisma.paymentMethod.createMany({
        data: paymentMethods,
        skipDuplicates: true
      });

      // CostCenters (sem unique) checa por nome
      const existingCC = await prisma.costCenter.findMany({
        where: { companyId },
        select: { name: true }
      });
      const ccNames = new Set(existingCC.map(c => c.name.toLowerCase()));
      const ccToCreate = uniqByName(costCenters).filter(c => !ccNames.has(c.name.toLowerCase()));
      if (ccToCreate.length) {
        await prisma.costCenter.createMany({ data: ccToCreate });
      }

      return res.json({
        ok: true,
        created: {
          accounts: accToCreate.length,
          paymentMethods: paymentMethods.length, // pode já existir, mas ok
          costCenters: ccToCreate.length
        }
      });
    } catch (e) {
      console.error("seed.defaults error:", e);
      return res.status(500).json({ error: "Erro ao criar modelo padrão" });
    }
  }
};