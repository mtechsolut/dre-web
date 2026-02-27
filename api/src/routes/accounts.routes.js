const router = require("express").Router();
const auth = require("../middlewares/auth");
const controller = require("../controllers/accounts.controller");

router.use(auth);

router.post("/", controller.createAccount);
router.get("/:companyId", controller.listAccounts);

module.exports = router;