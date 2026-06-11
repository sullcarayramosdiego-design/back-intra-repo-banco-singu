const express = require('express');
const router = express.Router();
const carteraController = require('./cartera.controller');
const authMiddleware = require('../../core/middlewares/auth.middleware');

// Todas las rutas del módulo de cartera requieren autenticación JWT
router.use(authMiddleware);

router.get('/cartera', carteraController.getCartera);
router.get('/cartera-activa', carteraController.getCarteraActiva);
router.get('/clientes', carteraController.getClientes);
router.get('/composicion-clientes', carteraController.getComposicionClientes);

module.exports = router;
