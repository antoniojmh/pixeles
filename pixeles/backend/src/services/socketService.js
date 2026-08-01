let io = null;

/**
 * Inicializar Socket.io en el servidor HTTP
 */
function initSocket(httpServer) {
  const { Server } = require("socket.io");
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN || "*",
      methods: ["GET", "POST"],
    },
    pingInterval: 25000,
    pingTimeout: 20000,
  });

  io.on("connection", (socket) => {
    console.log(`[WS] Cliente conectado: ${socket.id}`);

    socket.on("join:console", (consoleId) => {
      socket.join(`console:${consoleId}`);
    });

    socket.on("leave:console", (consoleId) => {
      socket.leave(`console:${consoleId}`);
    });

    socket.on("disconnect", () => {
      console.log(`[WS] Cliente desconectado: ${socket.id}`);
    });
  });

  console.log("[WS] Socket.io inicializado ✅");
  return io;
}

function getIO() {
  return io;
}

/**
 * Emitir eventos globales
 */
function emitSessionStarted(data) {
  io?.emit("session:started", data);
}

function emitSessionEnded(data) {
  io?.emit("session:ended", data);
}

function emitConsoleUpdated(data) {
  io?.emit("console:updated", data);
  io?.to(`console:${data.id}`).emit("console:updated", data);
}

function emitTimeAlert(data) {
  io?.emit("alert:5min", data);
}

function emitTimeUp(data) {
  io?.emit("alert:timeup", data);
}

module.exports = {
  initSocket,
  getIO,
  emitSessionStarted,
  emitSessionEnded,
  emitConsoleUpdated,
  emitTimeAlert,
  emitTimeUp,
};
