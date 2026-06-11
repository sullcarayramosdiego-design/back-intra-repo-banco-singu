const db = require('../../core/config/database');
const cache = require('../../core/services/cache.service');

class RiesgosService {

  /**
   * Mapa de riesgo crediticio básico: clasificación de cartera por zona y región.
   */
  async getMapaRiesgoCrediticio() {
    const cacheKey = 'riesgos:mapa-crediticio';
    const cachedData = await cache.get(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    const sql = `
      SELECT 
        de.zona,
        de.region,
        fpc.clasificacion_cartera,
        SUM(ABS(fpc.saldo)) AS saldo_riesgo,
        COUNT(DISTINCT fpc.cuenta_id) AS cantidad_cuentas
      FROM fact_posicion_cartera fpc
      JOIN dim_productos dp ON fpc.producto_id = dp.producto_id
      JOIN dim_ejecutivos de ON fpc.ejecutivo_id = de.ejecutivo_id
      WHERE dp.tipo_producto IN ('CREDITO_PERSONAL', 'TARJETA_CREDITO', 'HIPOTECARIO', 'CREDITO_AUTO', 'CREDITO_PYME')
        AND fpc.clasificacion_cartera IS NOT NULL
      GROUP BY de.zona, de.region, fpc.clasificacion_cartera
      ORDER BY de.zona, de.region, 
        FIELD(fpc.clasificacion_cartera, 'NORMAL', 'CPP', 'DEFICIENTE', 'DUDOSO', 'PERDIDA');
    `;
    const result = await db.query(sql);
    await cache.set(cacheKey, result, 300); // Cachear por 5 minutos
    return result;
  }

  /**
   * Mapa de riesgo integral con volumen transaccional por zona/región
   * y filtros opcionales de fechas.
   */
  async getMapaRiesgoIntegral({ fecha_inicio, fecha_fin } = {}) {
    const cacheKey = `riesgos:mapa-integral:${fecha_inicio || 'all'}:${fecha_fin || 'all'}`;
    const cachedData = await cache.get(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    const queryParams = [];
    let dateFilter = '';

    if (fecha_inicio) {
      dateFilter += ' AND ft.fecha_transaccion >= ?';
      queryParams.push(fecha_inicio);
    }
    if (fecha_fin) {
      dateFilter += ' AND ft.fecha_transaccion <= ?';
      queryParams.push(fecha_fin);
    }

    const sql = `
      SELECT 
        de.zona,
        de.region,
        fpc.clasificacion_cartera,
        COUNT(DISTINCT fpc.cuenta_id) AS total_cuentas,
        SUM(fpc.saldo) AS saldo_total,
        AVG(fpc.saldo) AS saldo_promedio,
        COALESCE(t.transacciones_volumen, 0) AS transacciones_volumen,
        COALESCE(t.transacciones_monto, 0) AS transacciones_monto
      FROM fact_posicion_cartera fpc
      JOIN dim_ejecutivos de ON fpc.ejecutivo_id = de.ejecutivo_id
      JOIN dim_productos dp ON fpc.producto_id = dp.producto_id
      LEFT JOIN (
        SELECT 
          de_sub.zona,
          de_sub.region,
          COUNT(ft.transaccion_id) AS transacciones_volumen,
          SUM(ft.monto) AS transacciones_monto
        FROM fact_transacciones ft
        JOIN dim_ejecutivos de_sub ON ft.ejecutivo_id = de_sub.ejecutivo_id
        WHERE 1=1 ${dateFilter}
        GROUP BY de_sub.zona, de_sub.region
      ) t ON de.zona = t.zona AND de.region = t.region
      WHERE dp.tipo_producto IN ('CREDITO_PERSONAL', 'TARJETA_CREDITO', 'HIPOTECARIO', 'CREDITO_AUTO', 'CREDITO_PYME')
        AND fpc.clasificacion_cartera IS NOT NULL
      GROUP BY de.zona, de.region, fpc.clasificacion_cartera
      ORDER BY de.zona, de.region, FIELD(fpc.clasificacion_cartera, 'NORMAL', 'CPP', 'DEFICIENTE', 'DUDOSO', 'PERDIDA');
    `;

    const rows = await db.query(sql, queryParams);
    await cache.set(cacheKey, rows, 120); // Cachear por 2 minutos
    return rows;
  }
}

module.exports = new RiesgosService();
