# Backend - Intranet Financiera Confianza

Este repositorio contiene la **API REST** para el sistema de Intranet de Financiera Confianza (Banco Singular). La aplicación sirve como el motor analítico que consume un modelo de datos multidimensional (Star Schema) en MySQL y proporciona información agregada para los dashboards de negocio, así como la gestión de perfiles de empleados.

---

## 🚀 Tecnologías Principales

*   **Entorno de ejecución:** Node.js (v20+)
*   **Framework Web:** Express.js (v5)
*   **Base de Datos:** MySQL (con controlador `mysql2/promise`)
*   **Autenticación:** JWT con soporte para firma asimétrica (OIDC/JWKS) y simétrica (HS256)
*   **Contenerización:** Docker & Docker Compose

---

## 📁 Estructura del Proyecto

El proyecto sigue una estructura limpia y orientada a capas:

```text
backend-intranet-financiera-confianza/
├── db/                         # Scripts de base de datos
│   └── schema.sql              # Definición de tablas (Dim y Fact) e inicialización
├── src/
│   ├── config/                 # Configuraciones de BD e Proveedor de Identidad (IdP)
│   │   ├── database.js         # Pool de conexiones a MySQL
│   │   └── idp.js              # Configuración de OIDC / JWKS y llaves de desarrollo
│   ├── controllers/            # Controladores que manejan el flujo HTTP
│   │   ├── empleado.controller.js
│   │   └── reporte.controller.js
│   ├── middlewares/            # Filtros globales y de seguridad
│   │   ├── auth.middleware.js  # Validación y decodificación de JWT
│   │   └── error.middleware.js # Manejador de errores centralizado
│   ├── routes/                 # Definición de rutas y endpoints expuestos
│   │   ├── index.js            # Enrutador principal (Healthcheck y sub-rutas)
│   │   ├── empleado.routes.js
│   │   └── reporte.routes.js
│   ├── services/               # Lógica de negocio y consultas analíticas SQL
│   │   └── kpi.service.js      # Consultas sobre el Star Schema (Tablas Fact/Dim)
│   ├── utils/                  # Helpers de formateo
│   │   └── formatter.js        # Respuestas estandarizadas de API
│   └── app.js                  # Punto de entrada (Express, Inicialización y Apagado Graceful)
├── .env.example                # Plantilla de variables de entorno
├── Dockerfile                  # Construcción de la imagen Docker (Multi-stage)
├── docker-compose.yml          # Orquestación de BD, ETL y API REST
└── package.json                # Dependencias y scripts del proyecto
```

---

## 🛠️ Configuración e Instalación

### 1. Requisitos Previos

