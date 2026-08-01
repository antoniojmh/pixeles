const { Router } = require("express");
const controller = require("../controllers/gameController");

const router = Router();

router.get("/", controller.getAll);
router.post("/", controller.create);
router.put("/:id", controller.update);
router.delete("/:id", controller.remove);

module.exports = router;
