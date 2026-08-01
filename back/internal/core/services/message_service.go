package services

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"time"

	"github.com/gonzzaramirez/lugarcito-back/internal/core/domain"
	"github.com/gonzzaramirez/lugarcito-back/internal/core/ports"
)

type messageService struct {
	repo        ports.MessageRepository
	broadcaster ports.EventBroadcaster
}

// NewMessageService constructs the core application service for messages.
func NewMessageService(repo ports.MessageRepository, broadcaster ports.EventBroadcaster) ports.MessageService {
	return &messageService{
		repo:        repo,
		broadcaster: broadcaster,
	}
}

func (s *messageService) CreateMessage(ctx context.Context, sender, content string) (*domain.Message, error) {
	msg := &domain.Message{
		ID:        generateID(),
		Sender:    sender,
		Content:   content,
		CreatedAt: time.Now().UTC(),
	}

	if err := msg.Validate(); err != nil {
		return nil, err
	}

	if err := s.repo.Save(ctx, msg); err != nil {
		return nil, fmt.Errorf("failed to save message: %w", err)
	}

	// Broadcast domain event to websocket clients (non-blocking notification)
	if s.broadcaster != nil {
		_ = s.broadcaster.Broadcast("message_created", msg)
	}

	return msg, nil
}

func (s *messageService) ListMessages(ctx context.Context) ([]*domain.Message, error) {
	return s.repo.GetAll(ctx)
}

func (s *messageService) GetMessageByID(ctx context.Context, id string) (*domain.Message, error) {
	return s.repo.GetByID(ctx, id)
}

func generateID() string {
	bytes := make([]byte, 8)
	_, _ = rand.Read(bytes)
	return hex.EncodeToString(bytes)
}
