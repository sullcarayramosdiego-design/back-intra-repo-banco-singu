const { expressjwt: jwt } = require('express-jwt');
const jwksRsa = require('jwks-rsa');
const idpConfig = require('../config/idp');

/**
 * Middleware para validar el JWT
 */
let authMiddleware;

if (idpConfig.bypassAuth) {
  console.log('[Auth] ADVERTENCIA: La autenticación está desactivada (BYPASS_AUTH = true). Inyectando usuario mock.');
  authMiddleware = (req, res, next) => {
    req.auth = {
      sub: 'mock|123456',
      name: 'Usuario Analista Prueba',
      email: 'analista.prueba@singular.pe',
      roles: ['Analista', 'Admin']
    };
    next();
  };
} else if (idpConfig.useDevSecret) {
  console.log('[Auth] Modo Desarrollo: Validando JWT firmado simétricamente con JWT_DEV_SECRET (HS256).');
  authMiddleware = jwt({
    secret: idpConfig.devSecret,
    algorithms: ['HS256'],
    requestProperty: 'auth' // Define req.auth con la payload
  });
} else {
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
}

module.exports = authMiddleware;