*   [Node.js](https://nodejs.org/) v20 o superior
*   [Docker](https://www.docker.com/) y [Docker Compose](https://docs.docker.com/compose/) (opcional, para despliegue rápido)

### 2. Configurar Variables de Entorno

Copia el archivo de ejemplo `.env.example` a `.env` en la raíz del proyecto y ajusta los valores según corresponda:

```bash
cp .env.example .env
```

Campos principales en el `.env`:
*   `PORT`: Puerto donde se ejecuta la API (Por defecto `3000`).
*   `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`: Credenciales de acceso a la BD MySQL.
*   `BYPASS_AUTH`: Si se establece en `true`, la API no requerirá tokens JWT válidos e inyectará un usuario de prueba (útil para desarrollo rápido local).
*   `USE_DEV_SECRET` y `JWT_DEV_SECRET`: Permite probar la API usando JWT firmados de forma simétrica (HS256) con un secreto local.

### 3. Ejecución en Entorno Local

Instala las dependencias necesarias:

```bash
npm install
```

Para arrancar el servidor en modo desarrollo (usando `nodemon`):

```bash
npm run dev
```

Para iniciarlo en modo normal:

```bash
npm start
```

El servidor estará disponible por defecto en: `http://localhost:3000`

---

## 🐳 Despliegue con Docker Compose

El proyecto incluye soporte para levantar toda la infraestructura necesaria (Base de Datos MySQL, Pipeline ETL y esta API REST).

Para construir y arrancar todos los servicios, ejecuta:

```bash
docker compose up -d --build
```

Esto realizará las siguientes acciones:
1.  Creará y configurará un contenedor MySQL (`singular_db`), levantando automáticamente el esquema analítico desde [db/schema.sql](file:///d:/DD/intranet-confinza/backend-intranet-financiera-confianza/db/schema.sql).
2.  Ejecutará el contenedor del pipeline ETL (`singular_etl_pipeline`) para cargar datos iniciales.
3.  Expondrá la API de Node.js en el puerto `3000`.

---

## 🔌 Endpoints de la API

Todos los endpoints (con excepción del Health Check) requieren un encabezado de autorización HTTP: `Authorization: Bearer <JWT>`.

### 🩺 Servicio Técnico
*   **Health Check:** `GET /api/health`
    *   *Descripción:* Verifica la salud de la API. Retorna uptime y estado de respuesta.
    *   *Autenticación:* Pública.

### 📊 Reportes y Analítica
*   **Resumen Dashboard:** `GET /api/reportes/resumen`
    *   *Descripción:* KPIs generales agregados (total clientes, cuentas activas, saldo total en cartera, total transacciones).
*   **Cartera Activa:** `GET /api/reportes/cartera`
    *   *Descripción:* Distribución de cartera por producto, región y zona.
*   **Actividad Transaccional:** `GET /api/reportes/transacciones`
    *   *Descripción:* Transacciones agrupadas por periodo temporal (año-mes), canal de atención y tipo de movimiento.
*   **Desempeño de Ejecutivos:** `GET /api/reportes/ejecutivos`
    *   *Descripción:* Productividad de los asesores, cantidad de cuentas gestionadas y saldo promedio.
*   **Composición de Clientes:** `GET /api/reportes/clientes`
    *   *Descripción:* Clasificación de clientes según tipo de persona (Física/Moral) y segmento.
*   **Mapa de Riesgo:** `GET /api/reportes/riesgo`
    *   *Descripción:* Saldos y cantidad de cuentas de crédito agrupadas por clasificación de riesgo (NORMAL, CPP, DEFICIENTE, DUDOSO, PERDIDA).

### 👥 Empleados / Ejecutivos
*   **Perfil de Usuario:** `GET /api/empleados/perfil`
    *   *Descripción:* Retorna los datos decodificados del token JWT autenticado, y si corresponde, los complementa cruzándolos con los datos registrados de ejecutivo en `dim_ejecutivos`.
*   **Lista de Ejecutivos:** `GET /api/empleados/lista`
    *   *Descripción:* Devuelve el catálogo completo de ejecutivos financieros.

---

## 🔐 Seguridad y Autenticación

El middleware de autenticación ([auth.middleware.js](file:///d:/DD/intranet-confinza/backend-intranet-financiera-confianza/src/middlewares/auth.middleware.js)) soporta tres flujos para simplificar tanto el desarrollo como el despliegue a producción:

1.  **Modo Producción (`BYPASS_AUTH=false`, `USE_DEV_SECRET=false`):**
    Valida tokens JWT firmados asimétricamente (`RS256`) mediante un conjunto de claves públicas JWKS servidas por el Identity Provider (IdP/Keycloak/Auth0) configurado en `JWKS_URI`.
2.  **Modo Firma Simétrica (`USE_DEV_SECRET=true`):**
    Valida firmas con algoritmo `HS256` utilizando la variable `JWT_DEV_SECRET`. Ideal para integrar con un mock token local.
3.  **Modo Desvío (`BYPASS_AUTH=true`):**
    No realiza ninguna validación de token e inyecta automáticamente un usuario dummy en la petición (`req.auth`), facilitando pruebas manuales sin dependencias externas.
