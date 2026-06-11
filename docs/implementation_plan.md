# Backend Modular Refactor Plan

## Objective
Reorganize `src/` into a clean **core + modules** architecture. All shared infrastructure lives in `core/`, and each business domain has its own self-contained module folder.

---

## New Directory Structure

```
src/
├── app.js                          # Entry point (unchanged)
├── core/
│   ├── config/
│   │   ├── database.js             # ← MOVED from src/config/database.js
│   │   └── idp.js                  # ← MOVED from src/config/idp.js
│   ├── middlewares/
│   │   ├── auth.middleware.js      # ← MOVED from src/middlewares/
│   │   └── error.middleware.js     # ← MOVED from src/middlewares/
│   ├── routes/
│   │   └── index.js                # ← UPDATED (mounts all module routes)
│   └── utils/
│       └── formatter.js            # ← MOVED from src/utils/
│
└── modules/
    ├── auth/
    │   ├── auth.controller.js      # ← MOVED from src/controllers/
    │   └── auth.routes.js          # ← MOVED from src/routes/
    │
    ├── cartera/
    │   ├── cartera.controller.js   # ← EXTRACTED from reporte.controller + reportes.controller (getCartera, getCarteraActiva, getComposicionClientes)
    │   ├── cartera.service.js      # ← EXTRACTED from kpi.service.js (getCarteraActiva, getComposicionClientes)
    │   └── cartera.routes.js       # ← NEW (GET /cartera-activa, GET /composicion-clientes)
    │
    ├── desempeno/
    │   ├── desempeno.controller.js # ← EXTRACTED from reporte.controller + reportes.controller + empleado.controller (getDesempenoEjecutivos, getPerfil, getEjecutivosList)
    │   ├── desempeno.service.js    # ← EXTRACTED from kpi.service.js (getDesempenioEjecutivos)
    │   └── desempeno.routes.js     # ← NEW (GET /desempeno-ejecutivos, GET /perfil, GET /lista)
    │
    ├── riesgos/
    │   ├── riesgos.controller.js   # ← EXTRACTED from reporte.controller + reportes.controller (getRiesgo, getMapaRiesgo)
    │   ├── riesgos.service.js      # ← EXTRACTED from kpi.service.js (getMapaRiesgoCrediticio)
    │   └── riesgos.routes.js       # ← NEW (GET /mapa-riesgo, GET /riesgo)
    │
    └── transacciones/
        ├── transacciones.controller.js  # ← EXTRACTED (getResumen, getActividadTransaccional, getTransacciones)
        ├── transacciones.service.js     # ← EXTRACTED from kpi.service.js (getResumenDashboard, getActividadTransaccional)
        └── transacciones.routes.js      # ← NEW (GET /resumen, GET /actividad-transaccional)
```

---

## API Routes After Refactor (unchanged URLs)

| URL | Module | Method |
|-----|--------|--------|
| `GET /api/health` | core/routes | public |
| `POST /api/auth/login` | auth | public |
| `GET /api/reportes/cartera-activa` | cartera | auth |
| `GET /api/reportes/composicion-clientes` | cartera | auth |
| `GET /api/reportes/desempeno-ejecutivos` | desempeno | auth |
| `GET /api/empleados/perfil` | desempeno | auth |
| `GET /api/empleados/lista` | desempeno | auth |
| `GET /api/reportes/mapa-riesgo` | riesgos | auth |
| `GET /api/reportes/resumen` | transacciones | auth |
| `GET /api/reportes/actividad-transaccional` | transacciones | auth |

> [!NOTE]
> All existing API URLs remain identical — only internal file organization changes. This guarantees zero breaking changes to the frontend.

---

## Files to CREATE
- `src/core/config/database.js`
- `src/core/config/idp.js`
- `src/core/middlewares/auth.middleware.js`
- `src/core/middlewares/error.middleware.js`
- `src/core/utils/formatter.js`
- `src/core/routes/index.js`
- `src/modules/auth/auth.controller.js`
- `src/modules/auth/auth.routes.js`
- `src/modules/cartera/cartera.controller.js`
- `src/modules/cartera/cartera.service.js`
- `src/modules/cartera/cartera.routes.js`
- `src/modules/desempeno/desempeno.controller.js`
- `src/modules/desempeno/desempeno.service.js`
- `src/modules/desempeno/desempeno.routes.js`
- `src/modules/riesgos/riesgos.controller.js`
- `src/modules/riesgos/riesgos.service.js`
- `src/modules/riesgos/riesgos.routes.js`
- `src/modules/transacciones/transacciones.controller.js`
- `src/modules/transacciones/transacciones.service.js`
- `src/modules/transacciones/transacciones.routes.js`
- Updated `src/app.js` (import from `core/routes`)

## Files to DELETE (after validation)
- `src/config/database.js`
- `src/config/idp.js`
- `src/middlewares/auth.middleware.js`
- `src/middlewares/error.middleware.js`
- `src/utils/formatter.js`
- `src/routes/index.js`
- `src/routes/auth.routes.js`
- `src/routes/empleado.routes.js`
- `src/routes/reporte.routes.js`
- `src/routes/reportes.routes.js`
- `src/controllers/auth.controller.js`
- `src/controllers/empleado.controller.js`
- `src/controllers/reporte.controller.js`
- `src/controllers/reportes.controller.js`
- `src/services/kpi.service.js`

---

## Verification Plan
1. Start the server: `npm run dev`
2. Test health endpoint: `GET http://localhost:3100/api/health`
3. Run the integration test: `node scratch/test_auth.js` (mock login + profile)
4. Verify all 8 report endpoints respond with `status: success`
5. Rebuild Docker image: `docker compose build --no-cache api && docker compose up -d api`
