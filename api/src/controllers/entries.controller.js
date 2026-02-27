const prisma = require("../config/prisma");
const bcrypt = require("bcryptjs");

async function requireMembership(userId, companyId) {
  return prisma.companyUser.findUnique({
    where: { userId_companyId: { userId, companyId } },
    select: { role: true }
  });
}

async function verifyLoginPassword(userId, password) {
  if (!password) return false;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { password: true }
  });
  if (!user?.password) return false;

  return bcrypt.compare(String(password), String(user.password));
}

async function ensureDefaultAccount(companyId, type) {
  let acc = await prisma.account.findFirst({
    where: { companyId, type },
    orderBy: { createdAt: "asc" },
    select: { id: true }
  });
  if (acc) return acc.id;

  const def =
    type === "REVENUE"
      ? { name: "Receitas (Auto)", group: "RECEITA_LIQUIDA", order: 1 }
      : { name: "Despesas (Auto)", group: "DESPESAS_OPERACIONAIS", order: 1 };

  const created = await prisma.account.create({
    data: { companyId, type, ...def },
    select: { id: true }
  });

  return created.id;
}

module.exports = {
  // POST /entries
  async create(req, res) {
    try {
      const { companyId, costCenterId, description, amount, competenceMonth } = req.body;

      // ✅ agora NÃO exige accountId e type
      if (!companyId || !costCenterId || !competenceMonth) {
        return res.status(400).json({
          error: "companyId, costCenterId e competenceMonth são obrigatórios"
        });
      }

      if (amount === undefined || amount === null || Number(amount) <= 0) {
        return res.status(400).json({ error: "amount deve ser maior que 0" });
      }

      const membership = await requireMembership(req.userId, companyId);
      if (!membership) return res.status(403).json({ error: "Sem acesso a essa empresa" });

      const cc = await prisma.costCenter.findFirst({
        where: { id: costCenterId, companyId },
        select: { id: true, name: true, type: true }
      });
      if (!cc) return res.status(400).json({ error: "costCenterId inválido para esta empresa" });

      const type = cc.type; // REVENUE | EXPENSE
      const accountId = await ensureDefaultAccount(companyId, type);

      const entry = await prisma.entry.create({
        data: {
          companyId,
          competenceMonth: String(competenceMonth),
          type,
          accountId,
          costCenterId: cc.id,
          description: String(description || cc.name || "Lançamento"),
          amount: Number(amount),
          createdById: req.userId
        },
        include: {
          costCenter: { select: { id: true, name: true, type: true } }
        }
      });

      return res.status(201).json({ entry });
    } catch (err) {
      console.error("entries.controller create error:", err);
      return res.status(500).json({ error: "Erro ao criar lançamento" });
    }
  },

  // GET /entries?companyId=...&competenceMonth=...
  async list(req, res) {
    try {
      const { companyId, competenceMonth, costCenterId } = req.query;

      if (!companyId || !competenceMonth) {
        return res.status(400).json({ error: "companyId e competenceMonth são obrigatórios" });
      }

      const membership = await requireMembership(req.userId, companyId);
      if (!membership) return res.status(403).json({ error: "Sem acesso a essa empresa" });

      const entries = await prisma.entry.findMany({
        where: {
          companyId,
          competenceMonth: String(competenceMonth),
          ...(costCenterId ? { costCenterId } : {})
        },
        orderBy: [{ createdAt: "desc" }],
        include: {
          costCenter: { select: { id: true, name: true, type: true } }
        }
      });

      return res.json({ entries });
    } catch (err) {
      console.error("entries.controller list error:", err);
      return res.status(500).json({ error: "Erro ao listar lançamentos" });
    }
  },

  // PUT /entries/:id (exige senha)
  async update(req, res) {
    try {
      const { id } = req.params;
      const { companyId, costCenterId, description, amount, password } = req.body;

      if (!companyId) return res.status(400).json({ error: "companyId é obrigatório" });
      if (!id) return res.status(400).json({ error: "id é obrigatório" });

      const membership = await requireMembership(req.userId, companyId);
      if (!membership) return res.status(403).json({ error: "Sem acesso a essa empresa" });

      const ok = await verifyLoginPassword(req.userId, password);
      if (!ok) return res.status(401).json({ error: "Senha inválida" });

      const current = await prisma.entry.findFirst({
        where: { id, companyId },
        select: { id: true, costCenterId: true }
      });
      if (!current) return res.status(404).json({ error: "Lançamento não encontrado" });

      let ccFinal = null;

      if (costCenterId) {
        ccFinal = await prisma.costCenter.findFirst({
          where: { id: costCenterId, companyId },
          select: { id: true, name: true, type: true }
        });
        if (!ccFinal) return res.status(400).json({ error: "costCenterId inválido para esta empresa" });
      } else {
        ccFinal = await prisma.costCenter.findFirst({
          where: { id: current.costCenterId, companyId },
          select: { id: true, name: true, type: true }
        });
      }

      const type = ccFinal?.type || "EXPENSE";
      const accountId = await ensureDefaultAccount(companyId, type);

      const updated = await prisma.entry.update({
        where: { id },
        data: {
          costCenterId: ccFinal?.id || current.costCenterId,
          type,
          accountId,
          ...(amount !== undefined ? { amount: Number(amount) } : {}),
          ...(description !== undefined ? { description: String(description || "") } : {})
        },
        include: {
          costCenter: { select: { id: true, name: true, type: true } }
        }
      });

      return res.json({ entry: updated });
    } catch (err) {
      console.error("entries.controller update error:", err);
      return res.status(500).json({ error: "Erro ao atualizar lançamento" });
    }
  },

  // DELETE /entries/:id (exige senha)
  async remove(req, res) {
    try {
      const { id } = req.params;
      const { companyId, password } = req.body;

      if (!companyId) return res.status(400).json({ error: "companyId é obrigatório" });
      if (!id) return res.status(400).json({ error: "id é obrigatório" });

      const membership = await requireMembership(req.userId, companyId);
      if (!membership) return res.status(403).json({ error: "Sem acesso a essa empresa" });

      const ok = await verifyLoginPassword(req.userId, password);
      if (!ok) return res.status(401).json({ error: "Senha inválida" });

      const current = await prisma.entry.findFirst({
        where: { id, companyId },
        select: { id: true }
      });
      if (!current) return res.status(404).json({ error: "Lançamento não encontrado" });

      await prisma.entry.delete({ where: { id } });

      return res.json({ ok: true });
    } catch (err) {
      console.error("entries.controller remove error:", err);
      return res.status(500).json({ error: "Erro ao excluir lançamento" });
    }
  },

  async bulkCreate(req, res) {
    return res.status(501).json({ error: "bulkCreate desativado por enquanto" });
  }
};