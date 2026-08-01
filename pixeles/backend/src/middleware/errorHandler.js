/**
 * Middleware de manejo global de errores
 */
function errorHandler(err, req, res, _next) {
  console.error(`[ERROR] ${req.method} ${req.path}:`, err.message);

  const status = err.status || 500;
  res.status(status).json({
    error: true,
    message: status === 500 ? "Error interno del servidor" : err.message,
  });
}

/**
 * Helper para crear errores con código HTTP
 */
function createError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

module.exports = { errorHandler, createError };
