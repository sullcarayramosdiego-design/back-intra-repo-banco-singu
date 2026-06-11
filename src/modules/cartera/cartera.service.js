const db = require('../../core/config/database');

class CarteraService {

  /**
   * Cartera activa: saldos por producto, zona y región.
   */
  async getCarteraActiva() {
    const sql = `
      SELECT 
        dp.producto_id,
        dp.nombre_producto,
        dp.tipo_producto,
        de.zona,
        de.region,
        SUM(fpc.saldo) AS saldo_total,
        SUM(ABS(fpc.saldo)) AS saldo_absoluto,
        COUNT(DISTINCT fpc.cuenta_id) AS total_cuentas
      FROM fact_posicion_cartera fpc
      JOIN dim_productos dp ON fpc.producto_id = dp.producto_id
      JOIN dim_ejecutivos de ON fpc.ejecutivo_id = de.ejecutivo_id
      GROUP BY dp.producto_id, dp.nombre_producto, dp.tipo_producto, de.zona, de.region
      ORDER BY de.zona, de.region, saldo_absoluto DESC;
    `;
    return await db.query(sql);
  }

  /**
   * Cartera activa filtrada: saldo por tipo de producto y región con filtros opcionales.
   */
  async getCarteraActivaFiltrada({ region, segmento, producto } = {}) {
    let whereClauses = [];
    let params = [];

    if (region) { whereClauses.push('de.region = ?'); params.push(region); }
    if (segmento) { whereClauses.push('dc.segmento = ?'); params.push(segmento); }
    if (producto) { whereClauses.push('dp.tipo_producto = ?'); params.push(producto); }

    const whereStr = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : '';

    const sql = `
      SELECT 
        dp.tipo_producto,
        de.region,
        SUM(ABS(fpc.saldo)) AS saldo_total,
        COUNT(DISTINCT fpc.cuenta_id) AS total_cuentas
      FROM fact_posicion_cartera fpc
      JOIN dim_productos dp ON fpc.producto_id = dp.producto_id
      JOIN dim_ejecutivos de ON fpc.ejecutivo_id = de.ejecutivo_id
      JOIN dim_clientes dc ON fpc.cliente_id = dc.cliente_id
      ${whereStr}
      GROUP BY dp.tipo_producto, de.region
      ORDER BY dp.tipo_producto, de.region;
    `;

    const [rows] = await db.pool.query(sql, params);
    return rows;
  }

  /**
   * Composición de clientes: distribución por tipo de persona y segmento.
   */
  async getComposicionClientes() {
    const sql = `
      SELECT 
        tipo_persona,
        segmento,
        COUNT(cliente_id) AS cantidad_clientes
      FROM dim_clientes
      GROUP BY tipo_persona, segmento
      ORDER BY cantidad_clientes DESC;
    `;
    return await db.query(sql);
  }

  /**
   * Composición de clientes filtrada por región, segmento y producto.
   */
  async getComposicionClientesFiltrada({ region, segmento, producto } = {}) {
    let whereClauses = [];
    let params = [];

    if (region) { whereClauses.push('de.region = ?'); params.push(region); }
    if (segmento) { whereClauses.push('dc.segmento = ?'); params.push(segmento); }
    if (producto) { whereClauses.push('dp.tipo_producto = ?'); params.push(producto); }

    const whereStr = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : '';

    const sql = `
      SELECT 
        dc.segmento,
        dc.tipo_persona,
        dc.ciudad,
        COUNT(DISTINCT dc.cliente_id) AS cantidad_clientes
      FROM dim_clientes dc
      LEFT JOIN fact_posicion_cartera fpc ON dc.cliente_id = fpc.cliente_id
      LEFT JOIN dim_ejecutivos de ON fpc.ejecutivo_id = de.ejecutivo_id
      LEFT JOIN dim_productos dp ON fpc.producto_id = dp.producto_id
      ${whereStr}
      GROUP BY dc.segmento, dc.tipo_persona, dc.ciudad
      ORDER BY cantidad_clientes DESC;
    `;

    const [rows] = await db.pool.query(sql, params);
    return rows;
  }
}

module.exports = new CarteraService();
