const db = require('../../core/config/database');
const cache = require('../../core/services/cache.service');

class CarteraService {

  /**
   * Cartera activa: saldos por producto, zona y región.
   */
  async getCarteraActiva() {
    const cacheKey = 'cartera:activa:global';
    const cachedData = await cache.get(cacheKey);
    if (cachedData) {
      return cachedData;
    }

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
    const result = await db.query(sql);
    await cache.set(cacheKey, result, 300); // Cachear por 5 minutos
    return result;
  }

  /**
   * Cartera activa filtrada: saldo por tipo de producto y región con filtros opcionales.
   */
  async getCarteraActivaFiltrada({ region, segmento, producto } = {}) {
    const cacheKey = `cartera:activa:filtrada:${region || 'all'}:${segmento || 'all'}:${producto || 'all'}`;
    const cachedData = await cache.get(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    let whereClauses = [];
    let params = [];

    if (region) { whereClauses.push('de.region = ?'); params.push(region); }
    if (segmento) { whereClauses.push('dc.segmento = ?'); params.push(segmento); }
    if (producto) { whereClauses.push('dp.tipo_producto = ?'); params.push(producto); }

    const whereStr = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : '';

    // Optimización: Omitir JOIN con dim_clientes si no se filtra por segmento
    const clientJoin = segmento ? 'JOIN dim_clientes dc ON fpc.cliente_id = dc.cliente_id' : '';

    const sql = `
      SELECT 
        dp.tipo_producto,
        de.region,
        SUM(ABS(fpc.saldo)) AS saldo_total,
        COUNT(DISTINCT fpc.cuenta_id) AS total_cuentas
      FROM fact_posicion_cartera fpc
      JOIN dim_productos dp ON fpc.producto_id = dp.producto_id
      JOIN dim_ejecutivos de ON fpc.ejecutivo_id = de.ejecutivo_id
      ${clientJoin}
      ${whereStr}
      GROUP BY dp.tipo_producto, de.region
      ORDER BY dp.tipo_producto, de.region;
    `;

    const [rows] = await db.pool.query(sql, params);
    await cache.set(cacheKey, rows, 120); // Cachear por 2 minutos
    return rows;
  }

  /**
   * Composición de clientes: distribución por tipo de persona y segmento.
   */
  async getComposicionClientes() {
    const cacheKey = 'cartera:composicion:global';
    const cachedData = await cache.get(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    const sql = `
      SELECT 
        tipo_persona,
        segmento,
        COUNT(cliente_id) AS cantidad_clientes
      FROM dim_clientes
      GROUP BY tipo_persona, segmento
      ORDER BY cantidad_clientes DESC;
    `;
    const result = await db.query(sql);
    await cache.set(cacheKey, result, 300); // Cachear por 5 minutos
    return result;
  }

  /**
   * Composición de clientes filtrada por región, segmento y producto.
   */
  async getComposicionClientesFiltrada({ region, segmento, producto } = {}) {
    const cacheKey = `cartera:composicion:filtrada:${region || 'all'}:${segmento || 'all'}:${producto || 'all'}`;
    const cachedData = await cache.get(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    let whereClauses = [];
    let params = [];

    if (region) { whereClauses.push('de.region = ?'); params.push(region); }
    if (segmento) { whereClauses.push('dc.segmento = ?'); params.push(segmento); }
    if (producto) { whereClauses.push('dp.tipo_producto = ?'); params.push(producto); }

    const whereStr = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : '';

    // Optimización: Omitir JOINs innecesarios si no hay filtros aplicados
    const ejecutivoJoin = region ? 'LEFT JOIN dim_ejecutivos de ON fpc.ejecutivo_id = de.ejecutivo_id' : '';
    const productoJoin = producto ? 'LEFT JOIN dim_productos dp ON fpc.producto_id = dp.producto_id' : '';
    
    // Solo unimos fact_posicion_cartera si se filtra por región o producto
    const needsFactTable = region || producto;
    const factJoin = needsFactTable ? 'LEFT JOIN fact_posicion_cartera fpc ON dc.cliente_id = fpc.cliente_id' : '';

    const sql = `
      SELECT 
        dc.segmento,
        dc.tipo_persona,
        dc.ciudad,
        COUNT(DISTINCT dc.cliente_id) AS cantidad_clientes
      FROM dim_clientes dc
      ${factJoin}
      ${ejecutivoJoin}
      ${productoJoin}
      ${whereStr}
      GROUP BY dc.segmento, dc.tipo_persona, dc.ciudad
      ORDER BY cantidad_clientes DESC;
    `;

    const [rows] = await db.pool.query(sql, params);
    await cache.set(cacheKey, rows, 120); // Cachear por 2 minutos
    return rows;
  }
}

module.exports = new CarteraService();
