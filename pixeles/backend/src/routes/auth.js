const { Router } = require("express");
const { login, register, me } = require("../controllers/authController");
const { authMiddleware } = require("../middleware/authMiddleware");

const router = Router();

router.post("/login", login);
router.post("/register", authMiddleware(["superadmin", "admin"]), register);
router.get("/me", authMiddleware(), me);

module.exports = router;
