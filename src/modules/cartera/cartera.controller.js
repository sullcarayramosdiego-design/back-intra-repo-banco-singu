const carteraService = require('./cartera.service');
const { successResponse, toDecimal } = require('../../core/utils/formatter');
const { parseReporteFilters } = require('../../shared/validators/query-validators');

class CarteraController {

  /**
   * GET /api/reportes/cartera
   * Cartera activa (básica, desde kpi.service)
   */
  async getCartera(req, res, next) {
    try {
      const dbData = await carteraService.getCarteraActiva();

      const formattedData = dbData.map(row => ({
        ...row,
        saldo_total: toDecimal(row.saldo_total),
        saldo_absoluto: toDecimal(row.saldo_absoluto),
        total_cuentas: parseInt(row.total_cuentas, 10)
      }));

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
   * GET /api/reportes/cartera-activa
   * Cartera activa filtrada por región, segmento y/o producto
   */
  async getCarteraActiva(req, res, next) {
    try {
      const { region, segmento, producto } = parseReporteFilters(req.query);
      const rows = await carteraService.getCarteraActivaFiltrada({ region, segmento, producto });

      const formattedData = rows.map(row => ({
        tipo_producto: row.tipo_producto,
        region: row.region,
        saldo_total: toDecimal(row.saldo_total),
        total_cuentas: parseInt(row.total_cuentas, 10)
      }));

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
   * GET /api/reportes/clientes
   * Composición de clientes (básica)
   */
  async getClientes(req, res, next) {
    try {
      const dbData = await carteraService.getComposicionClientes();

      const formattedData = dbData.map(row => ({
        ...row,
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
   * GET /api/reportes/composicion-clientes
   * Composición de clientes filtrada por región, segmento y/o producto
   */
  async getComposicionClientes(req, res, next) {
    try {
      const { region, segmento, producto } = parseReporteFilters(req.query);
      const rows = await carteraService.getComposicionClientesFiltrada({ region, segmento, producto });

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
}

module.exports = new CarteraController();
