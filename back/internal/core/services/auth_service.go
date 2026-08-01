package services

import (
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/gonzzaramirez/lugarcito-back/internal/adapters/storage/sqlite"
	"github.com/gonzzaramirez/lugarcito-back/internal/core/domain"
	"github.com/gonzzaramirez/lugarcito-back/internal/core/ports"
)

const jwtSecret = "lugarcito-secret-2026" // En producción: variable de entorno

type authService struct {
	usuarioRepo ports.UsuarioRepository
}

func NewAuthService(usuarioRepo ports.UsuarioRepository) ports.AuthService {
	return &authService{usuarioRepo: usuarioRepo}
}

func (s *authService) Login(nombreUsuario, password string) (string, *domain.Usuario, error) {
	u, err := s.usuarioRepo.GetByNombreUsuario(nombreUsuario)
	if err != nil {
		return "", nil, domain.ErrUnauthorized
	}
	if !sqlite.CheckPassword(u.PasswordHash, password) {
		return "", nil, domain.ErrUnauthorized
	}

	token, err := generarToken(u)
	if err != nil {
		return "", nil, fmt.Errorf("generar token: %w", err)
	}
	return token, u, nil
}

func (s *authService) ValidateToken(tokenStr string) (*domain.Usuario, error) {
	claims := jwt.MapClaims{}
	token, err := jwt.ParseWithClaims(tokenStr, claims, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("método de firma inesperado")
		}
		return []byte(jwtSecret), nil
	})
	if err != nil || !token.Valid {
		return nil, domain.ErrUnauthorized
	}

	id, ok := claims["sub"].(float64)
	if !ok {
		return nil, domain.ErrUnauthorized
	}

	u, err := s.usuarioRepo.GetByID(int(id))
	if err != nil {
		return nil, domain.ErrUnauthorized
	}
	return u, nil
}

func generarToken(u *domain.Usuario) (string, error) {
	claims := jwt.MapClaims{
		"sub":  u.ID,
		"role": u.RoleNombre,
		"exp":  time.Now().Add(24 * time.Hour).Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(jwtSecret))
}
