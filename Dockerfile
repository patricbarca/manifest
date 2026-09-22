# syntax=docker/dockerfile:1

# ──────────────────────────────────────────────────────────────────────────
# Manifest — imagen de producción
#
# Tres etapas para que la imagen final no lleve ni el código fuente ni las
# dependencias de desarrollo. Pesa unos 200 MB en vez de más de 1 GB.
# ──────────────────────────────────────────────────────────────────────────

FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
# `npm ci` respeta el lockfile exacto. Nunca `npm install` en un build.
RUN npm ci

FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app

# ffmpeg es lo que monta el MP4 descargable. Sin él la app funciona igual
# (el vídeo se ve en el reproductor web) pero la descarga queda deshabilitada.
RUN apk add --no-cache ffmpeg

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    DATA_DIR=/data \
    FFMPEG_PATH=/usr/bin/ffmpeg

# Usuario sin privilegios: si alguien escapa del proceso, no es root.
RUN addgroup -g 1001 -S nodejs && adduser -S -u 1001 -G nodejs nextjs

# El server.js de standalone no copia public ni .next/static: van a mano.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Punto de montaje del volumen. Aquí viven la base de datos JSON, los selfies
# y las escenas: todo lo que tiene que sobrevivir a un despliegue.
RUN mkdir -p /data && chown -R nextjs:nodejs /data
VOLUME ["/data"]

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
