const kpiService = require('../services/kpi.service');
const { successResponse, toDecimal } = require('../utils/formatter');

class ReporteController {
  
  async getResumen(req, res, next) {
    try {
      const { region, segmento, producto } = req.query;
      const data = await kpiService.getResumenDashboard({ region, segmento, producto });
      return res.json(successResponse(data, 'Resumen consolidado del Dashboard obtenido con éxito.'));
    } catch (error) {
      next(error);
    }
  }

  async getCartera(req, res, next) {
    try {
      const dbData = await kpiService.getCarteraActiva();
      
      // Mapear saldos a números de punto flotante limpios
      const formattedData = dbData.map(row => ({
        ...row,
        saldo_total: toDecimal(row.saldo_total),
        total_cuentas: parseInt(row.total_cuentas, 10)
      }));

      // Metadatos adicionales para facilitar el renderizado en el Dashboard
      const stats = {
        saldo_consolidado: toDecimal(formattedData.reduce((acc, row) => acc + row.saldo_total, 0)),
        cuentas_totales: formattedData.reduce((acc, row) => acc + row.total_cuentas, 0)
      };

      return res.json(successResponse(formattedData, 'Reporte de cartera activa obtenido con éxito.', stats));
    } catch (error) {
      next(error);
    }
  }

  async getTransacciones(req, res, next) {
    try {
      const dbData = await kpiService.getActividadTransaccional();
      
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

  async getEjecutivos(req, res, next) {
    try {
      const dbData = await kpiService.getDesempenioEjecutivos();

      const formattedData = dbData.map(row => ({
        ...row,
        saldo_total_gestionado: toDecimal(row.saldo_total_gestionado),
        total_cuentas_gestionadas: parseInt(row.total_cuentas_gestionadas, 10),
        saldo_promedio_cuenta: toDecimal(row.saldo_promedio_cuenta)
      }));

      return res.json(successResponse(formattedData, 'Reporte de desempeño de ejecutivos obtenido con éxito.'));
    } catch (error) {
      next(error);
    }
  }

  async getClientes(req, res, next) {
    try {
      const dbData = await kpiService.getComposicionClientes();

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

  async getRiesgo(req, res, next) {
    try {
      const dbData = await kpiService.getMapaRiesgoCrediticio();

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
}

module.exports = new ReporteController();
