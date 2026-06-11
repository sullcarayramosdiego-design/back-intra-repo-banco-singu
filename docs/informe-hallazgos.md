# Informe de Hallazgos - Arquitectura y Pipeline de Datos (Banco Singular)

Este informe consolida los hallazgos técnicos, retos y decisiones tomadas en el proceso de optimización del backend, base de datos y presentación de la Intranet Financiera Confianza.

Para profundizar en cada tema, hemos dividido el informe en los siguientes documentos especializados:

## 📂 Contenido del Informe de Hallazgos

1.  **[Retos Enfrentados](file:///d:/DD/intranet-confinza/backend-intranet-financiera-confianza/docs/retos-enfrentados.md)**:
    Detalle de los cuellos de botella geográficos con el servidor en Alemania, fallas del validador de firmas asimétricas JWT/Keycloak, y problemas de integridad referencial del core transaccional a la base de datos MySQL (Error 1364).
2.  **[Resolución de Retos](file:///d:/DD/intranet-confinza/backend-intranet-financiera-confianza/docs/resolucion-retos.md)**:
    Cómo se implementó la arquitectura de caché en capas (Redis y caché en memoria como fallback), la paralelización de consultas concurrentes mediante `Promise.all` y la validación dinámica por JWKS contra el servidor de Keycloak.
3.  **[Supuestos y Decisiones de Diseño](file:///d:/DD/intranet-confinza/backend-intranet-financiera-confianza/docs/decisiones-diseno.md)**:
    Justificación técnica del diseño híbrido de caché, el soporte de bypass local en desarrollo versus la seguridad estricta en producción, el enfoque de orquestación directa con Dockerfile en Dokploy y las normalizaciones de catálogos en UI.

---

## 📈 Resumen Ejecutivo de Impacto

*   **Rendimiento**: La latencia promedio de carga del dashboard gerencial disminuyó de **~3000ms a < 15ms** gracias a la combinación de Redis y paralelización de promesas.
*   **Seguridad**: Eliminación completa de credenciales JWT estáticas en producción para adoptar el flujo estándar de clave pública OIDC (JWKS) contra Keycloak.
*   **Estabilidad del ETL**: Eliminación de caídas y abortos de inserción de base de datos MySQL mediante el saneamiento y cruce de llaves foráneas en memoria durante el pipeline de Python.
