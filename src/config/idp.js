require('dotenv').config();

module.exports = {
  // Configuración estándar OIDC
  jwksUri: process.env.JWKS_URI || 'https://dummy-idp.dokploy.app/.well-known/jwks.json',
  audience: process.env.JWT_AUDIENCE || 'https://api.intranet.confianza.pe',
  issuer: process.env.JWT_ISSUER || 'https://dummy-idp.dokploy.app/',
  algorithms: ['RS256'],
  
  // Soporte para pruebas locales / Desarrollo
  bypassAuth: process.env.BYPASS_AUTH === 'true',
  devSecret: process.env.JWT_DEV_SECRET || 'super-secret-development-key',
  useDevSecret: process.env.USE_DEV_SECRET === 'true' // Si es true, usa HS256 con devSecret en lugar de RS256 con JWKS
};
