const { Router } = require("express");
const controller = require("../controllers/consoleController");
const ext = require("../controllers/consoleExtended");

const router = Router();

router.get("/", controller.getAll);
router.get("/:id", controller.getById);
router.post("/", controller.create);
router.put("/:id", controller.update);
router.delete("/:id", controller.remove);

router.post("/:id/start", controller.startSession);
router.post("/:id/end", controller.endSession);
router.post("/:id/pause", ext.pauseSession);
router.post("/:id/resume", ext.resumeSession);
router.post("/:id/add-time", ext.addTime);
router.post("/:id/status", ext.setStatus);
router.post("/:id/reserve", controller.reserve);
router.post("/:id/release", controller.releaseReservation);
router.post("/:id/maintenance", controller.toggleMaintenance);

module.exports = router;
