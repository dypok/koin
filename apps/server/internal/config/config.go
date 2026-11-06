package config

import (
	"os"
	"strings"

	"github.com/joho/godotenv"
)

type Config struct {
	Port               string
	DatabaseURL        string
	JWTSecret          string
	CORSAllowedOrigins []string
	Environment        string
	AppBaseURL         string
}

func Load() *Config {
	// Attempt loading .env from current directory or root
	_ = godotenv.Load()
	_ = godotenv.Load("../../.env")

	port := os.Getenv("PORT")
	if port == "" {
		port = "3000"
	}

	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		dbURL = "postgres://koin_user:koin_secret_2026@localhost:5432/koin_db?sslmode=disable"
	}

	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		jwtSecret = "super_secret_jwt_key_koin_change_in_production_min32"
	}

	corsOriginsStr := os.Getenv("CORS_ALLOWED_ORIGINS")
	if corsOriginsStr == "" {
		corsOriginsStr = "http://localhost:5173,http://localhost:3000"
	}

	corsOrigins := strings.Split(corsOriginsStr, ",")
	for i := range corsOrigins {
		corsOrigins[i] = strings.TrimSpace(corsOrigins[i])
	}

	env := os.Getenv("NODE_ENV")
	if env == "" {
		env = os.Getenv("GO_ENV")
	}
	if env == "" {
		env = "development"
	}

	appBaseURL := os.Getenv("APP_BASE_URL")
	if appBaseURL == "" {
		appBaseURL = "http://localhost:5173"
	}

	return &Config{
		Port:               port,
		DatabaseURL:        dbURL,
		JWTSecret:          jwtSecret,
		CORSAllowedOrigins: corsOrigins,
		Environment:        env,
		AppBaseURL:         appBaseURL,
	}
}
