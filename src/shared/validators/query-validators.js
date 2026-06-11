/**
 * Validadores de parámetros de consulta compartidos entre módulos.
 * Centraliza la sanitización de inputs del request antes de llegar a los services.
 */

const REGIONES_VALIDAS = ['Norte', 'Sur', 'Centro', 'Este', 'Oeste', 'Lima'];

/**
 * Extrae y valida los filtros comunes de req.query.
 * Retorna solo los campos que tienen valor definido (no undefined ni vacío).
 *
 * @param {Object} query - req.query de Express
 * @returns {{ region?: string, segmento?: string, producto?: string }}
 */
function parseReporteFilters(query = {}) {
  const filters = {};

  if (query.region && typeof query.region === 'string') {
    filters.region = query.region.trim();
  }
  if (query.segmento && typeof query.segmento === 'string') {
    filters.segmento = query.segmento.trim();
  }
  if (query.producto && typeof query.producto === 'string') {
    filters.producto = query.producto.trim();
  }

  return filters;
}

/**
 * Extrae y valida los filtros de actividad transaccional.
 *
 * @param {Object} query - req.query de Express
 * @returns {{ canal?: string, sucursal?: string, tipo?: string, periodo?: string }}
 */
function parseTransaccionFilters(query = {}) {
  const filters = {};

  if (query.canal && typeof query.canal === 'string') {
    filters.canal = query.canal.trim();
  }
  if (query.sucursal && typeof query.sucursal === 'string') {
    filters.sucursal = query.sucursal.trim();
  }
  if (query.tipo && typeof query.tipo === 'string') {
    filters.tipo = query.tipo.trim();
  }
  // Validar formato YYYY-MM
  if (query.periodo && /^\d{4}-\d{2}$/.test(query.periodo)) {
    filters.periodo = query.periodo;
  }

  return filters;
}

/**
 * Extrae y valida los filtros de riesgo (fechas).
 *
 * @param {Object} query - req.query de Express
 * @returns {{ fecha_inicio?: string, fecha_fin?: string }}
 */
function parseRiesgoFilters(query = {}) {
  const filters = {};
  const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

  if (query.fecha_inicio && ISO_DATE_REGEX.test(query.fecha_inicio)) {
    filters.fecha_inicio = query.fecha_inicio;
  }
  if (query.fecha_fin && ISO_DATE_REGEX.test(query.fecha_fin)) {
    filters.fecha_fin = query.fecha_fin;
  }

  return filters;
}

module.exports = { parseReporteFilters, parseTransaccionFilters, parseRiesgoFilters };
