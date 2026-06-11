/**
 * Middleware centralizado para el manejo de errores
 */
function errorMiddleware(err, req, res, next) {
  // Manejo de error de JWT
  if (err.name === 'UnauthorizedError') {
    console.error('[Error Middleware - JWT Validation Failure]:', err.message, err.inner);
    return res.status(401).json({
      status: 'error',
      code: 'UNAUTHORIZED',
      message: 'Token de acceso inválido, vencido o ausente en la cabecera Authorization.'
    });
  }

  // Otros errores del sistema
  console.error('[Error Middleware]', err);

  const statusCode = err.status || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'Ocurrió un error interno en el servidor.' 
    : err.message || 'Error interno.';

  res.status(statusCode).json({
    status: 'error',
    code: err.code || 'INTERNAL_SERVER_ERROR',
    message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
}

module.exports = errorMiddleware;
