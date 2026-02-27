const prisma = require("../config/prisma");

module.exports = {
  async createAccount(req, res) {
    const { companyId, name, type, group, order } = req.body;

    if (!companyId || !name || !type || !group) {
      return res.status(400).json({ error: "Campos obrigatórios faltando" });
    }

    const account = await prisma.account.create({
      data: {
        companyId,
        name,
        type,
        group,
        order: order || 0
      }
    });

    return res.status(201).json(account);
  },

  async listAccounts(req, res) {
    const { companyId } = req.params;

    const accounts = await prisma.account.findMany({
      where: { companyId },
      orderBy: { order: "asc" }
    });

    return res.json(accounts);
  }
};