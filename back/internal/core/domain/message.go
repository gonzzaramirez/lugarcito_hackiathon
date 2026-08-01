package domain

import (
	"errors"
	"time"
)

// Common Domain Errors
var (
	ErrInvalidSender  = errors.New("sender cannot be empty")
	ErrInvalidContent = errors.New("content cannot be empty")
	ErrMessageNotFound = errors.New("message not found")
)

// Message represents the domain entity for a message in the system.
type Message struct {
	ID        string    `json:"id"`
	Sender    string    `json:"sender"`
	Content   string    `json:"content"`
	CreatedAt time.Time `json:"created_at"`
}

// Validate ensures the domain entity rules are respected.
func (m *Message) Validate() error {
	if m.Sender == "" {
		return ErrInvalidSender
	}
	if m.Content == "" {
		return ErrInvalidContent
	}
	return nil
}
