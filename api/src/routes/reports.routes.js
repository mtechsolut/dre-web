const router = require("express").Router();
const auth = require("../middlewares/auth");
const controller = require("../controllers/reports.controller");

router.use(auth);

// GET /reports/dre?companyId=...&competenceMonth=YYYY-MM&costCenterId=...
router.get("/dre", controller.dre);

// GET /reports/dre-by-cost-center?companyId=...&competenceMonth=YYYY-MM
router.get("/dre-by-cost-center", controller.dreByCostCenter);

// GET /reports/dre-series?companyId=...&from=YYYY-MM&to=YYYY-MM
router.get("/dre-series", controller.dreSeries);

module.exports = router;
