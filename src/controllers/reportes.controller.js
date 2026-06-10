const db = require('../config/database').pool;
const { successResponse, toDecimal } = require('../utils/formatter');

class ReportesController {

  /**
   * GET /api/reportes/cartera-activa
   * Objetivo: Saldo total de la cartera activa.
   * Agrupación: Por tipo de producto y por región.
   */
  async getCarteraActiva(req, res, next) {
    try {
      // Deducción de JOINs: Para obtener la cartera activa agrupada por tipo de producto y región,
      // unimos la tabla de hechos 'fact_posicion_cartera' (fpc) que contiene los saldos de cada cuenta
      // con la dimensión 'dim_productos' (dp) mediante 'producto_id' (para identificar el tipo_producto)
      // y la dimensión 'dim_ejecutivos' (de) mediante 'ejecutivo_id' (para obtener la región del ejecutivo asignado).
      const sql = `
        SELECT 
          dp.tipo_producto,
          de.region,
          SUM(fpc.saldo) AS saldo_total,
          COUNT(DISTINCT fpc.cuenta_id) AS total_cuentas
        FROM fact_posicion_cartera fpc
        JOIN dim_productos dp ON fpc.producto_id = dp.producto_id
        JOIN dim_ejecutivos de ON fpc.ejecutivo_id = de.ejecutivo_id
        GROUP BY dp.tipo_producto, de.region
        ORDER BY dp.tipo_producto, de.region;
      `;

      const [rows] = await db.query(sql);

      // Formatear los tipos de datos numéricos
      const formattedData = rows.map(row => ({
        tipo_producto: row.tipo_producto,
        region: row.region,
        saldo_total: toDecimal(row.saldo_total),
        total_cuentas: parseInt(row.total_cuentas, 10)
      }));

      // Metadatos consolidados
      const stats = {
        saldo_consolidado: toDecimal(formattedData.reduce((acc, row) => acc + row.saldo_total, 0)),
        cuentas_totales: formattedData.reduce((acc, row) => acc + row.total_cuentas, 0)
      };

      return res.json(successResponse(formattedData, 'Reporte de cartera activa obtenido con éxito.', stats));
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/reportes/actividad-transaccional
   * Objetivo: Volumen (cantidad de operaciones) y monto total.
   * Agrupación: Por canal y por período (mensual o trimestral).
   * Query params: periodo = 'mensual' | 'trimestral' (por defecto 'mensual')
   */
  async getActividadTransaccional(req, res, next) {
    try {
      const periodo = req.query.periodo === 'trimestral' ? 'trimestral' : 'mensual';

      // Expresión de agrupación temporal según el período solicitado
      let periodExpr = "DATE_FORMAT(ft.fecha_transaccion, '%Y-%m')";
      if (periodo === 'trimestral') {
        periodExpr = "CONCAT(YEAR(ft.fecha_transaccion), '-Q', QUARTER(ft.fecha_transaccion))";
      }

      // Deducción de JOINs: La tabla 'fact_transacciones' (ft) almacena toda la actividad transaccional
      // con su respectivo canal, fecha_transaccion y monto de cada operación. Por lo tanto, no
      // requiere JOINs con dimensiones para agregaciones generales por canal y tiempo.
      const sql = `
        SELECT 
          ${periodExpr} AS periodo,
          ft.canal,
          COUNT(ft.transaccion_id) AS cantidad_transacciones,
          SUM(ft.monto) AS monto_total
        FROM fact_transacciones ft
        GROUP BY periodo, ft.canal
        ORDER BY periodo DESC, cantidad_transacciones DESC;
      `;

      const [rows] = await db.query(sql);

      const formattedData = rows.map(row => ({
        periodo: row.periodo,
        canal: row.canal,
        cantidad_transacciones: parseInt(row.cantidad_transacciones, 10),
        monto_total: toDecimal(row.monto_total)
      }));

      const stats = {
        monto_consolidado: toDecimal(formattedData.reduce((acc, row) => acc + row.monto_total, 0)),
        total_operaciones: formattedData.reduce((acc, row) => acc + row.cantidad_transacciones, 0)
      };

      return res.json(successResponse(formattedData, `Reporte de actividad transaccional (${periodo}) obtenido con éxito.`, stats));
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/reportes/desempeno-ejecutivos
   * Objetivo: Transacciones gestionadas.
   * Agrupación: Por ejecutivo, zona y región.
   */
  async getDesempenoEjecutivos(req, res, next) {
    try {
      // Deducción de JOINs: Unimos la tabla de hechos 'fact_transacciones' (ft) con la dimensión
      // 'dim_ejecutivos' (de) mediante la clave foránea 'ejecutivo_id'. Esto nos permite asociar
      // las transacciones ejecutadas con el nombre, zona y región asignados al ejecutivo de cuenta.
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

      const [rows] = await db.query(sql);

      const formattedData = rows.map(row => ({
        ejecutivo_id: parseInt(row.ejecutivo_id, 10),
        nombre_ejecutivo: row.nombre_ejecutivo,
        zona: row.zona,
        region: row.region,
        cantidad_transacciones: parseInt(row.cantidad_transacciones, 10),
        monto_total_transacciones: toDecimal(row.monto_total_transacciones)
      }));

      return res.json(successResponse(formattedData, 'Reporte de desempeño de ejecutivos obtenido con éxito.'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/reportes/composicion-clientes
   * Objetivo: Distribución del portafolio de clientes.
   * Agrupación: Por segmento, tipo de persona (física/moral) y ciudad.
   */
  async getComposicionClientes(req, res, next) {
    try {
      // Deducción de JOINs: Toda la información de segmentación y atributos demográficos del cliente
      // (segmento, tipo_persona, ciudad) se encuentra almacenada directamente en la tabla de dimensión
      // 'dim_clientes'. Por lo tanto, no se requieren JOINs adicionales.
      const sql = `
        SELECT 
          segmento,
          tipo_persona,
          ciudad,
          COUNT(cliente_id) AS cantidad_clientes
        FROM dim_clientes
        GROUP BY segmento, tipo_persona, ciudad
        ORDER BY cantidad_clientes DESC;
      `;

      const [rows] = await db.query(sql);

      const formattedData = rows.map(row => ({
        segmento: row.segmento,
        tipo_persona: row.tipo_persona,
        ciudad: row.ciudad,
        cantidad_clientes: parseInt(row.cantidad_clientes, 10)
      }));

      const stats = {
        total_clientes: formattedData.reduce((acc, row) => acc + row.cantidad_clientes, 0)
      };

      return res.json(successResponse(formattedData, 'Reporte de composición de clientes obtenido con éxito.', stats));
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/reportes/mapa-riesgo
   * Objetivo: Análisis integral de riesgo crediticio por zona y región.
   * Detalles requeridos:
   *  - Distribución de la cartera por clasificación de riesgo (NORMAL, CPP, DEFICIENTE).
   *  - Número de cuentas y saldo promedio por dicha clasificación.
   *  - Volumen transaccional total (número de operaciones y monto acumulado) generado por los ejecutivos de esa zona durante el período.
   * Query params opcionales: fecha_inicio, fecha_fin (para delimitar el volumen transaccional en el tiempo)
   */
  async getMapaRiesgo(req, res, next) {
    try {
      const { fecha_inicio, fecha_fin } = req.query;
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

      // Deducción de JOINs:
      // 1. Unimos 'fact_posicion_cartera' (fpc) con 'dim_ejecutivos' (de) mediante 'ejecutivo_id' para agrupar
      //    la clasificación de riesgo por zona y región.
      // 2. Unimos con 'dim_productos' (dp) mediante 'producto_id' para filtrar exclusivamente
      //    productos activos de crédito (préstamos y tarjetas de crédito).
      // 3. Realizamos un LEFT JOIN con una subconsulta agrupada por zona y región sobre 'fact_transacciones' (ft)
      //    (unida también con 'dim_ejecutivos') para consolidar el volumen transaccional generado por los
      //    ejecutivos de esa misma zona y región geográfica en el período temporal indicado.
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
        GROUP BY de.zona, de.region, fpc.clasificacion_cartera, t.transacciones_volumen, t.transacciones_monto
        ORDER BY de.zona, de.region, FIELD(fpc.clasificacion_cartera, 'NORMAL', 'CPP', 'DEFICIENTE', 'DUDOSO', 'PERDIDA');
      `;

      const [rows] = await db.query(sql, queryParams);

      const formattedData = rows.map(row => ({
        zona: row.zona,
        region: row.region,
        clasificacion_cartera: row.clasificacion_cartera,
        total_cuentas: parseInt(row.total_cuentas, 10),
        saldo_total: toDecimal(row.saldo_total),
        saldo_promedio: toDecimal(row.saldo_promedio),
        transacciones_volumen: parseInt(row.transacciones_volumen, 10),
        transacciones_monto: toDecimal(row.transacciones_monto)
      }));

      const stats = {
        saldo_riesgo_total: toDecimal(formattedData.reduce((acc, row) => acc + row.saldo_total, 0)),
        cuentas_con_credito: formattedData.reduce((acc, row) => acc + row.total_cuentas, 0)
      };

      return res.json(successResponse(formattedData, 'Reporte de mapa de riesgo crediticio obtenido con éxito.', stats));
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ReportesController();
