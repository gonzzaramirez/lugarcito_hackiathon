package services

import (
	"fmt"

	"github.com/gonzzaramirez/lugarcito-back/internal/adapters/storage/sqlite"
	"github.com/gonzzaramirez/lugarcito-back/internal/core/domain"
	"github.com/gonzzaramirez/lugarcito-back/internal/core/ports"
)

type usuarioService struct{ repo ports.UsuarioRepository }

func NewUsuarioService(repo ports.UsuarioRepository) ports.UsuarioService {
	return &usuarioService{repo: repo}
}

func (s *usuarioService) Crear(roleID int, nombreUsuario, email, password, nombreCompleto, telefono string) (*domain.Usuario, error) {
	hash, err := sqlite.HashPassword(password)
	if err != nil {
		return nil, fmt.Errorf("hashear password: %w", err)
	}
	u := &domain.Usuario{
		RoleID:         roleID,
		NombreUsuario:  nombreUsuario,
		Email:          email,
		PasswordHash:   hash,
		NombreCompleto: nombreCompleto,
		Telefono:       telefono,
	}
	return s.repo.Create(u)
}

func (s *usuarioService) Listar(roleID *int) ([]domain.Usuario, error) {
	return s.repo.GetAll(roleID)
}
