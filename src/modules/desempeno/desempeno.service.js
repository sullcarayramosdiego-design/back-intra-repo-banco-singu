const db = require('../../core/config/database');

class DesempenoService {

  /**
   * Desempeño de ejecutivos: cuentas y saldos gestionados (desde fact_posicion_cartera).
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
   * Desempeño de ejecutivos: transacciones gestionadas (desde fact_transacciones).
   */
  async getDesempenoEjecutivosPorTransacciones() {
    const sql = `
      SELECT 
        de.ejecutivo_id,
        de.nombre_ejecutivo,
        de.zona,
        de.region,
        COUNT(ft.transaccion_id) AS cantidad_transacciones,
        SUM(ft.monto) AS monto_total_transacciones
      FROM fact_transacciones ft
      JOIN dim_ejecutivos de ON ft.ejecutivo_id = de.ejecutivo_id
      GROUP BY de.ejecutivo_id, de.nombre_ejecutivo, de.zona, de.region
      ORDER BY cantidad_transacciones DESC;
    `;
    const rows = await db.query(sql);
    return rows;
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
