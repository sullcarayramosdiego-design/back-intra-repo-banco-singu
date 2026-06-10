const express = require('express');
const router = express.Router();
const reportesController = require('../controllers/reportes.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// Middleware de autenticación OIDC/JWT obligatorio para todas las rutas de reportes
router.use(authMiddleware);

// Endpoint: Saldo total de la cartera activa agrupado por tipo de producto y región
router.get('/cartera-activa', reportesController.getCarteraActiva);

// Endpoint: Volumen (cantidad) y monto de transacciones por canal y período (mensual o trimestral)
router.get('/actividad-transaccional', reportesController.getActividadTransaccional);

// Endpoint: Desempeño de ejecutivos (transacciones gestionadas) por ejecutivo, zona y región
router.get('/desempeno-ejecutivos', reportesController.getDesempenoEjecutivos);

// Endpoint: Distribución de portafolio de clientes por segmento, tipo de persona y ciudad
router.get('/composicion-clientes', reportesController.getComposicionClientes);

// Endpoint: Análisis de riesgo de cartera y volumen transaccional de ejecutivos por zona y región
router.get('/mapa-riesgo', reportesController.getMapaRiesgo);

module.exports = router;
