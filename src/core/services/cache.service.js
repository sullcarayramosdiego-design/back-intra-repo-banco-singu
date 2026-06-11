const Redis = require('ioredis');

const REDIS_URL = process.env.REDIS_URL;
let redisClient = null;
let isRedisConnected = false;

// Caché en memoria local como Fallback
const memoryCache = new Map();

if (REDIS_URL) {
  console.log(`[Cache] Inicializando cliente Redis con URL externa...`);
  try {
    redisClient = new Redis(REDIS_URL, {
      maxRetriesPerRequest: 1,
      connectTimeout: 5000, // Tiempo límite de conexión inicial: 5 segundos
      retryStrategy(times) {
        // Reintentar la conexión cada 10 segundos
        return 10000;
      }
    });

    redisClient.on('connect', () => {
      console.log('[Cache] Conectado exitosamente al servidor de Redis.');
      isRedisConnected = true;
    });

    redisClient.on('error', (err) => {
      console.warn(`[Cache Warning] Fallo en la conexión a Redis (${err.message}). Utilizando fallback en memoria.`);
      isRedisConnected = false;
    });
  } catch (error) {
    console.error('[Cache Error] Error crítico al instanciar Redis:', error.message);
  }
} else {
  console.log('[Cache] REDIS_URL no configurado. Se usará caché en memoria del proceso (In-Memory).');
}

/**
 * Obtener un valor de la caché (Primero intenta Redis, luego memoria local)
 */
async function get(key) {
  // 1. Intentar con Redis si está conectado
  if (isRedisConnected && redisClient) {
    try {
      const data = await redisClient.get(key);
      if (data) {
        return JSON.parse(data);
      }
    } catch (err) {
      console.warn(`[Cache Warning] Error al leer de Redis para la llave "${key}":`, err.message);
    }
  }

  // 2. Fallback a Memoria local
  const cached = memoryCache.get(key);
  if (cached) {
    if (cached.expiresAt > Date.now()) {
      return cached.value;
    }
    // Si ya expiró, lo removemos
    memoryCache.delete(key);
  }

  return null;
}

/**
 * Guardar un valor en la caché (Intenta guardar en Redis y siempre guarda en memoria local como respaldo)
 */
async function set(key, value, ttlSeconds = 300) {
  const expiresAt = Date.now() + (ttlSeconds * 1000);
  
  // Guardar en memoria local (siempre)
  memoryCache.set(key, { value, expiresAt });

  // Guardar en Redis si está conectado
  if (isRedisConnected && redisClient) {
    try {
      await redisClient.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    } catch (err) {
      console.warn(`[Cache Warning] Error al escribir en Redis para la llave "${key}":`, err.message);
    }
  }
}

/**
 * Eliminar una llave de la caché
 */
async function del(key) {
  memoryCache.delete(key);

  if (isRedisConnected && redisClient) {
    try {
      await redisClient.del(key);
    } catch (err) {
      console.warn(`[Cache Warning] Error al eliminar de Redis la llave "${key}":`, err.message);
    }
  }
}

/**
 * Limpiar toda la caché
 */
async function flushAll() {
  memoryCache.clear();
  if (isRedisConnected && redisClient) {
    try {
      await redisClient.flushall();
    } catch (err) {
      console.warn('[Cache Warning] Error al hacer flushall en Redis:', err.message);
    }
  }
}

module.exports = {
  get,
  set,
  del,
  flushAll
};
