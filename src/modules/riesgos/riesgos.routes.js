const express = require('express');
const router = express.Router();
const riesgosController = require('./riesgos.controller');
const authMiddleware = require('../../core/middlewares/auth.middleware');

// Todas las rutas del módulo de riesgos requieren autenticación JWT
router.use(authMiddleware);

router.get('/riesgo', riesgosController.getRiesgo);
router.get('/mapa-riesgo', riesgosController.getMapaRiesgo);

module.exports = router;
