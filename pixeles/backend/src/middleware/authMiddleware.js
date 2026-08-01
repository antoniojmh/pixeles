const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "pixeles_dev_secret_change_in_production";
const JWT_EXPIRES = "24h";

function authMiddleware(allowedRoles = []) {
  return (req, res, next) => {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Token requerido" });
    }
    try {
      const payload = jwt.verify(header.slice(7), JWT_SECRET);
      req.user = payload;
      if (allowedRoles.length && !allowedRoles.includes(payload.role)) {
        return res.status(403).json({ error: "Acceso denegado" });
      }
      next();
    } catch {
      return res.status(401).json({ error: "Token inválido o expirado" });
    }
  };
}

module.exports = { authMiddleware, JWT_SECRET, JWT_EXPIRES };
