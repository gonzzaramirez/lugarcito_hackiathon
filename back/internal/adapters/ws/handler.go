package ws

import (
	"net/http"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		// Allow all origins for dev/demo; customize for production security
		return true
	},
}

// Handler returns an http.HandlerFunc that upgrades requests to WebSocket connections.
func Handler(hub *Hub) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			http.Error(w, "Failed to upgrade to websocket", http.StatusBadRequest)
			return
		}

		client := NewClient(hub, conn)
		hub.register <- client

		go client.WritePump()
		go client.ReadPump()
	}
}
