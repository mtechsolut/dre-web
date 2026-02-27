const express = require("express");
const cors = require("cors");

// Routes
const authRoutes = require("./routes/auth.routes");
const companyRoutes = require("./routes/companies.routes");
const accountRoutes = require("./routes/accounts.routes");
const costCenterRoutes = require("./routes/costCenters.routes");
const entryRoutes = require("./routes/entries.routes");
const reportRoutes = require("./routes/reports.routes");
const paymentMethodRoutes = require("./routes/paymentMethods.routes");
const seedRoutes = require("./routes/seed.routes");

const app = express();

/**
 * ===============================
 * CORS
 * ===============================
 * Em produção, substitua origin: true
 * por algo como:
 * origin: ["https://seudominio.com"]
 */
app.use(
  cors({
    origin: true,
    credentials: true
  })
);
app.options(/.*/, cors({ origin: true, credentials: true }));

/**
 * ===============================
 * Middlewares globais
 * ===============================
 */
app.use(express.json());

/**
 * ===============================
 * Root (home)
 * ===============================
 */
app.get("/", (req, res) => {
  return res.status(200).send("API OK 🚀");
});

/**
 * ===============================
 * Health check
 * ===============================
 */
app.get("/health", (req, res) => {
  return res.json({
    ok: true,
    timestamp: new Date().toISOString()
  });
});

/**
 * ===============================
 * Routes
 * ===============================
 */
app.use("/auth", authRoutes);
app.use("/companies", companyRoutes);
app.use("/accounts", accountRoutes);
app.use("/cost-centers", costCenterRoutes);
app.use("/entries", entryRoutes);
app.use("/reports", reportRoutes); // aqui já inclui dre, dre-by-cost-center e dre-series
app.use("/payment-methods", paymentMethodRoutes);
app.use("/seed", seedRoutes);

/**
 * ===============================
 * 404 handler
 * ===============================
 */
app.use((req, res) => {
  return res.status(404).json({
    error: "Rota não encontrada"
  });
});

/**
 * ===============================
 * Global error handler
 * ===============================
 */
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  return res.status(500).json({
    error: "Erro interno do servidor"
  });
});

module.exports = app;