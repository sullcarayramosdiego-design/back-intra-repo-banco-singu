# ==============================================================================
# STAGE 1: DEPENDENCIAS
# Instala solo las dependencias de producción para mantener la imagen pequeña.
# ==============================================================================
FROM node:20-alpine AS deps

WORKDIR /app

# Instalar dumb-init para manejo correcto de señales PID 1
RUN apk add --no-cache dumb-init

COPY package*.json ./

# Solo dependencias de producción
RUN npm ci --omit=dev --ignore-scripts

# ==============================================================================
# STAGE 2: RUNNER (PRODUCCIÓN)
# Imagen final limpia, mínima y segura.
# ==============================================================================
FROM node:20-alpine AS runner

WORKDIR /app

# Copiar dumb-init desde la etapa anterior
COPY --from=deps /usr/bin/dumb-init /usr/bin/dumb-init

# Variables de entorno de producción
ENV NODE_ENV=production
ENV PORT=3100

# Copiar dependencias ya instaladas
COPY --from=deps /app/node_modules ./node_modules

# Copiar el código fuente
COPY src/ ./src/
COPY package.json ./

# Exponer el puerto de la API
EXPOSE 3100

# Healthcheck para que Docker/Dokploy sepa si el contenedor está sano
HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
  CMD wget -qO- http://localhost:3100/api/health || exit 1

# Ejecutar como usuario no privilegiado (seguridad)
USER node

# dumb-init como PID 1 garantiza el reenvío correcto de señales SIGTERM/SIGINT
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "src/app.js"]
