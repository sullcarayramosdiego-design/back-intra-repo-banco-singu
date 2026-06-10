const express = require('express');
const router = express.Router();
const empleadoController = require('../controllers/empleado.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// Todas las rutas de empleados requieren autenticación JWT
router.use(authMiddleware);

router.get('/perfil', empleadoController.getPerfil);
router.get('/lista', empleadoController.getEjecutivosList);

module.exports = router;
