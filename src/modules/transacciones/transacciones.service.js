const db = require('../../core/config/database');
const cache = require('../../core/services/cache.service');

class TransaccionesService {

  /**
   * Actividad transaccional simple: agrupada por periodo, canal y tipo de movimiento.
   */
  async getActividadTransaccional() {
    const sql = `
      SELECT 
        DATE_FORMAT(ft.fecha_transaccion, '%Y-%m') AS periodo,
        ft.canal,
        ft.tipo_movimiento,
        COUNT(ft.transaccion_id) AS cantidad_transacciones,
        SUM(ft.monto) AS monto_total
      FROM fact_transacciones ft
      GROUP BY periodo, ft.canal, ft.tipo_movimiento
      ORDER BY periodo DESC, cantidad_transacciones DESC;
    `;
    return await db.query(sql);
  }

  /**
   * Actividad transaccional filtrada con catálogos de valores únicos.
   */
  async getActividadTransaccionalFiltrada({ canal, sucursal, tipo, periodo } = {}) {
    const cacheKey = `transacciones:actividad:${canal || 'all'}:${sucursal || 'all'}:${tipo || 'all'}:${periodo || 'all'}`;
    
    // Intentar leer de caché
    const cachedData = await cache.get(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    let whereClauses = [];
    let params = [];

    if (canal) { whereClauses.push('ft.canal = ?'); params.push(canal); }
    if (sucursal) { whereClauses.push('de.sucursal_nombre = ?'); params.push(sucursal); }
    if (tipo) { whereClauses.push('ft.tipo_movimiento = ?'); params.push(tipo); }
    if (periodo) { whereClauses.push("DATE_FORMAT(ft.fecha_transaccion, '%Y-%m') = ?"); params.push(periodo); }

    const whereStr = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : '';

    // Optimización: Omitir LEFT JOIN si no se filtra por sucursal
    const joinStr = sucursal ? 'LEFT JOIN dim_ejecutivos de ON ft.ejecutivo_id = de.ejecutivo_id' : '';

    const sql = `
      SELECT 
        DATE_FORMAT(ft.fecha_transaccion, '%Y-%m') AS periodo,
        ft.canal,
        ft.tipo_movimiento,
        COUNT(ft.transaccion_id) AS cantidad_transacciones,
        SUM(ft.monto) AS monto_total
      FROM fact_transacciones ft
      ${joinStr}
      ${whereStr}
      GROUP BY periodo, ft.canal, ft.tipo_movimiento
      ORDER BY periodo DESC, cantidad_transacciones DESC;
    `;

    // Cargar la consulta principal y los catálogos en paralelo si los catálogos no están en caché
    const catalogCacheKey = 'transacciones:catalogos';
    let catalogos = await cache.get(catalogCacheKey);

    let rows;
    if (catalogos) {
      // Si los catálogos ya están cacheados, solo ejecutamos la consulta principal
      const [dbRows] = await db.pool.query(sql, params);
      rows = dbRows;
    } else {
      // Si no están en caché, cargamos todo en paralelo para reducir el impacto de latencia
      console.log('[TransaccionesService] Catálogos no encontrados en caché. Cargando todo en paralelo...');
      const [
        [dbRows],
        [canalesRows],
        [periodosRows],
        [sucursalesRows],
        [tiposRows]
      ] = await Promise.all([
        db.pool.query(sql, params),
        db.pool.query('SELECT DISTINCT canal FROM fact_transacciones WHERE canal IS NOT NULL ORDER BY canal'),
        db.pool.query("SELECT DISTINCT DATE_FORMAT(fecha_transaccion, '%Y-%m') AS periodo FROM fact_transacciones ORDER BY periodo DESC"),
        db.pool.query('SELECT DISTINCT sucursal_nombre FROM dim_ejecutivos WHERE sucursal_nombre IS NOT NULL ORDER BY sucursal_nombre'),
        db.pool.query('SELECT DISTINCT tipo_movimiento FROM fact_transacciones WHERE tipo_movimiento IS NOT NULL ORDER BY tipo_movimiento')
      ]);

      rows = dbRows;
      catalogos = {
        canales: canalesRows.map(r => r.canal),
        periodos: periodosRows.map(r => r.periodo),
        sucursales: sucursalesRows.map(r => r.sucursal_nombre),
        tipos: tiposRows.map(r => r.tipo_movimiento)
      };

      // Guardar catálogos en caché por 10 minutos (600 segundos)
      await cache.set(catalogCacheKey, catalogos, 600);
    }

    const result = {
      items: rows,
      ...catalogos
    };

    // Guardar el reporte filtrado en caché por 2 minutos (120 segundos)
    await cache.set(cacheKey, result, 120);

    return result;
  }

  /**
   * Resumen consolidado de KPIs del Dashboard con filtros opcionales.
   */
  async getResumenDashboard({ region, segmento, producto } = {}) {
    const cacheKey = `transacciones:resumen:${region || 'all'}:${segmento || 'all'}:${producto || 'all'}`;
    
    // Intentar leer de caché
    const cachedData = await cache.get(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    let result;

    // Sin filtros: consultas simples y rápidas
    if (!region && !segmento && !producto) {
      const summarySql = `
        SELECT 
          (SELECT COUNT(*) FROM dim_clientes) AS total_clientes,
          (SELECT COUNT(*) FROM dim_cuentas WHERE estatus = 'ACTIVA') AS total_cuentas_activas,
          (SELECT SUM(ABS(saldo)) FROM fact_posicion_cartera) AS cartera_total_saldo,
          (SELECT SUM(CASE WHEN saldo >= 0 THEN saldo ELSE 0 END) FROM fact_posicion_cartera) AS cartera_positivo_saldo,
          (SELECT SUM(CASE WHEN saldo < 0 THEN ABS(saldo) ELSE 0 END) FROM fact_posicion_cartera) AS cartera_negativo_saldo,
          (SELECT COUNT(*) FROM fact_transacciones) AS total_transacciones
      `;
      const [summary] = await db.query(summarySql);
      result = {
        total_clientes: summary ? summary.total_clientes : 0,
        total_cuentas_activas: summary ? summary.total_cuentas_activas : 0,
        cartera_total_saldo: summary ? parseFloat(summary.cartera_total_saldo || 0) : 0,
        cartera_positivo_saldo: summary ? parseFloat(summary.cartera_positivo_saldo || 0) : 0,
        cartera_negativo_saldo: summary ? parseFloat(summary.cartera_negativo_saldo || 0) : 0,
        total_transacciones: summary ? summary.total_transacciones : 0
      };
    } else {
      // Con filtros: consultas dinámicas con JOINs
      let whereClauses = [];
      let params = [];

      if (region) { whereClauses.push('de.region = ?'); params.push(region); }
      if (segmento) { whereClauses.push('dc.segmento = ?'); params.push(segmento); }
      if (producto) { whereClauses.push('dp.tipo_producto = ?'); params.push(producto); }

      const whereStr = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : '';

      const clientesSql = `
        SELECT COUNT(DISTINCT dc.cliente_id) AS count
        FROM dim_clientes dc
        LEFT JOIN fact_posicion_cartera fpc ON dc.cliente_id = fpc.cliente_id
        LEFT JOIN dim_ejecutivos de ON fpc.ejecutivo_id = de.ejecutivo_id
        LEFT JOIN dim_productos dp ON fpc.producto_id = dp.producto_id
        ${whereStr}
      `;
      const cuentasSql = `
        SELECT COUNT(DISTINCT dcu.cuenta_id) AS count
        FROM dim_cuentas dcu
        LEFT JOIN fact_posicion_cartera fpc ON dcu.cuenta_id = fpc.cuenta_id
        LEFT JOIN dim_ejecutivos de ON fpc.ejecutivo_id = de.ejecutivo_id
        LEFT JOIN dim_productos dp ON fpc.producto_id = dp.producto_id
        LEFT JOIN dim_clientes dc ON dcu.cliente_id = dc.cliente_id
        WHERE dcu.estatus = 'ACTIVA' ${whereClauses.length > 0 ? 'AND ' + whereClauses.join(' AND ') : ''}
      `;
      const saldoSql = `
        SELECT 
          SUM(ABS(fpc.saldo)) AS count,
          SUM(CASE WHEN fpc.saldo >= 0 THEN fpc.saldo ELSE 0 END) AS positivo,
          SUM(CASE WHEN fpc.saldo < 0 THEN ABS(fpc.saldo) ELSE 0 END) AS negativo
        FROM fact_posicion_cartera fpc
        LEFT JOIN dim_ejecutivos de ON fpc.ejecutivo_id = de.ejecutivo_id
        LEFT JOIN dim_productos dp ON fpc.producto_id = dp.producto_id
        LEFT JOIN dim_clientes dc ON fpc.cliente_id = dc.cliente_id
        ${whereStr}
      `;
      const transaccionesSql = `
        SELECT COUNT(DISTINCT ft.transaccion_id) AS count
        FROM fact_transacciones ft
        LEFT JOIN dim_ejecutivos de ON ft.ejecutivo_id = de.ejecutivo_id
        LEFT JOIN dim_cuentas dcu ON ft.cuenta_id = dcu.cuenta_id
        LEFT JOIN dim_productos dp ON dcu.producto_id = dp.producto_id
        LEFT JOIN dim_clientes dc ON dcu.cliente_id = dc.cliente_id
        ${whereStr}
      `;

      const [clientesRes] = await db.query(clientesSql, params);
      const [cuentasRes] = await db.query(cuentasSql, params);
      const [saldoRes] = await db.query(saldoSql, params);
      const [transaccionesRes] = await db.query(transaccionesSql, params);

      result = {
        total_clientes: clientesRes ? clientesRes.count : 0,
        total_cuentas_activas: cuentasRes ? cuentasRes.count : 0,
        cartera_total_saldo: saldoRes ? parseFloat(saldoRes.count || 0) : 0,
        cartera_positivo_saldo: saldoRes ? parseFloat(saldoRes.positivo || 0) : 0,
        cartera_negativo_saldo: saldoRes ? parseFloat(saldoRes.negativo || 0) : 0,
        total_transacciones: transaccionesRes ? transaccionesRes.count : 0
      };
    }

    // Guardar en caché por 2 minutos (120 segundos)
    await cache.set(cacheKey, result, 120);

    return result;
  }
}

module.exports = new TransaccionesService();
