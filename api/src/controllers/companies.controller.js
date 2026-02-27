const prisma = require("../config/prisma");

module.exports = {
  // POST /companies
  async createCompany(req, res) {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: "name é obrigatório" });

    const company = await prisma.company.create({
      data: {
        name,
        members: {
          create: {
            userId: req.userId,
            role: "OWNER"
          }
        }
      }
    });

    return res.status(201).json({ company });
  },

  // GET /companies
  async listMyCompanies(req, res) {
    const memberships = await prisma.companyUser.findMany({
      where: { userId: req.userId },
      include: { company: true }
    });

    const companies = memberships.map(m => ({
      id: m.company.id,
      name: m.company.name,
      role: m.role
    }));

    return res.json({ companies });
  }
};