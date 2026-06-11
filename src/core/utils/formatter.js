/**
 * Helpers para dar formato a los datos en las respuestas de la API
 */

/**
 * Convierte valores numéricos a decimales redondeados a 2 posiciones
 */
function toDecimal(value, decimals = 2) {
  const parsed = parseFloat(value);
  return isNaN(parsed) ? 0 : parseFloat(parsed.toFixed(decimals));
}

/**
 * Estructura estándar para respuestas exitosas
 */
function successResponse(data, message = 'Operación realizada con éxito', metadata = {}) {
  return {
    status: 'success',
    message,
    timestamp: new Date().toISOString(),
    metadata,
    data
  };
}

/**
 * Estructura estándar para respuestas de error
 */
function errorResponse(message, code = 'INTERNAL_ERROR', details = null) {
  return {
    status: 'error',
    code,
    message,
    timestamp: new Date().toISOString(),
    ...(details && { details })
  };
}

module.exports = { toDecimal, successResponse, errorResponse };
