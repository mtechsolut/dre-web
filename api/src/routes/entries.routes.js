const router = require("express").Router();
const auth = require("../middlewares/auth");
const controller = require("../controllers/entries.controller");

router.use(auth);

router.post("/", controller.create);
router.get("/", controller.list);

router.put("/:id", controller.update);
router.delete("/:id", controller.remove);

router.post("/bulk", controller.bulkCreate);

module.exports = router;