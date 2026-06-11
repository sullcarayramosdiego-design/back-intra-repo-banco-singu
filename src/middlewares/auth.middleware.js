const { expressjwt: jwt } = require('express-jwt');
const jwksRsa = require('jwks-rsa');
const idpConfig = require('../config/idp');

/**
 * Middleware para validar el JWT
 */
let authMiddleware;

if (!idpConfig.jwksUri) {
  console.error('[Auth] ERROR: JWKS_URI no está definido en las variables de entorno.');
}

console.log(`[Auth] Modo Producción: Validando JWT (RS256) usando JWKS de ${idpConfig.jwksUri}`);
authMiddleware = jwt({
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: idpConfig.jwksUri
  }),
  audience: idpConfig.audience,
  issuer: idpConfig.issuer,
  algorithms: ['RS256'],
  requestProperty: 'auth'
});

module.exports = authMiddleware;
