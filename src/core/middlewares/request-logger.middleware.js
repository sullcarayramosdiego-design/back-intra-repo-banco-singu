/**
 * Middleware de logging de peticiones HTTP.
 * Registra cada request con: método, ruta, status, tiempo y resultado (success/error).
 */

// Códigos ANSI para colores en consola
const COLOR = {
  reset:   '\x1b[0m',
  bold:    '\x1b[1m',
  dim:     '\x1b[2m',
  green:   '\x1b[32m',
  yellow:  '\x1b[33m',
  red:     '\x1b[31m',
  cyan:    '\x1b[36m',
  magenta: '\x1b[35m',
  white:   '\x1b[37m',
  gray:    '\x1b[90m'
};

/**
 * Devuelve el color asociado al código HTTP.
 */
function getStatusColor(statusCode) {
  if (statusCode >= 500) return COLOR.red;
  if (statusCode >= 400) return COLOR.yellow;
  if (statusCode >= 300) return COLOR.cyan;
  return COLOR.green;
}

/**
 * Devuelve el color del método HTTP.
 */
function getMethodColor(method) {
  const map = {
    GET:    COLOR.cyan,
    POST:   COLOR.green,
    PUT:    COLOR.yellow,
    PATCH:  COLOR.magenta,
    DELETE: COLOR.red
  };
  return map[method] || COLOR.white;
}

/**
 * Formatea el tiempo de respuesta con color según duración.
 */
function formatDuration(ms) {
  if (ms < 100) return `${COLOR.green}${ms}ms${COLOR.reset}`;
  if (ms < 500) return `${COLOR.yellow}${ms}ms${COLOR.reset}`;
  return `${COLOR.red}${ms}ms${COLOR.reset}`;
}

/**
 * Formatea el timestamp actual como HH:MM:SS.
 */
function getTimestamp() {
  return new Date().toLocaleTimeString('es-PE', { hour12: false });
}

/**
 * Middleware principal de logging.
 */
function requestLogger(req, res, next) {
  const startAt = process.hrtime();
  const { method, originalUrl } = req;

  // Interceptar el final de la respuesta
  res.on('finish', () => {
    const diff = process.hrtime(startAt);
    const ms = Math.round(diff[0] * 1e3 + diff[1] * 1e-6);
    const { statusCode } = res;

    const isSuccess = statusCode < 400;
    const statusColor = getStatusColor(statusCode);
    const methodColor = getMethodColor(method);

    const icon        = isSuccess ? '✅' : statusCode >= 500 ? '❌' : '⚠️ ';
    const statusLabel = isSuccess ? 'SUCCESS' : 'ERROR';
    const durationStr = formatDuration(ms);

    // Ocultar logs del health check para no saturar
    if (originalUrl === '/api/health') return;

    console.log(
      `${COLOR.gray}[${getTimestamp()}]${COLOR.reset} ` +
      `${icon} ${methodColor}${COLOR.bold}${method.padEnd(6)}${COLOR.reset} ` +
      `${COLOR.white}${originalUrl}${COLOR.reset} ` +
      `${statusColor}${COLOR.bold}${statusCode}${COLOR.reset} ` +
      `${COLOR.gray}(${statusLabel})${COLOR.reset} ` +
      `${durationStr}`
    );
  });

  // Interceptar errores que no lleguen a 'finish'
  res.on('error', (err) => {
    const diff = process.hrtime(startAt);
    const ms = Math.round(diff[0] * 1e3 + diff[1] * 1e-6);

    console.error(
      `${COLOR.gray}[${getTimestamp()}]${COLOR.reset} ` +
      `❌ ${COLOR.red}${COLOR.bold}${method.padEnd(6)}${COLOR.reset} ` +
      `${COLOR.white}${originalUrl}${COLOR.reset} ` +
      `${COLOR.red}${COLOR.bold}SOCKET_ERROR${COLOR.reset} ` +
      `${formatDuration(ms)} — ${err.message}`
    );
  });

  next();
}

module.exports = requestLogger;
