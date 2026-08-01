# Build Stage
FROM golang:1.24-alpine AS builder

WORKDIR /app

# Install ca-certificates and git if needed
RUN apk add --no-go --no-cache ca-certificates git

# Copy dependency definition files
COPY go.mod go.sum ./
RUN go mod download

# Copy application source code
COPY . .

# Build statically linked binary
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o api ./cmd/api/main.go

# Production Stage
FROM alpine:3.20

WORKDIR /app

# Add non-root system user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy CA certs and binary from builder
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
COPY --from=builder /app/api /app/api

USER appuser

EXPOSE 8080

ENV PORT=8080
ENV ENVIRONMENT=production

CMD ["/app/api"]
