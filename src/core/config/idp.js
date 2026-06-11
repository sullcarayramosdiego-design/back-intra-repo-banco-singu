require('dotenv').config();

module.exports = {
  // Configuración estándar OIDC
  jwksUri: process.env.JWKS_URI,
  audience: process.env.JWT_AUDIENCE,
  issuer: process.env.JWT_ISSUER,
  algorithms: ['RS256']
};
