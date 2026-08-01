package services_test

import (
	"context"
	"testing"

	storageAdapter "github.com/gonzzaramirez/lugarcito-back/internal/adapters/storage/memory"
	"github.com/gonzzaramirez/lugarcito-back/internal/core/domain"
	"github.com/gonzzaramirez/lugarcito-back/internal/core/services"
)

type dummyBroadcaster struct{}

func (d *dummyBroadcaster) Broadcast(eventType string, payload interface{}) error {
	return nil
}

func TestCreateAndListMessage(t *testing.T) {
	repo := storageAdapter.NewMessageRepository()
	broadcaster := &dummyBroadcaster{}
	svc := services.NewMessageService(repo, broadcaster)

	ctx := context.Background()

	// 1. Create valid message
	msg, err := svc.CreateMessage(ctx, "Juan", "Hola mundo")
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	if msg.ID == "" {
		t.Errorf("expected generated ID, got empty string")
	}

	// 2. List messages
	messages, err := svc.ListMessages(ctx)
	if err != nil {
		t.Fatalf("expected no error listing messages, got %v", err)
	}

	if len(messages) != 1 {
		t.Fatalf("expected 1 message, got %d", len(messages))
	}

	if messages[0].Content != "Hola mundo" {
		t.Errorf("expected content 'Hola mundo', got '%s'", messages[0].Content)
	}
}

func TestCreateMessageValidation(t *testing.T) {
	repo := storageAdapter.NewMessageRepository()
	svc := services.NewMessageService(repo, nil)

	ctx := context.Background()

	_, err := svc.CreateMessage(ctx, "", "contenido")
	if err != domain.ErrInvalidSender {
		t.Errorf("expected ErrInvalidSender, got %v", err)
	}

	_, err = svc.CreateMessage(ctx, "Sender", "")
	if err != domain.ErrInvalidContent {
		t.Errorf("expected ErrInvalidContent, got %v", err)
	}
}
