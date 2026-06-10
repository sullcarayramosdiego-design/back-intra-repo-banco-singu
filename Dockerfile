# ==============================================================================
# ESTAPA DE CONSTRUCCIÓN Y DEPENDENCIAS
# ==============================================================================
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./

# Instalar todas las dependencias (incluyendo devDependencies para pruebas si fuera el caso)
RUN npm ci

COPY . .

# ==============================================================================
# ESTAPA DE EJECUCIÓN (PRODUCCIÓN)
# ==============================================================================
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./

# Instalar solo dependencias de producción
RUN npm ci --only=production

# Copiar el código fuente y archivos necesarios desde el builder
COPY --from=builder /app/src ./src

# Exponer el puerto por defecto de la API
EXPOSE 3000

# Ejecutar como usuario no privilegiado por seguridad
USER node

CMD ["node", "src/app.js"]
