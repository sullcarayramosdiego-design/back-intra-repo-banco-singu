const express = require('express');
const router = express.Router();

const reporteRoutes = require('./reporte.routes');
const reportesRoutes = require('./reportes.routes');
const empleadoRoutes = require('./empleado.routes');
const authRoutes = require('./auth.routes');

// Endpoint de salud pública (Health Check)
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'API activa y respondiendo correctamente.',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Registrar sub-rutas de negocio
router.use('/auth', authRoutes);
router.use('/reportes', reporteRoutes);
router.use('/reportes', reportesRoutes);
router.use('/empleados', empleadoRoutes);

module.exports = router;

