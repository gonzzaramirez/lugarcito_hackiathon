package http

import (
	"net/http"

	"github.com/gonzzaramirez/lugarcito-back/internal/adapters/http/handlers"
	"github.com/gonzzaramirez/lugarcito-back/internal/adapters/ws"
	"github.com/gonzzaramirez/lugarcito-back/internal/core/ports"
)

func NewRouter(
	authSvc ports.AuthService,
	usuarioSvc ports.UsuarioService,
	calleSvc ports.CalleService,
	estacSvc ports.EstacionamientoService,
	asigSvc ports.AsignacionService,
	registroSvc ports.RegistroService,
	hub *ws.Hub,
) http.Handler {
	mux := http.NewServeMux()

	authH := handlers.NewAuthHandler(authSvc)
	usuarioH := handlers.NewUsuarioHandler(usuarioSvc)
	calleH := handlers.NewCalleHandler(calleSvc)
	estacH := handlers.NewEstacionamientoHandler(estacSvc)
	asigH := handlers.NewAsignacionHandler(asigSvc)
	registroH := handlers.NewRegistroHandler(registroSvc)

	// Health
	mux.HandleFunc("GET /health", handlers.HealthCheck)

	// WebSocket (público - mapa en vivo)
	mux.HandleFunc("GET /ws", ws.Handler(hub))

	// Auth
	mux.HandleFunc("POST /api/v1/auth/login", authH.Login)

	// Calles (admin crea, público lista)
	mux.HandleFunc("GET /api/v1/calles", calleH.List)
	mux.HandleFunc("POST /api/v1/calles", handlers.RequireRole(authSvc, "ADMIN", calleH.Create))

	// Usuarios (solo admin)
	mux.HandleFunc("POST /api/v1/users", handlers.RequireRole(authSvc, "ADMIN", usuarioH.Create))
	mux.HandleFunc("GET /api/v1/users", handlers.RequireRole(authSvc, "ADMIN", usuarioH.List))

	// Estacionamientos - mapa en vivo (público) y búsqueda por cercanía
	mux.HandleFunc("GET /api/v1/estacionamientos/mapa", estacH.Mapa)
	mux.HandleFunc("GET /api/v1/estacionamientos/cercanos", estacH.Cercanos)

	// Asignaciones
	mux.HandleFunc("POST /api/v1/asignaciones", handlers.RequireRole(authSvc, "ADMIN", asigH.Asignar))
	mux.HandleFunc("GET /api/v1/asignaciones/mi-turno", handlers.RequireAuth(authSvc, asigH.MiTurno))

	// Registros entrada/salida (solo empleados autenticados)
	mux.HandleFunc("POST /api/v1/registros/entrada", handlers.RequireAuth(authSvc, registroH.Entrada))
	mux.HandleFunc("POST /api/v1/registros/salida", handlers.RequireAuth(authSvc, registroH.Salida))

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
