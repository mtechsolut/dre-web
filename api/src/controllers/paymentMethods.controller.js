const prisma = require("../config/prisma");

async function requireMembership(userId, companyId) {
  return prisma.companyUser.findUnique({
    where: { userId_companyId: { userId, companyId } },
    select: { role: true }
  });
}

module.exports = {
  // GET /payment-methods?companyId=...
  async list(req, res) {
    try {
      const { companyId } = req.query;
      if (!companyId) return res.status(400).json({ error: "companyId é obrigatório" });

      const membership = await requireMembership(req.userId, companyId);
      if (!membership) return res.status(403).json({ error: "Sem acesso a essa empresa" });

      const items = await prisma.paymentMethod.findMany({
        where: { companyId },
        orderBy: [{ active: "desc" }, { name: "asc" }],
      });

      return res.json({ paymentMethods: items });
    } catch (e) {
      console.error("paymentMethods.list error:", e);
      return res.status(500).json({ error: "Erro ao listar formas de pagamento" });
    }
  },

  // POST /payment-methods
  async create(req, res) {
    try {
      const { companyId, name } = req.body;
      if (!companyId || !name) return res.status(400).json({ error: "companyId e name são obrigatórios" });

      const membership = await requireMembership(req.userId, companyId);
      if (!membership) return res.status(403).json({ error: "Sem acesso a essa empresa" });

      const pm = await prisma.paymentMethod.create({
        data: { companyId, name: String(name).trim() }
      });

      return res.status(201).json({ paymentMethod: pm });
    } catch (e) {
      console.error("paymentMethods.create error:", e);
      // unique (companyId,name)
      return res.status(500).json({ error: "Erro ao criar forma de pagamento" });
    }
  },

  // PATCH /payment-methods/:id
  async update(req, res) {
    try {
      const { id } = req.params;
      const { name, active } = req.body;

      const existing = await prisma.paymentMethod.findUnique({ where: { id } });
      if (!existing) return res.status(404).json({ error: "Forma de pagamento não encontrada" });

      const membership = await requireMembership(req.userId, existing.companyId);
      if (!membership) return res.status(403).json({ error: "Sem acesso a essa empresa" });

      const pm = await prisma.paymentMethod.update({
        where: { id },
        data: {
          ...(name !== undefined ? { name: String(name).trim() } : {}),
          ...(active !== undefined ? { active: Boolean(active) } : {}),
        }
      });

      return res.json({ paymentMethod: pm });
    } catch (e) {
      console.error("paymentMethods.update error:", e);
      return res.status(500).json({ error: "Erro ao atualizar forma de pagamento" });
    }
  }
};