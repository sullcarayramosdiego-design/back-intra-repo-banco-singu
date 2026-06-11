# Retos Arquitectónicos y Técnicos Enfrentados

Este documento detalla los principales retos técnicos identificados durante la auditoría y refactorización de la Intranet Financiera del Banco Singular, abarcando desde la seguridad de la API hasta la latencia de datos y la visualización final.

---

## 1. Fallo de Validación de JWT (Algoritmo Inválido) en Producción
*   **Contexto**: El backend inicialmente rechazaba los tokens JWT emitidos por el servidor Keycloak de producción.
*   **Problema**: La API estaba configurada para validar los tokens usando firmas simétricas (`HS256`) con un secreto estático local. Sin embargo, Keycloak (como proveedor OIDC estándar) firma los tokens usando criptografía asimétrica (`RS256` o `PS256`).
*   **Impacto**: Los usuarios no podían iniciar sesión ni consumir endpoints en el entorno de producción debido al error `invalid algorithm`.

---

## 2. Latencia Crítica en Consultas del Data Warehouse (DWH)
*   **Contexto**: El backend expone endpoints para reportes gerenciales de "Cartera Activa", "Riesgos" y "Actividad Transaccional".
*   **Problema**: 
    1.  **Ubicación Geográfica**: El servidor de base de datos MySQL de producción está alojado en una instancia VPS de Contabo en **Alemania (IP `207.180.199.180`)**. Esto introduce una latencia física de red de **~200ms** por cada ida y vuelta (round-trip) desde la región americana (Perú).
    2.  **Anti-patrón de Consultas Secuenciales**: Para construir un único reporte, el backend ejecutaba secuencialmente hasta 5 consultas separadas a MySQL. Debido a la latencia de red, el tiempo total acumulado superaba los **3000ms** (3 segundos) por petición, haciendo que el Dashboard fuera lento.
    3.  **Tamaño y Complejidad**: Tablas de hechos muy grandes realizaban `LEFT JOIN` completos innecesarios contra tablas de dimensiones, incluso cuando el usuario no aplicaba filtros sobre esas dimensiones.

---

## 3. Pérdida de Integridad Referencial en el Proceso de Ingesta (ETL)
*   **Contexto**: Los datos provienen de exportaciones CSV estáticas del core transaccional que son ingestadas a MySQL por un script Python.
*   **Problema**: La base de datos MySQL tiene restricciones de llaves foráneas (`FOREIGN KEY`) para garantizar la integridad referencial. Cuando el script ETL intentaba insertar registros directamente en `fact_transacciones`, fallaba debido a que las cuentas o clientes referenciados no existían en las tablas de dimensiones correspondientes o contenían campos vacíos (provocando el Error Crítico MySQL 1364).
*   **Impacto**: Las actualizaciones periódicas del DWH fallaban y bloqueaban la disponibilidad de nuevos reportes.

---

## 4. Normalización Inconsistente de Datos y Métricas en Cero en la UI
*   **Contexto**: Los catálogos de clientes en la base de datos de producción venían de sistemas heredados sin limpiar.
*   **Problema**: Atributos críticos como el tipo de persona se registraban como `"FISICA"` o `"MORAL"`. El frontend esperaba encontrar valores estándar como `"Natural"` o `"Jurídica"`.
*   **Impacto**: Esto causaba que los filtros del dashboard fallaran, mostrando gráficos vacíos o KPIs comerciales con valores en 0.

---

## 5. Falta de Dinamismo y Arquitectura Desactualizada en index.html
*   **Contexto**: La presentación ejecutiva del proyecto sirve para sustentar la arquitectura elegida a la mesa de control y gerencia.
*   **Problema**: El archivo `index.html` consistía en diapositivas estáticas y simples. Además, las diagramaciones de arquitectura lógica y física no reflejaban el uso de Redis ni explicaban por qué se necesitaba caché para mitigar la latencia de red con Alemania, ni mostraban la orquestación en Dokploy.
