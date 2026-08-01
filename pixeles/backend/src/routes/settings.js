const { Router } = require("express");
const controller = require("../controllers/settingsController");

const router = Router();

router.get("/", controller.getAll);
router.put("/", controller.update);

module.exports = router;
