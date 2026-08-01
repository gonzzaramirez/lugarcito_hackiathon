package main

import (
	"log"

	apihttp "github.com/gonzzaramirez/lugarcito-back/internal/adapters/http"
	"github.com/gonzzaramirez/lugarcito-back/internal/adapters/storage/sqlite"
	"github.com/gonzzaramirez/lugarcito-back/internal/adapters/ws"
	"github.com/gonzzaramirez/lugarcito-back/internal/core/services"
	"github.com/gonzzaramirez/lugarcito-back/config"
)

func main() {
	cfg := config.Load()

	db, err := sqlite.Open(cfg.DatabasePath)
	if err != nil {
		log.Fatalf("[main] abrir base de datos: %v", err)
	}
	defer db.Close()

	// Repositorios (adapters de persistencia)
	usuarioRepo := sqlite.NewUsuarioRepository(db)
	calleRepo := sqlite.NewCalleRepository(db)
	estacRepo := sqlite.NewEstacionamientoRepository(db)
	asigRepo := sqlite.NewAsignacionRepository(db)
	registroRepo := sqlite.NewRegistroRepository(db, estacRepo)

	// WebSocket hub (broadcaster de eventos en tiempo real)
	hub := ws.NewHub()
	go hub.Run()

	// Servicios (casos de uso)
	authSvc := services.NewAuthService(usuarioRepo)
	usuarioSvc := services.NewUsuarioService(usuarioRepo)
	calleSvc := services.NewCalleService(calleRepo)
	estacSvc := services.NewEstacionamientoService(estacRepo)
	asigSvc := services.NewAsignacionService(asigRepo, estacRepo)
	registroSvc := services.NewRegistroService(registroRepo, asigRepo, estacRepo, hub)

	// Router HTTP + servidor
	handler := apihttp.NewRouter(authSvc, usuarioSvc, calleSvc, estacSvc, asigSvc, registroSvc, hub)
	server := apihttp.NewServer(cfg.Port, handler)

	if err := server.Start(); err != nil {
		log.Fatalf("[main] servidor terminó con error: %v", err)
	}
}
