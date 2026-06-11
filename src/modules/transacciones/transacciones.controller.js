const transaccionesService = require('./transacciones.service');
const { successResponse, toDecimal } = require('../../core/utils/formatter');
const { parseReporteFilters, parseTransaccionFilters } = require('../../shared/validators/query-validators');

class TransaccionesController {

  /**
   * GET /api/reportes/resumen
   * Resumen consolidado de KPIs del Dashboard (con filtros opcionales)
   */
  async getResumen(req, res, next) {
    try {
      const { region, segmento, producto } = parseReporteFilters(req.query);
      const data = await transaccionesService.getResumenDashboard({ region, segmento, producto });
      return res.json(successResponse(data, 'Resumen consolidado del Dashboard obtenido con éxito.'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/reportes/transacciones
   * Actividad transaccional simple (agrupada por periodo, canal, tipo)
   */
  async getTransacciones(req, res, next) {
    try {
      const dbData = await transaccionesService.getActividadTransaccional();

      const formattedData = dbData.map(row => ({
        ...row,
        cantidad_transacciones: parseInt(row.cantidad_transacciones, 10),
        monto_total: toDecimal(row.monto_total)
      }));

      const stats = {
        monto_consolidado: toDecimal(formattedData.reduce((acc, row) => acc + row.monto_total, 0)),
        total_operaciones: formattedData.reduce((acc, row) => acc + row.cantidad_transacciones, 0)
      };

      return res.json(successResponse(formattedData, 'Reporte de actividad transaccional obtenido con éxito.', stats));
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/reportes/actividad-transaccional
   * Actividad transaccional con filtros y catálogos de valores únicos
   */
  async getActividadTransaccional(req, res, next) {
    try {
      const { canal, sucursal, tipo, periodo } = parseTransaccionFilters(req.query);
      const result = await transaccionesService.getActividadTransaccionalFiltrada({ canal, sucursal, tipo, periodo });

      const formattedItems = result.items.map(row => ({
        periodo: row.periodo,
        canal: row.canal,
        tipo_movimiento: row.tipo_movimiento,
        cantidad_transacciones: parseInt(row.cantidad_transacciones, 10),
        monto_total: toDecimal(row.monto_total)
      }));

      const stats = {
        monto_consolidado: toDecimal(formattedItems.reduce((acc, row) => acc + row.monto_total, 0)),
        total_operaciones: formattedItems.reduce((acc, row) => acc + row.cantidad_transacciones, 0)
      };

      return res.json(successResponse(
        {
          items: formattedItems,
          canales: result.canales,
          periodos: result.periodos,
          sucursales: result.sucursales,
          tipos: result.tipos
        },
        'Reporte de actividad transaccional obtenido con éxito.',
        stats
      ));
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new TransaccionesController();
