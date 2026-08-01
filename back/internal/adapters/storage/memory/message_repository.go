package memory

import (
	"context"
	"sync"

	"github.com/gonzzaramirez/lugarcito-back/internal/core/domain"
	"github.com/gonzzaramirez/lugarcito-back/internal/core/ports"
)

type memoryMessageRepository struct {
	mu       sync.RWMutex
	messages map[string]*domain.Message
}

// NewMessageRepository creates a new in-memory message repository adapter.
func NewMessageRepository() ports.MessageRepository {
	return &memoryMessageRepository{
		messages: make(map[string]*domain.Message),
	}
}

func (r *memoryMessageRepository) Save(ctx context.Context, msg *domain.Message) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	r.messages[msg.ID] = msg
	return nil
}

func (r *memoryMessageRepository) GetAll(ctx context.Context) ([]*domain.Message, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	list := make([]*domain.Message, 0, len(r.messages))
	for _, msg := range r.messages {
		list = append(list, msg)
	}
	return list, nil
}

func (r *memoryMessageRepository) GetByID(ctx context.Context, id string) (*domain.Message, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	msg, exists := r.messages[id]
	if !exists {
		return nil, domain.ErrMessageNotFound
	}
	return msg, nil
}
