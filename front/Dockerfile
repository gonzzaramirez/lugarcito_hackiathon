# Build Stage
FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# ARGs de build: permiten configurar la URL del backend en la imagen.
# Ejemplo: docker build --build-arg API_URL=http://mi-vps:8080/api/v1
ARG API_URL=http://localhost:8080/api/v1
ARG WS_URL=ws://localhost:8080/ws
ENV NEXT_PUBLIC_API_URL=${API_URL}
ENV NEXT_PUBLIC_WS_URL=${WS_URL}
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# Production Stage
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup -g 1001 -S appgroup && adduser -S appuser -u 1001 -G appgroup

COPY --from=builder /app/public /app/public
COPY --from=builder /app/.next/standalone /app
COPY --from=builder /app/.next/static /app/.next/static

RUN chown -R appuser:appgroup /app
USER appuser

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["node", "server.js"]
