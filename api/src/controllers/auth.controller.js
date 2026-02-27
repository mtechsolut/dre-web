const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const prisma = require("../config/prisma");

function makeToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
}

module.exports = {
  // POST /auth/register
  async register(req, res) {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "name, email, password são obrigatórios" });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ error: "Email já cadastrado" });

    const hash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { name, email, password: hash }
    });

    const token = makeToken(user.id);

    return res.status(201).json({
      token,
      user: { id: user.id, name: user.name, email: user.email }
    });
  },

  // POST /auth/login
  async login(req, res) {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "email e password são obrigatórios" });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: "Credenciais inválidas" });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: "Credenciais inválidas" });

    const token = makeToken(user.id);

    return res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email }
    });
  },

  // GET /auth/me (simples: lê o token e retorna usuário)
  async me(req, res) {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Token ausente" });
    }

    try {
      const token = header.split(" ")[1];
      const payload = jwt.verify(token, process.env.JWT_SECRET);

      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: { id: true, name: true, email: true, createdAt: true }
      });

      return res.json({ user });
    } catch {
      return res.status(401).json({ error: "Token inválido" });
    }
  }
};