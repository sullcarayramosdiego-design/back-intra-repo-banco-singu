const { expressjwt: jwt } = require('express-jwt');
const jwksRsa = require('jwks-rsa');
const idpConfig = require('../config/idp');

// Pre-middleware para loguear información del JWT entrante para depuración
const debugAuthMiddleware = (req, res, next) => {
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    try {
      const tokenStr = req.headers.authorization.split(' ')[1];
      const parts = tokenStr.split('.');
      if (parts.length === 3) {
        const header = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf-8'));
        console.log(`[Auth Debug] ${req.method} ${req.originalUrl} - Token JWT alg: ${header.alg}, kid: ${header.kid}`);
      } else {
        console.log(`[Auth Debug] ${req.method} ${req.originalUrl} - Token JWT malformado (no tiene 3 partes)`);
      }
    } catch (e) {
      console.warn('[Auth Debug] Error decodificando cabecera del token para logueo:', e.message);
    }
  } else {
    console.log(`[Auth Debug] ${req.method} ${req.originalUrl} - No se encontró token Bearer`);
  }
  next();
};

/**
 * Middleware para validar el JWT
 * - BYPASS_AUTH=true     → inyecta usuario mock, sin validación
 * - USE_DEV_SECRET=true  → valida con HS256 (dev) o RS256/otros (JWKS si está configurado)
 * - default              → valida con JWKS (soporta RS256, PS256, etc.)
 */
let coreAuthMiddleware;

if (process.env.BYPASS_AUTH === 'true') {
  console.log('[Auth] Modo Bypass: Omitiendo validación de firmas y cargando usuario mock');
  coreAuthMiddleware = (req, res, next) => {
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

  console.log('[Auth] Modo Híbrido/Desarrollo: Validando JWT (HS256) usando JWT_DEV_SECRET o JWKS si está disponible');
  
  const jwksSecret = idpConfig.jwksUri ? jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: idpConfig.jwksUri
  }) : null;

  coreAuthMiddleware = jwt({
    secret: async (req, token) => {
      if (!token || !token.header) {
        throw new Error('Token o cabecera de firma ausente');
      }
      const alg = token.header.alg;
      if (alg === 'HS256') {
        return devSecret;
      }
      if (jwksSecret) {
        return jwksSecret(req, token);
      }
      throw new Error(`Algoritmo de firma '${alg}' no es compatible sin configurar JWKS_URI`);
    },
    audience: devAudience,
    issuer: devIssuer,
    algorithms: ['HS256', 'RS256', 'RS384', 'RS512', 'PS256', 'PS384', 'PS512', 'ES256', 'ES384', 'ES512'],
    requestProperty: 'auth'
  });
} else {
  if (!idpConfig.jwksUri) {
    console.error('[Auth] ERROR: JWKS_URI no está definido en las variables de entorno.');
  }

  console.log(`[Auth] Modo Producción: Validando JWT usando JWKS de ${idpConfig.jwksUri}`);
  
  const jwksSecret = jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: idpConfig.jwksUri
  });

  coreAuthMiddleware = jwt({
    secret: jwksSecret,
    audience: idpConfig.audience,
    issuer: idpConfig.issuer,
    algorithms: idpConfig.algorithms || ['RS256', 'RS384', 'RS512', 'PS256', 'PS384', 'PS512', 'ES256', 'ES384', 'ES512'],
    requestProperty: 'auth'
  });
}

// Combinamos el middleware de depuración y el validador principal
const authMiddleware = (req, res, next) => {
  debugAuthMiddleware(req, res, (err) => {
    if (err) return next(err);
    coreAuthMiddleware(req, res, next);
  });
};

module.exports = authMiddleware;
