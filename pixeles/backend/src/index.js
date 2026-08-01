const express = require("express");
const http = require("http");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");
const fs = require("fs");

const { testConnection } = require("./config/database");
const { initDb, seedAdmin } = require("./config/initDb");
const { createClient } = require("./config/redis");
const { initSocket } = require("./services/socketService");
const timerService = require("./services/timerService");
const { errorHandler } = require("./middleware/errorHandler");

// Importar rutas
const consoleRoutes = require("./routes/consoles");
const sessionRoutes = require("./routes/sessions");
const gameRoutes = require("./routes/games");
const reportRoutes = require("./routes/reports");
const settingsRoutes = require("./routes/settings");

const app = express();
const server = http.createServer(app);

// ============================================
// Middleware global
// ============================================
app.use(cors({ origin: process.env.CORS_ORIGIN || "*" }));
app.use(express.json({ limit: "1mb" }));
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// ============================================
// Rutas
// ============================================
app.use("/api/auth", require("./routes/auth"));
app.use("/api/consoles", consoleRoutes);
app.use("/api/products", require("./routes/products"));
app.use("/api/branches", require("./routes/branches"));
app.use("/api/sessions", sessionRoutes);
app.use("/api/games", gameRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/settings", settingsRoutes);

// Health check
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// ============================================
// Frontend estático (un solo servicio en Render)
// Busca el build del frontend y lo sirve si existe
// ============================================
const frontendDist = path.join(__dirname, "..", "..", "frontend", "dist");
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  // SPA fallback: rutas internas -> index.html
  app.get(/^(?!\/api|\/socket\.io).*/, (_req, res) => {
    res.sendFile(path.join(frontendDist, "index.html"));
  });
  console.log("[Frontend] Sirviendo build estático desde", frontendDist);
}

// 404
app.use((_req, res) => {
  res.status(404).json({ error: true, message: "Ruta no encontrada" });
});

// Error handler
app.use(errorHandler);

// ============================================
// Inicialización
// ============================================
const PORT = parseInt(process.env.PORT || "4000");

async function start() {
  // Conectar base de datos
  const dbOk = await testConnection();
  if (!dbOk) {
    console.error("[Server] No se pudo conectar a PostgreSQL. Abortando.");
    process.exit(1);
  }

  await initDb();
  await seedAdmin();

  // Conectar Redis (no crítico)
  try {
    createClient();
  } catch (err) {
    console.warn("[Server] Redis no disponible, continuando sin caché");
  }

  // Inicializar Socket.io
  initSocket(server);

  // Inicializar TimerService
  await timerService.init();

  // Arrancar servidor
  server.listen(PORT, "0.0.0.0", () => {
    console.log("\n╔══════════════════════════════════╗");
    console.log("║      🔥 PIXELES - API v1.0       ║");
    console.log("║══════════════════════════════════║");
    console.log(`║  Puerto: ${PORT}`);
    console.log(`║  Modo: ${process.env.NODE_ENV || "development"}`);
    console.log("╚══════════════════════════════════╝\n");
  });
}

start().catch((err) => {
  console.error("[Server] Error fatal:", err);
  process.exit(1);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("[Server] SIGTERM recibido. Cerrando...");
  timerService.destroy();
  server.close(() => process.exit(0));
});

process.on("SIGINT", () => {
  console.log("[Server] SIGINT recibido. Cerrando...");
  timerService.destroy();
  server.close(() => process.exit(0));
});
