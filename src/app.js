const express = require('express');
const cors = require('cors');
require('dotenv').config();

const routes = require('./routes');
const errorMiddleware = require('./middlewares/error.middleware');

const app = express();

// Middlewares globales
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Registrar rutas
app.use('/api', routes);

// Manejo de rutas no encontradas (404)
app.use((req, res, next) => {
  res.status(404).json({
    status: 'error',
    code: 'NOT_FOUND',
    message: `La ruta solicitada ${req.originalUrl} no existe en este servidor.`
  });
});

// Middleware de manejo centralizado de errores (Debe ser el último en registrarse)
app.use(errorMiddleware);

const PORT = parseInt(process.env.PORT || '3000', 10);

const server = app.listen(PORT, () => {
  console.log(`========================================================`);
  console.log(`Servidor API Banco Singular ejecutándose en puerto ${PORT}`);
  console.log(`Entorno: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Healthcheck: http://localhost:${PORT}/api/health`);
  console.log(`========================================================`);
});

// Manejo de señales de apagado graceful
const shutdown = () => {
  console.log('Cerrando servidor HTTP de forma ordenada...');
  server.close(() => {
    console.log('Servidor HTTP cerrado.');
    process.exit(0);
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

module.exports = app;
