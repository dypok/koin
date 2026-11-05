package database

import (
	"context"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type DB struct {
	Pool *pgxpool.Pool
}

func Connect(databaseURL string) (*DB, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	config, err := pgxpool.ParseConfig(databaseURL)
	if err != nil {
		return nil, fmt.Errorf("failed to parse database configuration: %w", err)
	}

	if config.ConnConfig.RuntimeParams == nil {
		config.ConnConfig.RuntimeParams = make(map[string]string)
	}
	config.ConnConfig.RuntimeParams["search_path"] = "koin_finance,koin_auth,koin_analytics,koin_system,public"

	// Support self-signed SSL certificates (standard on Heroku Postgres and managed cloud DBs)
	if config.ConnConfig.TLSConfig != nil {
		config.ConnConfig.TLSConfig.InsecureSkipVerify = true
	}

	config.MaxConns = 25
	config.MinConns = 2
	config.MaxConnLifetime = 1 * time.Hour
	config.MaxConnIdleTime = 30 * time.Minute

	pool, err := pgxpool.NewWithConfig(ctx, config)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to database pool: %w", err)
	}

	if err := pool.Ping(ctx); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	dbInstance := &DB{Pool: pool}
	_ = dbInstance.EnsureInitialized(ctx)

	log.Println("[Koin Database] Connected to PostgreSQL successfully")
	return dbInstance, nil
}

// EnsureInitialized checks if the core schema exists; if not, applies the initialization DDL script.
func (db *DB) EnsureInitialized(ctx context.Context) error {
	var exists bool
	query := `
		SELECT EXISTS (
			SELECT FROM information_schema.tables 
			WHERE table_schema = 'koin_auth' AND table_name = 'users'
		)
	`
	err := db.Pool.QueryRow(ctx, query).Scan(&exists)
	if err == nil && exists {
		return nil
	}

	initPaths := []string{
		"/app/docker/01-init.sql",
		"./docker/postgres/01-init.sql",
		"../../docker/postgres/01-init.sql",
		"../docker/postgres/01-init.sql",
		"docker/postgres/01-init.sql",
	}

	for _, p := range initPaths {
		content, err := os.ReadFile(p)
		if err == nil && len(content) > 0 {
			log.Printf("[Koin Database] Initializing schema and seed data from %s...", p)
			if _, execErr := db.Pool.Exec(ctx, string(content)); execErr != nil {
				log.Printf("[Koin Database] Warning: error executing init script %s: %v", p, execErr)
				return execErr
			}
			log.Println("[Koin Database] Schema and seed data successfully initialized.")
			return nil
		}
	}

	return nil
}

func (db *DB) Close() {
	if db.Pool != nil {
		db.Pool.Close()
	}
}
