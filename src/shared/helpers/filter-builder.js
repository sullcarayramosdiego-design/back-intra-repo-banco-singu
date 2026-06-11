/**
 * Construye cláusulas WHERE dinámicas para consultas SQL.
 * Centraliza la lógica repetida de filtrado en todos los módulos.
 *
 * @param {Object} filters  - Objeto con los filtros opcionales
 * @param {string} [filters.region]   - Filtro por región del ejecutivo
 * @param {string} [filters.segmento] - Filtro por segmento del cliente
 * @param {string} [filters.producto] - Filtro por tipo de producto
 * @param {string} [filters.canal]    - Filtro por canal transaccional
 * @param {string} [filters.sucursal] - Filtro por sucursal del ejecutivo
 * @param {string} [filters.tipo]     - Filtro por tipo de movimiento
 * @param {string} [filters.periodo]  - Filtro por periodo (YYYY-MM)
 *
 * @returns {{ whereStr: string, params: Array }}
 */
function buildWhereClause(filters = {}) {
  const whereClauses = [];
  const params = [];

  const { region, segmento, producto, canal, sucursal, tipo, periodo } = filters;

  if (region) {
    whereClauses.push('de.region = ?');
    params.push(region);
  }
  if (segmento) {
    whereClauses.push('dc.segmento = ?');
    params.push(segmento);
  }
  if (producto) {
    whereClauses.push('dp.tipo_producto = ?');
    params.push(producto);
  }
  if (canal) {
    whereClauses.push('ft.canal = ?');
    params.push(canal);
  }
  if (sucursal) {
    whereClauses.push('de.sucursal_nombre = ?');
    params.push(sucursal);
  }
  if (tipo) {
    whereClauses.push('ft.tipo_movimiento = ?');
    params.push(tipo);
  }
  if (periodo) {
    whereClauses.push("DATE_FORMAT(ft.fecha_transaccion, '%Y-%m') = ?");
    params.push(periodo);
  }

  const whereStr = whereClauses.length > 0
    ? 'WHERE ' + whereClauses.join(' AND ')
    : '';

  return { whereStr, params };
}

/**
 * Extiende un WHERE existente añadiendo condiciones extra (sin el prefijo WHERE).
 * Útil cuando ya existe un WHERE fijo y se necesita agregar filtros dinámicos.
 *
 * @param {string} baseCondition   - Condición base (ej: "dcu.estatus = 'ACTIVA'")
 * @param {string[]} extraClauses  - Cláusulas adicionales sin 'AND'
 * @returns {string}
 */
function extendWhereClause(baseCondition, extraClauses = []) {
  if (!extraClauses.length) return `WHERE ${baseCondition}`;
  return `WHERE ${baseCondition} AND ${extraClauses.join(' AND ')}`;
}

module.exports = { buildWhereClause, extendWhereClause };
