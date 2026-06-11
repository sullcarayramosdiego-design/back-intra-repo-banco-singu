const { expressjwt: jwt } = require('express-jwt');
const jwksRsa = require('jwks-rsa');
const idpConfig = require('../config/idp');

/**
 * Middleware para validar el JWT
 */
let authMiddleware;

if (process.env.BYPASS_AUTH === 'true') {
  console.log('[Auth] Modo Bypass: Omitiendo validación de firmas y cargando usuario mock');
  authMiddleware = (req, res, next) => {
    req.auth = {
      sub: 'mock-ejecutivo-1',
      name: 'Alberto Hernán Guevara',
      email: 'alberto.guevara@confianza.pe',
      realm_access: { roles: ['admin', 'ejecutivo'] }
    };
    next();
  };
} else if (process.env.USE_DEV_SECRET === 'true') {
  const devSecret = process.env.JWT_DEV_SECRET || 'super-secret-development-key-for-local-testing';
  const devAudience = process.env.JWT_AUDIENCE || 'account';
  const devIssuer = process.env.JWT_ISSUER || 'https://keycloak.dsr124.xyz/realms/banco-singular';

  console.log(`[Auth] Modo Desarrollo Local: Validando JWT (HS256) usando JWT_DEV_SECRET`);
  authMiddleware = jwt({
    secret: devSecret,
    audience: devAudience,
    issuer: devIssuer,
    algorithms: ['HS256'],
    requestProperty: 'auth'
  });
} else {
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
}

module.exports = authMiddleware;

