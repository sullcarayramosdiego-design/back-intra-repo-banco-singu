const jwt = require('jsonwebtoken');
const db = require('../../core/config/database');
const { successResponse } = require('../../core/utils/formatter');

class AuthController {
  /**
   * Endpoint de autenticación simulada (Mock Login) para desarrollo local
   */
  async login(req, res, next) {
    try {
      const { username, password } = req.body;

      if (!username) {
        return res.status(400).json({
          status: 'error',
          code: 'BAD_REQUEST',
          message: 'El nombre de usuario es obligatorio.'
        });
      }

      console.log(`[Auth-Mock] Intentando iniciar sesión local para usuario: ${username}`);

      // Intentar buscar el ejecutivo en la base de datos por coincidencia parcial de nombre
      const sql = `SELECT * FROM dim_ejecutivos WHERE nombre_ejecutivo LIKE ? LIMIT 1`;
      const namePattern = `%${username}%`;
      const rows = await db.query(sql, [namePattern]);
      const ejecutivo = rows && rows.length > 0 ? rows[0] : null;

      let userPayload;
      if (ejecutivo) {
        console.log(`[Auth-Mock] Mapeado con ejecutivo ID ${ejecutivo.ejecutivo_id}: ${ejecutivo.nombre_ejecutivo}`);
        userPayload = {
          sub: `mock-ejecutivo-${ejecutivo.ejecutivo_id}`,
          name: ejecutivo.nombre_ejecutivo,
          email: `${username.toLowerCase().replace(/\s+/g, '.')}@confianza.pe`,
          realm_access: { roles: ['admin', 'ejecutivo'] }
        };
      } else {
        console.log(`[Auth-Mock] No se encontró ejecutivo. Usando datos ingresados con perfil mock por defecto.`);
        userPayload = {
          sub: 'mock-ejecutivo-default',
          name: username,
          email: `${username.toLowerCase().replace(/\s+/g, '.')}@confianza.pe`,
          realm_access: { roles: ['admin', 'ejecutivo'] }
        };
      }

      const devSecret = process.env.JWT_DEV_SECRET || 'super-secret-development-key-for-local-testing';
      const devAudience = process.env.JWT_AUDIENCE || 'account';
      const devIssuer = process.env.JWT_ISSUER || 'https://keycloak.dsr124.xyz/realms/banco-singular';

      // Firmar token usando algoritmo simétrico HS256 y la clave secreta de desarrollo
      const token = jwt.sign(userPayload, devSecret, {
        algorithm: 'HS256',
        audience: devAudience,
        issuer: devIssuer,
        expiresIn: '24h'
      });

      console.log(`[Auth-Mock] JWT HS256 generado exitosamente para: ${userPayload.name}`);

      const responseData = {
        id: userPayload.sub,
        name: userPayload.name,
        email: userPayload.email,
        roles: userPayload.realm_access.roles,
        accessToken: token
      };

      return res.json(successResponse(responseData, 'Inicio de sesión mock local exitoso.'));
    } catch (error) {
      console.error('[Auth-Mock Error] Excepción al hacer login local:', error);
      next(error);
    }
  }
}

module.exports = new AuthController();
