const router = require("express").Router();
const auth = require("../middlewares/auth");
const controller = require("../controllers/seed.controller");

router.use(auth);

// POST /seed/defaults  body: { companyId }
router.post("/defaults", controller.defaults);

module.exports = router;