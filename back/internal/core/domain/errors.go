package domain

import "errors"

var (
	ErrNotFound            = errors.New("recurso no encontrado")
	ErrConflict            = errors.New("recurso ya existe")
	ErrUnauthorized        = errors.New("no autorizado")
	ErrForbidden           = errors.New("acceso denegado")
	ErrSinCapacidad        = errors.New("el tramo no tiene lugares disponibles")
	ErrRegistroNoEnCurso   = errors.New("el registro no está en curso")
	ErrEmpleadoSinTurno    = errors.New("el empleado no tiene turno activo para ese tramo")
)
