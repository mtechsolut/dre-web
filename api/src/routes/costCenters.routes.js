const router = require("express").Router();
const auth = require("../middlewares/auth");
const controller = require("../controllers/costCenters.controller");

router.use(auth);

// GET /cost-centers?companyId=...
router.get("/", controller.list);

// POST /cost-centers
router.post("/", controller.create);

// PUT /cost-centers/:id
router.put("/:id", controller.update);

// DELETE /cost-centers/:id
router.delete("/:id", controller.remove);

module.exports = router;