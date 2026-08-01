const Redis = require("ioredis");

let redis = null;

function createClient() {
  if (redis) return redis;

  // Soporta REDIS_URL (Upstash) o host + puerto (local)
  const redisUrl = process.env.REDIS_URL;
  const redisConfig = redisUrl
    ? { url: redisUrl }
    : {
        host: process.env.REDIS_HOST || "localhost",
        port: parseInt(process.env.REDIS_PORT || "6379"),
      };

  redis = new Redis({
    ...redisConfig,
    retryStrategy(times) {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    maxRetriesPerRequest: 3,
    enableOfflineQueue: false,
    // Upstash usa TLS siempre (puerto 6379/6380 con certificado).
    // ioredis con URL y ciertos hosts no activa TLS solo; forzamos tls vacío
    // que significa "usar TLS sin verificación de CA personalizada".
    tls: redisUrl ? {} : undefined,
  });

  redis.on("connect", () => console.log("[Redis] Conectado ✅"));
  redis.on("error", (err) => {
    if (err && err.code === "ECONNREFUSED") {
      console.error("[Redis] Error ❌", "Conexión rechazada. Revisa host/puerto/TLS.");
    } else {
      console.error("[Redis] Error ❌", err.message || "Desconocido");
    }
  });
  redis.on("close", () => console.log("[Redis] Conexión cerrada"));

  return redis;
}

function getClient() {
  return redis;
}

module.exports = { createClient, getClient };
