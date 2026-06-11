# Supuestos y Decisiones de Diseño

Este documento resume las decisiones de diseño clave y los supuestos asumidos durante el desarrollo y optimización de la Intranet Financiera del Banco Singular.

---

## 1. Diseño Híbrido de Caché (Redis + In-Memory Fallback)
*   **Decisión**: Utilizar Redis como caché de primer nivel y un objeto `Map` en la memoria interna de la API como caché de segundo nivel (fallback).
*   **Justificación**:
    *   Redis es excelente para compartir el caché entre múltiples réplicas de la API de backend ejecutándose en Dokploy y persiste ante caídas del servidor.
    *   Sin embargo, como Redis se conecta por red, si hay inestabilidad en el VPS o en la red Docker, la API podría fallar o introducir retrasos.
    *   El fallback automático a memoria interna garantiza una alta disponibilidad absoluta (High Availability): el sistema sigue cacheando datos localmente en la RAM del proceso Express con un tiempo de vida (TTL) controlado, asegurando que la API sea inmune a fallas de Redis.

---

## 2. Validación de Firma de Keycloak (Cero Mocks en Producción)
*   **Decisión**: Mantener soporte dual para JWT: validación estricta por JWKS en producción y validación simétrica local (`USE_DEV_SECRET=true`) para pruebas de desarrollo local.
*   **Justificación**:
    *   En producción, no se deben usar secretos compartidos (HS256) ni omitir la validación de tokens por motivos de seguridad bancaria. Se requiere el estándar OIDC con RS256/PS256.
    *   No obstante, obligar a los desarrolladores a tener una instancia de Keycloak corriendo localmente en sus computadoras reduce la velocidad de desarrollo. El interruptor `USE_DEV_SECRET` permite simular inicios de sesión de manera ágil sin alterar el código de producción.

---

## 3. Despliegue Mediante Dockerfile Único en Dokploy
*   **Decisión**: Utilizar contenedores Docker independientes orquestados directamente desde la interfaz gráfica de Dokploy en lugar de archivos `docker-compose.yml` complejos.
*   **Justificación**:
    *   Dokploy administra de manera nativa los despliegues de repositorios Git utilizando el `Dockerfile` de cada proyecto y gestiona el enrutamiento y SSL automáticamente a través de Traefik.
    *   Esto simplifica la configuración de integración y despliegue continuo (CI/CD) al eliminar la necesidad de configurar scripts externos de compose o configuraciones manuales de red en el servidor de destino.

---

## 4. Omitir LEFT JOINs en MySQL DWH de forma Dinámica
*   **Decisión**: La consulta SQL final de reportes se construye condicionalmente de acuerdo a los filtros de dimensiones provistos en la solicitud.
*   **Justificación**:
    *   MySQL 8 no optimiza de forma eficiente los `LEFT JOIN`s si las tablas de hechos (`fact_transacciones`, `fact_cartera`) contienen millones de registros y las dimensiones no están filtradas.
    *   Eliminar el código del `JOIN` en el query final disminuye el uso de memoria de la base de datos y reduce significativamente el tiempo de ejecución de las consultas no filtradas.

---

## 5. Limpieza de Datos Lógica (Capa de Aplicación vs Capa de ETL)
*   **Decisión**: Corregir problemas de integridad referencial duros en la capa de ETL (Python), pero corregir inconsistencias semánticas o de etiquetas de datos en la capa del Frontend (Next.js).
*   **Justificación**:
    *   Si los datos de transacciones no tienen una cuenta correspondiente en el DWH, es un error de integridad referencial duro que no se puede resolver en la UI; se debe corregir en el ETL para que la BD no rompa sus llaves.
    *   Por otro lado, si la base de datos reporta `"FISICA"` y comercialmente se requiere mostrar `"Persona Natural"`, realizar esta traducción en el frontend evita reestructurar bases de datos heredadas o reprocesar históricos enteros de ETL, ahorrando tiempo y poder de cómputo en el Data Warehouse.
