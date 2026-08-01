const { Router } = require("express");
const ctrl = require("../controllers/productController");
const { authMiddleware } = require("../middleware/authMiddleware");

const router = Router();

router.get("/", ctrl.getAll);
router.get("/:id", ctrl.getById);
router.post("/", authMiddleware(["superadmin", "admin"]), ctrl.create);
router.put("/:id", authMiddleware(["superadmin", "admin"]), ctrl.update);
router.delete("/:id", authMiddleware(["superadmin"]), ctrl.remove);

module.exports = router;
