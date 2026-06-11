const express = require('express');
const router = express.Router();

// ─── Módulos ─────────────────────────────────────────────────────────────────
const authRoutes           = require('../../modules/auth/auth.routes');
const carteraRoutes        = require('../../modules/cartera/cartera.routes');
const { reportesRouter: desempenoReportesRoutes, empleadosRouter: desempenoEmpleadosRoutes }
                           = require('../../modules/desempeno/desempeno.routes');
const riesgosRoutes        = require('../../modules/riesgos/riesgos.routes');
const transaccionesRoutes  = require('../../modules/transacciones/transacciones.routes');

// ─── Health Check ─────────────────────────────────────────────────────────────
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'backend-intranet-financiera-confianza',
    timestamp: new Date().toISOString()
  });
});

// ─── Auth (pública) ────────────────────────────────────────────────────────────
router.use('/auth', authRoutes);

// ─── Reportes (protegido) ──────────────────────────────────────────────────────
//   Módulo Cartera:       GET /api/reportes/cartera-activa
//                         GET /api/reportes/composicion-clientes
router.use('/reportes', carteraRoutes);

//   Módulo Desempeño:     GET /api/reportes/ejecutivos
//                         GET /api/reportes/desempeno-ejecutivos
router.use('/reportes', desempenoReportesRoutes);

//   Módulo Riesgos:       GET /api/reportes/riesgo
//                         GET /api/reportes/mapa-riesgo
router.use('/reportes', riesgosRoutes);

//   Módulo Transacciones: GET /api/reportes/resumen
//                         GET /api/reportes/actividad-transaccional
router.use('/reportes', transaccionesRoutes);

// ─── Empleados (protegido) ─────────────────────────────────────────────────────
//   Módulo Desempeño:     GET /api/empleados/perfil
//                         GET /api/empleados/lista
router.use('/empleados', desempenoEmpleadosRoutes);

module.exports = router;
