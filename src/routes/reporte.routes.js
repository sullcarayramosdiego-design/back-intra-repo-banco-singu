const express = require('express');
const router = express.Router();
const reporteController = require('../controllers/reporte.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// Todas las rutas de reportes requieren autenticación JWT
router.use(authMiddleware);

router.get('/resumen', reporteController.getResumen);
router.get('/cartera', reporteController.getCartera);
router.get('/transacciones', reporteController.getTransacciones);
router.get('/ejecutivos', reporteController.getEjecutivos);
router.get('/clientes', reporteController.getClientes);
router.get('/riesgo', reporteController.getRiesgo);

module.exports = router;
