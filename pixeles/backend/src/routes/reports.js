const { Router } = require("express");
const controller = require("../controllers/reportController");

const router = Router();

router.get("/daily", controller.dailyReport);
router.get("/monthly", controller.monthlyReport);
router.get("/stats", controller.stats);
router.get("/top-games", controller.topGames);
router.get("/top-consoles", controller.topConsoles);

module.exports = router;
