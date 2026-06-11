const riesgosService = require('./riesgos.service');
const { successResponse, toDecimal } = require('../../core/utils/formatter');
const { parseRiesgoFilters } = require('../../shared/validators/query-validators');

class RiesgosController {

  /**
   * GET /api/reportes/riesgo
   * Mapa de riesgo básico (clasificación por zona y región)
   */
  async getRiesgo(req, res, next) {
    try {
      const dbData = await riesgosService.getMapaRiesgoCrediticio();

      const formattedData = dbData.map(row => ({
        ...row,
        saldo_riesgo: toDecimal(row.saldo_riesgo),
        cantidad_cuentas: parseInt(row.cantidad_cuentas, 10)
      }));

      const stats = {
        saldo_riesgo_total: toDecimal(formattedData.reduce((acc, row) => acc + row.saldo_riesgo, 0)),
        cuentas_con_credito: formattedData.reduce((acc, row) => acc + row.cantidad_cuentas, 0)
      };

      return res.json(successResponse(formattedData, 'Reporte de mapa de riesgo crediticio obtenido con éxito.', stats));
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/reportes/mapa-riesgo
   * Mapa de riesgo integral con volumen transaccional y filtros de fecha
   */
  async getMapaRiesgo(req, res, next) {
    try {
      const { fecha_inicio, fecha_fin } = parseRiesgoFilters(req.query);
      const rows = await riesgosService.getMapaRiesgoIntegral({ fecha_inicio, fecha_fin });

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

module.exports = new RiesgosController();
