package config

import (
	"os"
	"strconv"
)

type Config struct {
	Port         string
	Environment  string
	AllowOrigins string
	DatabasePath string
}

func Load() *Config {
	return &Config{
		Port:         getEnv("PORT", "8080"),
		Environment:  getEnv("ENVIRONMENT", "development"),
		AllowOrigins: getEnv("ALLOW_ORIGINS", "*"),
		DatabasePath: getEnv("DATABASE_PATH", "data/lugarcito.db"),
	}
}

func getEnv(key, fallback string) string {
	if value, exists := os.LookupEnv(key); exists && value != "" {
		return value
	}
	return fallback
}

func getEnvAsInt(key string, fallback int) int {
	strVal := getEnv(key, "")
	if val, err := strconv.Atoi(strVal); err == nil {
		return val
	}
	return fallback
}
