# Build Stage — Go 1.25 (go.mod lo requiere), sin CGO (modernc.org/sqlite es Go puro)
FROM golang:1.25-alpine AS builder

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o api ./cmd/api

# Production Stage
FROM alpine:3.21

WORKDIR /app

RUN apk add --no-cache ca-certificates

COPY --from=builder /app/api /app/api
COPY --from=builder /app/data /app/data

VOLUME ["/app/data"]

EXPOSE 8080

ENV PORT=8080
ENV ENVIRONMENT=production
ENV DATABASE_PATH=/app/data/lugarcito.db

CMD ["/app/api"]
