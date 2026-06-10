const db = require('../config/database');
const { successResponse } = require('../utils/formatter');

class EmpleadoController {
  
  /**
   * Obtiene la información del perfil del empleado autenticado (extraído del JWT)
   */
  async getPerfil(req, res, next) {
    try {
      const userPayload = req.auth; // Inyectado por el middleware de autenticación
      
      // Intentar buscar detalles adicionales en la BD si existe el mapeo por email/sub
      const sql = `SELECT * FROM dim_ejecutivos WHERE nombre_ejecutivo LIKE ? LIMIT 1`;
      // Usar el nombre o correo del token para buscar un ejecutivo coincidente
      const namePattern = `%${userPayload.name || ''}%`;
      const [ejecutivo] = await db.query(sql, [namePattern]);

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
   * Obtiene la lista completa de ejecutivos/empleados
   */
  async getEjecutivosList(req, res, next) {
    try {
      const sql = `SELECT * FROM dim_ejecutivos ORDER BY nombre ASC`;
      const ejecutivos = await db.query(sql);
      return res.json(successResponse(ejecutivos, 'Lista de ejecutivos obtenida con éxito.'));
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new EmpleadoController();
