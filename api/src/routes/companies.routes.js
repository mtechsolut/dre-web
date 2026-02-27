const router = require("express").Router();
const auth = require("../middlewares/auth");
const controller = require("../controllers/companies.controller");

router.use(auth);

router.post("/", controller.createCompany);      // cria empresa e vincula usuário como OWNER
router.get("/", controller.listMyCompanies);     // lista empresas do usuário logado

module.exports = router;