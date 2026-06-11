const db = require('../../core/config/database');

class DesempenoService {

  /**
   * Desempeño de ejecutivos: cuentas y saldos gestionados (cartera).
   */
  async getDesempenioEjecutivos() {
    const sql = `
      SELECT 
        de.ejecutivo_id,
        de.nombre_ejecutivo,
        de.zona,
        de.region,
        de.sucursal_nombre,
        SUM(fpc.saldo) AS saldo_total_gestionado,
        SUM(ABS(fpc.saldo)) AS saldo_absoluto_gestionado,
        COUNT(DISTINCT fpc.cuenta_id) AS total_cuentas_gestionadas,
        ROUND(AVG(ABS(fpc.saldo)), 2) AS saldo_promedio_cuenta
      FROM fact_posicion_cartera fpc
      JOIN dim_ejecutivos de ON fpc.ejecutivo_id = de.ejecutivo_id
      GROUP BY de.ejecutivo_id, de.nombre_ejecutivo, de.zona, de.region, de.sucursal_nombre
      ORDER BY saldo_absoluto_gestionado DESC;
    `;
    return await db.query(sql);
  }

  /**
   * Ranking de ejecutivos por transacciones gestionadas con filtros opcionales.
   * Usado para: tabla ranking + gráfico barras top ejecutivos.
   */
  async getRankingEjecutivos({ zona, region, canal, top } = {}) {
    const whereClauses = [];
    const params = [];

    if (zona)   { whereClauses.push('de.zona = ?');   params.push(zona); }
    if (region) { whereClauses.push('de.region = ?'); params.push(region); }
    if (canal)  { whereClauses.push('ft.canal = ?');  params.push(canal); }

    const whereStr = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : '';
    const limitStr = top ? `LIMIT ${parseInt(top, 10)}` : 'LIMIT 20';

    const sql = `
      SELECT 
        de.ejecutivo_id,
        de.nombre_ejecutivo,
        de.zona,
        de.region,
        de.sucursal_nombre,
        COUNT(ft.transaccion_id)              AS cantidad_transacciones,
        SUM(ft.monto)                          AS monto_total,
        SUM(CASE WHEN ft.tipo_movimiento = 'CREDITO' THEN ft.monto ELSE 0 END) AS monto_credito,
        SUM(CASE WHEN ft.tipo_movimiento = 'DEBITO'  THEN ft.monto ELSE 0 END) AS monto_debito,
        COUNT(CASE WHEN ft.tipo_movimiento = 'CREDITO' THEN 1 END) AS tx_credito,
        COUNT(CASE WHEN ft.tipo_movimiento = 'DEBITO'  THEN 1 END) AS tx_debito,
        ROUND(AVG(ABS(ft.monto)), 2)           AS ticket_promedio
      FROM fact_transacciones ft
      JOIN dim_ejecutivos de ON ft.ejecutivo_id = de.ejecutivo_id
      ${whereStr}
      GROUP BY de.ejecutivo_id, de.nombre_ejecutivo, de.zona, de.region, de.sucursal_nombre
      ORDER BY cantidad_transacciones DESC
      ${limitStr};
    `;
    const [rows] = await db.pool.query(sql, params);
    return rows;
  }

  /**
   * Agrupación por zona: totales de transacciones y montos.
   * Usado para: gráfico dona / barras agrupadas por zona.
   */
  async getTransaccionesPorZona({ canal, region } = {}) {
    const whereClauses = [];
    const params = [];

    if (region) { whereClauses.push('de.region = ?'); params.push(region); }
    if (canal)  { whereClauses.push('ft.canal = ?');  params.push(canal); }

    const whereStr = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : '';

    const sql = `
      SELECT
        de.zona,
        de.region,
        COUNT(ft.transaccion_id)              AS cantidad_transacciones,
        SUM(ft.monto)                          AS monto_total,
        COUNT(DISTINCT ft.ejecutivo_id)        AS total_ejecutivos,
        ROUND(AVG(ABS(ft.monto)), 2)           AS ticket_promedio
      FROM fact_transacciones ft
      JOIN dim_ejecutivos de ON ft.ejecutivo_id = de.ejecutivo_id
      ${whereStr}
      GROUP BY de.zona, de.region
      ORDER BY cantidad_transacciones DESC;
    `;
    const [rows] = await db.pool.query(sql, params);
    return rows;
  }

