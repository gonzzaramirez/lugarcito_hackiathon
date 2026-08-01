package ports

// EventBroadcaster defines outbound operations for real-time notification/websocket dispatching.
type EventBroadcaster interface {
	Broadcast(eventType string, payload interface{}) error
}
