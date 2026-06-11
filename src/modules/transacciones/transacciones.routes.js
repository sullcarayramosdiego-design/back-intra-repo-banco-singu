const express = require('express');
const router = express.Router();
const transaccionesController = require('./transacciones.controller');
const authMiddleware = require('../../core/middlewares/auth.middleware');

// Todas las rutas del módulo de transacciones requieren autenticación JWT
router.use(authMiddleware);

router.get('/resumen', transaccionesController.getResumen);
router.get('/transacciones', transaccionesController.getTransacciones);
router.get('/actividad-transaccional', transaccionesController.getActividadTransaccional);

module.exports = router;