  /**
   * Evolución mensual de transacciones por zona.
   * Usado para: gráfico de líneas (tendencia temporal).
   */
  async getEvolucionMensual({ zona, region, canal } = {}) {
    const whereClauses = [];
    const params = [];

    if (zona)   { whereClauses.push('de.zona = ?');   params.push(zona); }
    if (region) { whereClauses.push('de.region = ?'); params.push(region); }
    if (canal)  { whereClauses.push('ft.canal = ?');  params.push(canal); }

    const whereStr = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : '';

    const sql = `
      SELECT
        DATE_FORMAT(ft.fecha_transaccion, '%Y-%m') AS periodo,
        de.zona,
        COUNT(ft.transaccion_id)                   AS cantidad_transacciones,
        SUM(ft.monto)                               AS monto_total,
        COUNT(DISTINCT ft.ejecutivo_id)             AS ejecutivos_activos
      FROM fact_transacciones ft
      JOIN dim_ejecutivos de ON ft.ejecutivo_id = de.ejecutivo_id
      ${whereStr}
      GROUP BY periodo, de.zona
      ORDER BY periodo ASC, cantidad_transacciones DESC;
    `;
    const [rows] = await db.pool.query(sql, params);
    return rows;
  }

  /**
   * Distribución por canal de las transacciones.
   * Usado para: gráfico dona de canales.
   */
  async getDistribucionCanal({ zona, region } = {}) {
    const whereClauses = [];
    const params = [];

    if (zona)   { whereClauses.push('de.zona = ?');   params.push(zona); }
    if (region) { whereClauses.push('de.region = ?'); params.push(region); }

    const whereStr = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : '';

    const sql = `
      SELECT
        ft.canal,
        COUNT(ft.transaccion_id)   AS cantidad_transacciones,
        SUM(ft.monto)               AS monto_total,
        ROUND(
          COUNT(ft.transaccion_id) * 100.0 / SUM(COUNT(ft.transaccion_id)) OVER (), 2
        ) AS porcentaje
      FROM fact_transacciones ft
      JOIN dim_ejecutivos de ON ft.ejecutivo_id = de.ejecutivo_id
      ${whereStr}
      GROUP BY ft.canal
      ORDER BY cantidad_transacciones DESC;
    `;
    const [rows] = await db.pool.query(sql, params);
    return rows;
  }

  /**
   * KPIs resumen del módulo de desempeño.
   */
  async getKpisDesempeno({ zona, region, canal } = {}) {
    const whereClauses = [];
    const params = [];

    if (zona)   { whereClauses.push('de.zona = ?');   params.push(zona); }
    if (region) { whereClauses.push('de.region = ?'); params.push(region); }
    if (canal)  { whereClauses.push('ft.canal = ?');  params.push(canal); }

    const whereStr = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : '';

    const sql = `
      SELECT
        COUNT(DISTINCT ft.ejecutivo_id)                              AS total_ejecutivos_activos,
        COUNT(ft.transaccion_id)                                     AS total_transacciones,
        SUM(ft.monto)                                                AS monto_total_gestionado,
        ROUND(AVG(ABS(ft.monto)), 2)                                  AS ticket_promedio,
        ROUND(COUNT(ft.transaccion_id) / COUNT(DISTINCT ft.ejecutivo_id), 1) AS tx_por_ejecutivo,
        COUNT(DISTINCT ft.canal)                                     AS canales_usados
      FROM fact_transacciones ft
      JOIN dim_ejecutivos de ON ft.ejecutivo_id = de.ejecutivo_id
      ${whereStr};
    `;
    const [row] = await db.pool.query(sql, params);
    return row[0] || {};
  }

  /**
   * Catálogos de filtros disponibles (zonas, regiones, canales).
   */
  async getCatalogos() {
    const [zonas]    = await db.pool.query('SELECT DISTINCT zona FROM dim_ejecutivos WHERE zona IS NOT NULL ORDER BY zona');
    const [regiones] = await db.pool.query('SELECT DISTINCT region FROM dim_ejecutivos WHERE region IS NOT NULL ORDER BY region');
    const [canales]  = await db.pool.query('SELECT DISTINCT canal FROM fact_transacciones WHERE canal IS NOT NULL ORDER BY canal');

    return {
      zonas:    zonas.map(r => r.zona),
      regiones: regiones.map(r => r.region),
      canales:  canales.map(r => r.canal)
    };
  }

  /**
   * Perfil de un ejecutivo por coincidencia parcial de nombre.
   */
  async getPerfilEjecutivo(namePattern) {
    const sql = `SELECT * FROM dim_ejecutivos WHERE nombre_ejecutivo LIKE ? LIMIT 1`;
    return await db.query(sql, [namePattern]);
  }

  /**
   * Lista completa de ejecutivos.
   */
  async getListaEjecutivos() {
    const sql = `SELECT ejecutivo_id, nombre_ejecutivo, zona, region, sucursal_nombre FROM dim_ejecutivos ORDER BY nombre_ejecutivo ASC`;
    return await db.query(sql);
  }
}

module.exports = new DesempenoService();
