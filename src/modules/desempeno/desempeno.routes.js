const express = require('express');
const reportesRouter  = express.Router();
const empleadosRouter = express.Router();
const desempenoController = require('./desempeno.controller');
const authMiddleware = require('../../core/middlewares/auth.middleware');

// ─── /api/reportes/... ────────────────────────────────────────────────────────
reportesRouter.use(authMiddleware);

// Existentes
reportesRouter.get('/ejecutivos',           desempenoController.getEjecutivos);
reportesRouter.get('/desempeno-ejecutivos', desempenoController.getDesempenoEjecutivos);

// Nuevos endpoints analíticos
reportesRouter.get('/desempeno/kpis',       desempenoController.getKpis);
reportesRouter.get('/desempeno/por-zona',   desempenoController.getPorZona);
reportesRouter.get('/desempeno/evolucion',  desempenoController.getEvolucion);
reportesRouter.get('/desempeno/canales',    desempenoController.getCanales);
reportesRouter.get('/desempeno/catalogos',  desempenoController.getCatalogos);

// ─── /api/empleados/... ───────────────────────────────────────────────────────
empleadosRouter.use(authMiddleware);
empleadosRouter.get('/perfil', desempenoController.getPerfil);
empleadosRouter.get('/lista',  desempenoController.getEjecutivosList);

module.exports = { reportesRouter, empleadosRouter };
