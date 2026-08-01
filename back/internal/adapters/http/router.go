package http

import (
	"net/http"

	"github.com/gonzzaramirez/lugarcito-back/internal/adapters/http/handlers"
	"github.com/gonzzaramirez/lugarcito-back/internal/adapters/ws"
	"github.com/gonzzaramirez/lugarcito-back/internal/core/ports"
)

func NewRouter(msgService ports.MessageService, hub *ws.Hub) http.Handler {
	mux := http.NewServeMux()

	msgHandler := handlers.NewMessageHandler(msgService)

	// Health Check
	mux.HandleFunc("GET /health", handlers.HealthCheck)

	// WebSocket Endpoint
	mux.HandleFunc("GET /ws", ws.Handler(hub))

	// REST API Endpoints (Go 1.22+ routing syntax)
	mux.HandleFunc("POST /api/v1/messages", msgHandler.Create)
	mux.HandleFunc("GET /api/v1/messages", msgHandler.List)
	mux.HandleFunc("GET /api/v1/messages/{id}", msgHandler.GetByID)

	return corsMiddleware(mux)
}

func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	})
}
