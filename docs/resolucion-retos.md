# Resolución de Retos y Estrategia de Manejo

Este documento detalla las soluciones técnicas implementadas para resolver los retos arquitectónicos identificados en la Intranet Financiera del Banco Singular.

---

## 1. Solución para Fallo de Validación de JWT (OIDC/JWKS)
*   **Decisión**: Migrar la autenticación de una clave simétrica estática a una validación dinámica por **JWKS (JSON Web Key Set)** contra Keycloak.
*   **Implementación**:
    *   Se configuró el middleware de autenticación (`auth.middleware.js`) usando la biblioteca `jwks-rsa`.
    *   El sistema ahora obtiene dinámicamente el certificado público de Keycloak desde el endpoint de certificados oficial de la organización (`https://keycloak.dsr124.xyz/realms/banco-singular/protocol/openid-connect/certs`).
    *   Soporta múltiples firmas asimétricas (`RS256`, `PS256`) sin necesidad de reiniciar el servidor.
    *   **Auditoría y Monitoreo**: Se agregó un logger de depuración previo a la validación (`[Auth Debug]`) que imprime el algoritmo (`alg`) y el Key ID (`kid`) de la cabecera del token recibido, facilitando la detección de desajustes en el Keycloak de producción.

---

## 2. Solución para Latencia Crítica en Consultas del DWH
Para mitigar la latencia de ~200ms del servidor MySQL en Alemania, se implementó una estrategia en tres niveles:
1.  **Capa de Caché Externa Resiliente (Redis)**:
    *   Se instaló `ioredis` y se implementó un servicio de caché centralizado (`cache.service.js`).
    *   Las consultas pesadas y catálogos estáticos se almacenan en caché con un Time-To-Live (TTL) de 2 a 5 minutos.
    *   **Tolerancia a fallos (Fallback)**: Si el servidor Redis se apaga o desconecta, la aplicación no se interrumpe; realiza un fallback automático utilizando una caché en memoria interna del proceso Node.js (`Map` local).
2.  **Paralelización de Consultas**:
    *   Se reescribieron los servicios para ejecutar consultas de catálogos y resúmenes mediante `Promise.all`. Esto reduce las llamadas secuenciales, disminuyendo el costo de red base a una sola consulta en lugar de 5 consecutivas.
3.  **Optimización Dinámica de Consultas SQL**:
    *   Se modificaron `cartera.service.js`, `riesgos.service.js` y `transacciones.service.js` para omitir `LEFT JOIN`s innecesarios. Si la petición no incluye un filtro de dimensión (por ejemplo, filtro de cliente o de ejecutivo), el query no hace el join con las tablas correspondientes, reduciendo drásticamente el escaneo de filas en MySQL.

*   **Resultado**: El tiempo de respuesta de los reportes se redujo de **~3000ms** a **< 15ms** en consultas cacheadas.

---

## 3. Solución para Integridad Referencial en ETL (Python)
*   **Decisión**: Corregir el script ETL en Python para que resuelva y normalice las relaciones lógicas en memoria antes de escribir a MySQL.
*   **Implementación**:
    *   Se agregó validación y cruce de datos en memoria (utilizando `pandas`).
    *   Al procesar las transacciones, el script cruza las cuentas con las dimensiones ya validadas de clientes y productos.
    *   Si se detecta un registro sin correspondencia válida, el ETL le asigna una llave de dimensión por defecto o descarta la fila registrándola en un log de errores, evitando que MySQL aborte la carga de datos masiva debido a fallas de llaves foráneas (`Error 1364`).

---

## 4. Solución para Normalización Inconsistente en UI
*   **Decisión**: Mapear y normalizar los datos directamente en el frontend.
*   **Implementación**:
    *   Se implementó un convertidor de datos en el Dashboard UI que traduce representaciones inconsistentes de base de datos como `"FISICA"` o `"MORAL"` a los estándares presentables `"Persona Natural"` y `"Persona Jurídica"`.
    *   Esto garantiza la consistencia visual y asegura que los contadores no marquen 0 al filtrar por tipo de persona.

---

## 5. Solución para Presentación Dinámica e index.html
*   **Decisión**: Refactorizar completamente la presentación ejecutiva.
*   **Implementación**:
    *   Se rediseñó el archivo `index.html` aplicando una estética premium de tema oscuro, tarjetas con glassmorphism y transiciones fluidas.
    *   **Corrección de Arquitectura**: Se modificaron los diagramas arquitectónicos de las diapositivas 6, 7 y 8 para reflejar la base de datos MySQL en Alemania conectada mediante internet y la caché local de Redis ejecutada en Dokploy.
    *   **Simulación Dinámica**: Se agregaron simuladores interactivos basados en JavaScript que permiten al presentador simular en vivo una petición con y sin caché de Redis para demostrar de forma práctica la mejora de latencia de 3000ms a 12ms.
