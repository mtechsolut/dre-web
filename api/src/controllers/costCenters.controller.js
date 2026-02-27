const prisma = require("../config/prisma");

async function requireMembership(userId, companyId) {
  return prisma.companyUser.findUnique({
    where: { userId_companyId: { userId, companyId } },
    select: { role: true },
  });
}

// normaliza tipo e classe
function normalizeType(type) {
  return type === "REVENUE" ? "REVENUE" : "EXPENSE";
}

function normalizeExpenseClass(v) {
  return v === "FIXED" ? "FIXED" : "VARIABLE";
}

module.exports = {
  // GET /cost-centers?companyId=...
  async list(req, res) {
    try {
      const { companyId } = req.query;
      if (!companyId) return res.status(400).json({ error: "companyId é obrigatório" });

      const membership = await requireMembership(req.userId, companyId);
      if (!membership) return res.status(403).json({ error: "Sem acesso a essa empresa" });

      const costCenters = await prisma.costCenter.findMany({
        where: { companyId },
        orderBy: [{ type: "asc" }, { name: "asc" }],
        select: {
          id: true,
          name: true,
          type: true,
          expenseClass: true, // ✅ NOVO: devolve pro front
          createdAt: true,
        },
      });

      return res.json({ costCenters });
    } catch (err) {
      console.error("costCenters.controller list error:", err);
      return res.status(500).json({ error: "Erro ao listar centros de custo" });
    }
  },

  // POST /cost-centers
  async create(req, res) {
    try {
      const { companyId, name, type } = req.body;

      // ✅ aceita tanto expenseClass quanto expenseCategory (compat com o front)
      const rawExpenseClass = req.body.expenseClass ?? req.body.expenseCategory;

      if (!companyId || !name) {
        return res.status(400).json({ error: "companyId e name são obrigatórios" });
      }

      const membership = await requireMembership(req.userId, companyId);
      if (!membership) return res.status(403).json({ error: "Sem acesso a essa empresa" });

      const normalizedType = normalizeType(type);

      // ✅ só faz sentido pra despesa; pra receita mantém VARIABLE (não atrapalha)
      const expenseClass =
        normalizedType === "EXPENSE"
          ? normalizeExpenseClass(rawExpenseClass)
          : "VARIABLE";

      const cc = await prisma.costCenter.create({
        data: {
          companyId,
          name: String(name).trim(),
          type: normalizedType,
          expenseClass, // ✅ grava no banco
        },
        select: { id: true, name: true, type: true, expenseClass: true, createdAt: true },
      });

      return res.status(201).json({ costCenter: cc });
    } catch (err) {
      console.error("costCenters.controller create error:", err);
      return res.status(500).json({ error: "Erro ao criar centro de custo" });
    }
  },

  // PUT /cost-centers/:id
  async update(req, res) {
    try {
      const { id } = req.params;
      const { companyId, name, type } = req.body;

      // ✅ aceita tanto expenseClass quanto expenseCategory (compat com o front)
      const rawExpenseClass = req.body.expenseClass ?? req.body.expenseCategory;

      if (!companyId) return res.status(400).json({ error: "companyId é obrigatório" });
      if (!name) return res.status(400).json({ error: "name é obrigatório" });

      const membership = await requireMembership(req.userId, companyId);
      if (!membership) return res.status(403).json({ error: "Sem acesso a essa empresa" });

      const exists = await prisma.costCenter.findFirst({
        where: { id, companyId },
        select: { id: true },
      });
      if (!exists) return res.status(404).json({ error: "Centro de custo não encontrado" });

      const normalizedType = normalizeType(type);

      const expenseClass =
        normalizedType === "EXPENSE"
          ? normalizeExpenseClass(rawExpenseClass)
          : "VARIABLE";

      const updated = await prisma.costCenter.update({
        where: { id },
        data: {
          name: String(name).trim(),
          type: normalizedType,
          expenseClass, // ✅ atualiza também
        },
        select: { id: true, name: true, type: true, expenseClass: true, createdAt: true },
      });

      return res.json({ costCenter: updated });
    } catch (err) {
      console.error("costCenters.controller update error:", err);
      return res.status(500).json({ error: "Erro ao atualizar centro de custo" });
    }
  },

  // DELETE /cost-centers/:id
  async remove(req, res) {
    try {
      const { id } = req.params;
      const { companyId } = req.body;

      if (!companyId) return res.status(400).json({ error: "companyId é obrigatório" });

      const membership = await requireMembership(req.userId, companyId);
      if (!membership) return res.status(403).json({ error: "Sem acesso a essa empresa" });

      const exists = await prisma.costCenter.findFirst({
        where: { id, companyId },
        select: { id: true },
      });
      if (!exists) return res.status(404).json({ error: "Centro de custo não encontrado" });

      const count = await prisma.entry.count({
        where: { companyId, costCenterId: id },
      });
      if (count > 0) {
        return res.status(400).json({
          error: "Não é possível excluir: existe lançamento usando este centro de custo.",
        });
      }

      await prisma.costCenter.delete({ where: { id } });

      return res.json({ ok: true });
    } catch (err) {
      console.error("costCenters.controller remove error:", err);
      return res.status(500).json({ error: "Erro ao excluir centro de custo" });
    }
  },
};