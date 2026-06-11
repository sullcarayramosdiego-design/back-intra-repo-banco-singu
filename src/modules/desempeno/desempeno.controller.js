const desempenoService = require('./desempeno.service');
const { successResponse, toDecimal } = require('../../core/utils/formatter');

class DesempenoController {

  /** GET /api/reportes/ejecutivos — cartera gestionada */
  async getEjecutivos(req, res, next) {
    try {
      const dbData = await desempenoService.getDesempenioEjecutivos();
      const formattedData = dbData.map(row => ({
        ...row,
        saldo_total_gestionado: toDecimal(row.saldo_total_gestionado),
        saldo_absoluto_gestionado: toDecimal(row.saldo_absoluto_gestionado),
        total_cuentas_gestionadas: parseInt(row.total_cuentas_gestionadas, 10),
        saldo_promedio_cuenta: toDecimal(row.saldo_promedio_cuenta)
      }));
      return res.json(successResponse(formattedData, 'Reporte de desempeño de ejecutivos obtenido con éxito.'));
    } catch (error) { next(error); }
  }

  /** GET /api/reportes/desempeno-ejecutivos — ranking por transacciones */
  async getDesempenoEjecutivos(req, res, next) {
    try {
      const { zona, region, canal, top, ejecutivo_id } = req.query;
      const rows = await desempenoService.getRankingEjecutivos({ zona, region, canal, top, ejecutivo_id });
      const formattedData = rows.map(row => ({
        ejecutivo_id:           parseInt(row.ejecutivo_id, 10),
        nombre_ejecutivo:       row.nombre_ejecutivo,
        zona:                   row.zona,
        region:                 row.region,
        sucursal_nombre:        row.sucursal_nombre,
        cantidad_transacciones: parseInt(row.cantidad_transacciones, 10),
        monto_total:            toDecimal(row.monto_total),
        monto_credito:          toDecimal(row.monto_credito),
        monto_debito:           toDecimal(row.monto_debito),
        tx_credito:             parseInt(row.tx_credito, 10),
        tx_debito:              parseInt(row.tx_debito, 10),
        ticket_promedio:        toDecimal(row.ticket_promedio)
      }));
      return res.json(successResponse(formattedData, 'Ranking de ejecutivos por transacciones obtenido con éxito.'));
    } catch (error) { next(error); }
  }

  /** GET /api/reportes/desempeno/kpis — KPIs resumen */
  async getKpis(req, res, next) {
    try {
      const { zona, region, canal, ejecutivo_id } = req.query;
      const row = await desempenoService.getKpisDesempeno({ zona, region, canal, ejecutivo_id });
      return res.json(successResponse({
        total_ejecutivos_activos: parseInt(row.total_ejecutivos_activos, 10) || 0,
        total_transacciones:      parseInt(row.total_transacciones, 10) || 0,
        monto_total_gestionado:   toDecimal(row.monto_total_gestionado),
        ticket_promedio:          toDecimal(row.ticket_promedio),
        tx_por_ejecutivo:         toDecimal(row.tx_por_ejecutivo),
        canales_usados:           parseInt(row.canales_usados, 10) || 0
      }, 'KPIs de desempeño obtenidos con éxito.'));
    } catch (error) { next(error); }
  }

  /** GET /api/reportes/desempeno/por-zona — agrupado por zona */
  async getPorZona(req, res, next) {
    try {
      const { zona, canal, region, ejecutivo_id } = req.query;
      const rows = await desempenoService.getTransaccionesPorZona({ zona, canal, region, ejecutivo_id });
      const formattedData = rows.map(row => ({
        zona:                   row.zona,
        region:                 row.region,
        cantidad_transacciones: parseInt(row.cantidad_transacciones, 10),
        monto_total:            toDecimal(row.monto_total),
        total_ejecutivos:       parseInt(row.total_ejecutivos, 10),
        ticket_promedio:        toDecimal(row.ticket_promedio)
      }));
      return res.json(successResponse(formattedData, 'Transacciones por zona obtenidas con éxito.'));
    } catch (error) { next(error); }
  }

  /** GET /api/reportes/desempeno/evolucion — evolución mensual por zona */
  async getEvolucion(req, res, next) {
    try {
      const { zona, region, canal, ejecutivo_id } = req.query;
      const rows = await desempenoService.getEvolucionMensual({ zona, region, canal, ejecutivo_id });
      const formattedData = rows.map(row => ({
        periodo:                row.periodo,
        zona:                   row.zona,
        cantidad_transacciones: parseInt(row.cantidad_transacciones, 10),
        monto_total:            toDecimal(row.monto_total),
        ejecutivos_activos:     parseInt(row.ejecutivos_activos, 10)
      }));
      return res.json(successResponse(formattedData, 'Evolución mensual obtenida con éxito.'));
    } catch (error) { next(error); }
  }

  /** GET /api/reportes/desempeno/canales — distribución por canal */
  async getCanales(req, res, next) {
    try {
      const { zona, region, ejecutivo_id } = req.query;
      const rows = await desempenoService.getDistribucionCanal({ zona, region, ejecutivo_id });
      const formattedData = rows.map(row => ({
        canal:                  row.canal,
        cantidad_transacciones: parseInt(row.cantidad_transacciones, 10),
        monto_total:            toDecimal(row.monto_total),
        porcentaje:             toDecimal(row.porcentaje)
      }));
      return res.json(successResponse(formattedData, 'Distribución por canal obtenida con éxito.'));
    } catch (error) { next(error); }
  }

  /** GET /api/reportes/desempeno/catalogos — filtros disponibles */
  async getCatalogos(req, res, next) {
    try {
      const catalogos = await desempenoService.getCatalogos();
      return res.json(successResponse(catalogos, 'Catálogos de filtros obtenidos con éxito.'));
    } catch (error) { next(error); }
  }

  /** GET /api/empleados/perfil */
  async getPerfil(req, res, next) {
    try {
      const userPayload = req.auth;
      const namePattern = `%${userPayload.name || ''}%`;
      const [ejecutivo] = await desempenoService.getPerfilEjecutivo(namePattern);
      return res.json(successResponse({ ...userPayload, datos_ejecutivo: ejecutivo || null }, 'Perfil del empleado obtenido exitosamente.'));
    } catch (error) { next(error); }
  }

  /** GET /api/empleados/lista */
  async getEjecutivosList(req, res, next) {
    try {
      const ejecutivos = await desempenoService.getListaEjecutivos();
      return res.json(successResponse(ejecutivos, 'Lista de ejecutivos obtenida con éxito.'));
    } catch (error) { next(error); }
  }
}

module.exports = new DesempenoController();
