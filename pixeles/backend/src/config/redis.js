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

  // Detección de TLS:
  // - "rediss://" o puerto 6380 => TLS
  // - "redis://" puerto 6379 => SIN TLS (Upstash default)
  // Forzar TLS a ciegas rompe la conexión en puerto 6379.
  let tls = undefined;
  if (redisUrl) {
    const needsTls =
      redisUrl.startsWith("rediss://") ||
      redisUrl.includes(":6380");
    tls = needsTls ? {} : undefined;
  }

  redis = new Redis({
    ...redisConfig,
    retryStrategy(times) {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    maxRetriesPerRequest: 3,
    enableOfflineQueue: false,
    tls,
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
