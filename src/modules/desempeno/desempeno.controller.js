const desempenoService = require('./desempeno.service');
const { successResponse, toDecimal } = require('../../core/utils/formatter');

class DesempenoController {

  /**
   * GET /api/reportes/ejecutivos
   * Desempeño de ejecutivos (cartera gestionada, desde kpi.service)
   */
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
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/reportes/desempeno-ejecutivos
   * Desempeño de ejecutivos filtrado (transacciones gestionadas)
   */
  async getDesempenoEjecutivos(req, res, next) {
    try {
      const rows = await desempenoService.getDesempenoEjecutivosPorTransacciones();

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
   * GET /api/empleados/perfil
   * Perfil del ejecutivo autenticado (extraído del JWT)
   */
  async getPerfil(req, res, next) {
    try {
      const userPayload = req.auth;
      const namePattern = `%${userPayload.name || ''}%`;
      const [ejecutivo] = await desempenoService.getPerfilEjecutivo(namePattern);

      const perfil = {
        ...userPayload,
        datos_ejecutivo: ejecutivo || null
      };

      return res.json(successResponse(perfil, 'Perfil del empleado obtenido exitosamente.'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/empleados/lista
   * Lista completa de ejecutivos registrados
   */
  async getEjecutivosList(req, res, next) {
    try {
      const ejecutivos = await desempenoService.getListaEjecutivos();
      return res.json(successResponse(ejecutivos, 'Lista de ejecutivos obtenida con éxito.'));
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new DesempenoController();
