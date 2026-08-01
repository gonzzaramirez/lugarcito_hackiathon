package ws

import (
	"encoding/json"
	"log"
	"sync"

	"github.com/gonzzaramirez/lugarcito-back/internal/core/ports"
)

// WSEvent defines standard payload structure sent over WebSockets.
type WSEvent struct {
	Type    string      `json:"type"`
	Payload interface{} `json:"payload"`
}

// Hub manages active WebSocket clients and broadcasts events.
type Hub struct {
	mu         sync.RWMutex
	clients    map[*Client]bool
	broadcast  chan []byte
	register   chan *Client
	unregister chan *Client
}

// NewHub creates a new Hub instance.
func NewHub() *Hub {
	return &Hub{
		clients:    make(map[*Client]bool),
		broadcast:  make(chan []byte, 256),
		register:   make(chan *Client),
		unregister: make(chan *Client),
	}
}

// Ensure Hub implements ports.EventBroadcaster interface
var _ ports.EventBroadcaster = (*Hub)(nil)

// Run starts processing websocket client events and broadasting.
func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			h.mu.Lock()
			h.clients[client] = true
			h.mu.Unlock()
			log.Printf("[WS Hub] Client connected: %s", client.conn.RemoteAddr().String())

		case client := <-h.unregister:
			h.mu.Lock()
			if _, ok := h.clients[client]; ok {
				delete(h.clients, client)
				close(client.send)
				log.Printf("[WS Hub] Client disconnected: %s", client.conn.RemoteAddr().String())
			}
			h.mu.Unlock()

		case message := <-h.broadcast:
			h.mu.RLock()
			for client := range h.clients {
				select {
				case client.send <- message:
				default:
					close(client.send)
					delete(h.clients, client)
				}
			}
			h.mu.RUnlock()
		}
	}
}

// Broadcast serializes and dispatches an event to all connected clients.
func (h *Hub) Broadcast(eventType string, payload interface{}) error {
	evt := WSEvent{
		Type:    eventType,
		Payload: payload,
	}

	data, err := json.Marshal(evt)
	if err != nil {
		return err
	}

	h.broadcast <- data
	return nil
}
