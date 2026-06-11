const express = require('express');
const reportesRouter = express.Router();
const empleadosRouter = express.Router();
const desempenoController = require('./desempeno.controller');
const authMiddleware = require('../../core/middlewares/auth.middleware');

// ─── /api/reportes/... ────────────────────────────────────────────────────────
reportesRouter.use(authMiddleware);
reportesRouter.get('/ejecutivos', desempenoController.getEjecutivos);
reportesRouter.get('/desempeno-ejecutivos', desempenoController.getDesempenoEjecutivos);

// ─── /api/empleados/... ───────────────────────────────────────────────────────
empleadosRouter.use(authMiddleware);
empleadosRouter.get('/perfil', desempenoController.getPerfil);
empleadosRouter.get('/lista', desempenoController.getEjecutivosList);

module.exports = { reportesRouter, empleadosRouter };
