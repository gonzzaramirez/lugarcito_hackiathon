# Build Stage
FROM golang:1.24-bullseye AS builder

WORKDIR /app

# go-sqlite3 requiere CGO y un compilador C
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libc6-dev \
    && rm -rf /var/lib/apt/lists/*

# Dependencias Go
COPY go.mod go.sum ./
RUN go mod download

# Código fuente
COPY . .

# Build con CGO habilitado (requerido por go-sqlite3)
RUN CGO_ENABLED=1 GOOS=linux go build -ldflags="-w -s" -o api ./cmd/api/main.go

# Production Stage
FROM debian:bullseye-slim

WORKDIR /app

# Librerías C de runtime necesarias para sqlite3
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Usuario no-root
RUN groupadd -r appgroup && useradd -r -g appgroup appuser

# Binario compilado
COPY --from=builder /app/api /app/api

# Datos: schema SQL + CSV de estacionamientos para el seeder
# El CSV NO se elimina — el seeder lo usa en cada primer inicio
COPY --from=builder /app/data /app/data

# Volumen para persistir la base de datos SQLite entre reinicios
VOLUME ["/app/data"]

RUN chown -R appuser:appgroup /app
USER appuser

EXPOSE 8080

ENV PORT=8080
ENV ENVIRONMENT=production
ENV DATABASE_PATH=/app/data/lugarcito.db

CMD ["/app/api"]
