const Redis = require("ioredis");

let redis = null;

function createClient() {
  if (redis) return redis;

  // Soporta REDIS_URL (Upstash) o host + puerto (local)
  const redisConfig = process.env.REDIS_URL
    ? { url: process.env.REDIS_URL }
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
  });

  redis.on("connect", () => console.log("[Redis] Conectado ✅"));
  redis.on("error", (err) => console.error("[Redis] Error ❌", err.message));
  redis.on("close", () => console.log("[Redis] Conexión cerrada"));

  return redis;
}

function getClient() {
  return redis;
}

module.exports = { createClient, getClient };
