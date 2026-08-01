const { Router } = require("express");
const ctrl = require("../controllers/branchController");
const { authMiddleware } = require("../middleware/authMiddleware");

const router = Router();

router.get("/", authMiddleware(), ctrl.getAll);
router.get("/:id", authMiddleware(), ctrl.getById);
router.post("/", authMiddleware(["superadmin"]), ctrl.create);
router.put("/:id", authMiddleware(["superadmin", "admin"]), ctrl.update);
router.delete("/:id", authMiddleware(["superadmin"]), ctrl.remove);

module.exports = router;
