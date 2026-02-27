const router = require("express").Router();
const auth = require("../middlewares/auth");
const controller = require("../controllers/paymentMethods.controller");

router.use(auth);

router.get("/", controller.list);          // /payment-methods?companyId=...
router.post("/", controller.create);       // body: { companyId, name }
router.patch("/:id", controller.update);   // body: { name, active }

module.exports = router;