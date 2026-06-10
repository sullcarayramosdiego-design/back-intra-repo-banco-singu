const db = require('../config/database');

/**
 * Servicio encargado de realizar las consultas analíticas del Star Schema
 * adaptadas al dataset real.
 */
class KpiService {
  
  /**
   * Obtiene la cartera activa (saldos y cantidades de cuentas por producto, región y zona).
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
   * Obtiene la actividad transaccional agrupada por periodo (año-mes), canal y tipo de movimiento.
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
   * Obtiene el desempeño de los ejecutivos en base a las cuentas y saldos asignados actualmente.
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
   * Obtiene la distribución y composición de clientes por tipo (persona natural/jurídica) y segmento.
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
   * Obtiene el mapa de riesgo crediticio para productos activos (préstamos/créditos)
   * agrupado por zona, región y clasificación de riesgo del último corte.
   */
  async getMapaRiesgoCrediticio() {
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
    return await db.query(sql);
  }

  /**
   * Obtiene un resumen consolidado de KPIs clave para mostrar tarjetas generales en el Dashboard.
   */
  async getResumenDashboard() {
    const summarySql = `
      SELECT 
        (SELECT COUNT(*) FROM dim_clientes) AS total_clientes,
        (SELECT COUNT(*) FROM dim_cuentas WHERE estatus = 'ACTIVA') AS total_cuentas_activas,
        (SELECT SUM(ABS(saldo)) FROM fact_posicion_cartera) AS cartera_total_saldo,
        (SELECT COUNT(*) FROM fact_transacciones) AS total_transacciones
    `;
    
    const [summary] = await db.query(summarySql);
    return {
      total_clientes: summary ? summary.total_clientes : 0,
      total_cuentas_activas: summary ? summary.total_cuentas_activas : 0,
      cartera_total_saldo: summary ? parseFloat(summary.cartera_total_saldo || 0) : 0,
      total_transacciones: summary ? summary.total_transacciones : 0
    };
  }
}

module.exports = new KpiService();
