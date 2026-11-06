package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"path/filepath"
	"strings"
	"syscall"
	"time"

	"github.com/go-chi/chi/v5"
	chiMiddleware "github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"

	"koin/server/internal/accounts"
	"koin/server/internal/analytics"
	"koin/server/internal/auth"
	"koin/server/internal/budgets"
	"koin/server/internal/categories"
	"koin/server/internal/config"
	"koin/server/internal/database"
	"koin/server/internal/export"
	"koin/server/internal/middleware"
	"koin/server/internal/profiles"
	"koin/server/internal/recurring"
	"koin/server/internal/response"
	"koin/server/internal/transactions"
)

var startTime = time.Now()

func main() {
	cfg := config.Load()

	log.Printf("[Koin API] Initializing server on port %s (env: %s)...", cfg.Port, cfg.Environment)

	// Connect to Database
	db, err := database.Connect(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("[Koin Database] Connection error: %v", err)
	}
	defer db.Close()

	// Initialize Services & Handlers
	authRepo := auth.NewRepository(db.Pool)
	authService := auth.NewService(authRepo, cfg.JWTSecret)
	authHandler := auth.NewHandler(authService, func(r *http.Request) *auth.JWTClaims {
		return middleware.GetUserClaims(r.Context())
	})

	profileRepo := profiles.NewRepository(db.Pool)
	profileService := profiles.NewService(profileRepo)
	profileHandler := profiles.NewHandler(profileService, func(r *http.Request) *auth.JWTClaims {
		return middleware.GetUserClaims(r.Context())
	})

	accountRepo := accounts.NewRepository(db.Pool)
	accountService := accounts.NewService(accountRepo)
	accountHandler := accounts.NewHandler(accountService, db.Pool, func(r *http.Request) *auth.JWTClaims {
		return middleware.GetUserClaims(r.Context())
	}, cfg.AppBaseURL)

	categoryRepo := categories.NewRepository(db.Pool)
	categoryService := categories.NewService(categoryRepo)
	categoryHandler := categories.NewHandler(categoryService, db.Pool, func(r *http.Request) *auth.JWTClaims {
		return middleware.GetUserClaims(r.Context())
	})

	transactionRepo := transactions.NewRepository(db.Pool)
	transactionService := transactions.NewService(transactionRepo)
	transactionHandler := transactions.NewHandler(transactionService, db.Pool, func(r *http.Request) *auth.JWTClaims {
		return middleware.GetUserClaims(r.Context())
	})

	recurringRepo := recurring.NewRepository(db.Pool)
	recurringService := recurring.NewService(recurringRepo)
	recurringHandler := recurring.NewHandler(recurringService, db.Pool, func(r *http.Request) *auth.JWTClaims {
		return middleware.GetUserClaims(r.Context())
	})

	budgetRepo := budgets.NewRepository(db.Pool)
	budgetService := budgets.NewService(budgetRepo)
	budgetHandler := budgets.NewHandler(budgetService, db.Pool, func(r *http.Request) *auth.JWTClaims {
		return middleware.GetUserClaims(r.Context())
	})

	analyticsRepo := analytics.NewRepository(db.Pool)
	analyticsService := analytics.NewService(analyticsRepo)
	analyticsHandler := analytics.NewHandler(analyticsService, db.Pool, func(r *http.Request) *auth.JWTClaims {
		return middleware.GetUserClaims(r.Context())
	})

	exportHandler := export.NewHandler(
		db.Pool,
		func(r *http.Request) *auth.JWTClaims {
			return middleware.GetUserClaims(r.Context())
		},
		profileRepo,
		accountRepo,
		categoryRepo,
		budgetRepo,
		recurringRepo,
		transactionRepo,
	)

	// Rate Limiters
	loginLimiter := middleware.NewIPRateLimiter(5, 15*time.Minute, "Demasiados intentos fallidos. Por seguridad, intente de nuevo en 15 minutos.")
	registerLimiter := middleware.NewIPRateLimiter(10, 1*time.Hour, "Límite de registros alcanzado. Por favor, intente más tarde.")

	// Chi Router
	r := chi.NewRouter()

	// Global Middlewares
	r.Use(chiMiddleware.RequestID)
	r.Use(chiMiddleware.RealIP)
	r.Use(chiMiddleware.Logger)
	r.Use(chiMiddleware.Recoverer)

	// Security Headers Middleware (Helmet equivalent)
	r.Use(func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("X-Content-Type-Options", "nosniff")
			w.Header().Set("X-Frame-Options", "DENY")
			w.Header().Set("X-XSS-Protection", "1; mode=block")
			w.Header().Set("Referrer-Policy", "strict-origin-when-cross-origin")
			next.ServeHTTP(w, r)
		})
	})

	// CORS
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   cfg.CORSAllowedOrigins,
		AllowedMethods:   []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	// Health Check
	r.Get("/api/health", func(w http.ResponseWriter, r *http.Request) {
		uptime := time.Since(startTime).Seconds()
		response.JSON(w, http.StatusOK, map[string]any{
			"status":              "healthy",
			"timestamp":           time.Now().UTC().Format(time.RFC3339),
			"service":             "koin-api-go",
			"uptime":              uptime,
			"supportedCurrencies": []string{"USD", "COP", "EUR", "MXN", "BRL", "ARS", "CLP", "PEN", "GBP", "CAD"},
		})
	})

	// Auth Subrouter
	r.Route("/api/v1/auth", func(r chi.Router) {
		r.With(registerLimiter.Middleware).Post("/register", authHandler.Register)
		r.With(loginLimiter.Middleware).Post("/login", authHandler.Login)
		r.With(middleware.AuthenticateToken(cfg.JWTSecret)).Get("/me", authHandler.GetMe)
		r.With(middleware.AuthenticateToken(cfg.JWTSecret)).Post("/logout", authHandler.Logout)
	})

	// Profiles Subrouter (PROF-01 to PROF-04)
	r.Route("/api/v1/profiles", func(r chi.Router) {
		r.Use(middleware.AuthenticateToken(cfg.JWTSecret))
		r.Get("/", profileHandler.List)
		r.Post("/", profileHandler.Create)
		r.Get("/{id}", profileHandler.GetByID)
		r.Patch("/{id}", profileHandler.Update)
		r.Patch("/{id}/theme", profileHandler.UpdateTheme)
		r.Delete("/{id}", profileHandler.Delete)
		r.Post("/{id}/pin", profileHandler.SetPIN)
		r.Post("/{id}/unlock", profileHandler.VerifyPIN)
		r.Post("/{id}/verify-pin", profileHandler.VerifyPIN)
	})

	// Accounts Subrouter (ACC-01 to ACC-04)
	r.Route("/api/v1/accounts", func(r chi.Router) {
		r.Use(middleware.AuthenticateToken(cfg.JWTSecret))
		r.Get("/", accountHandler.List)
		r.Post("/", accountHandler.Create)
		r.Get("/{id}", accountHandler.GetByID)
		r.Patch("/{id}", accountHandler.Update)
		r.Delete("/{id}", accountHandler.Delete)
		r.Post("/{id}/invite", accountHandler.CreateInvitation)
		r.Get("/{id}/members", accountHandler.ListMembers)
		r.Patch("/{id}/members/{memberId}", accountHandler.UpdateMemberRole)
		r.Delete("/{id}/members/{memberId}", accountHandler.RemoveMember)
		r.Post("/{id}/leave", accountHandler.LeaveAccount)
	})

	// Public & Authenticated Invitations Routes (ACC-02 & ACC-03)
	r.Route("/api/v1/invitations", func(r chi.Router) {
		r.Get("/validate", accountHandler.ValidateInvitation)
		r.With(middleware.AuthenticateToken(cfg.JWTSecret)).Post("/accept", accountHandler.AcceptInvitation)
	})

	// Categories Subrouter (TXN-02 & BUD-01)
	r.Route("/api/v1/categories", func(r chi.Router) {
		r.Use(middleware.AuthenticateToken(cfg.JWTSecret))
		r.Get("/", categoryHandler.List)
		r.Post("/", categoryHandler.Create)
		r.Get("/{id}", categoryHandler.GetByID)
		r.Patch("/{id}", categoryHandler.Update)
		r.Delete("/{id}", categoryHandler.Delete)
	})

	// Transactions Subrouter (TXN-02, TXN-03, TXN-05)
	r.Route("/api/v1/transactions", func(r chi.Router) {
		r.Use(middleware.AuthenticateToken(cfg.JWTSecret))
		r.Get("/", transactionHandler.List)
		r.Post("/", transactionHandler.Create)
		r.Get("/{id}", transactionHandler.GetByID)
		r.Patch("/{id}", transactionHandler.Update)
		r.Delete("/{id}", transactionHandler.Delete)
	})

	// Transfers Subrouter (TXN-04)
	r.Route("/api/v1/transfers", func(r chi.Router) {
		r.Use(middleware.AuthenticateToken(cfg.JWTSecret))
		r.Post("/", transactionHandler.CreateTransfer)
	})

	// Recurring Rules & Installment Debts Subrouter
	r.Route("/api/v1/recurring", func(r chi.Router) {
		r.Use(middleware.AuthenticateToken(cfg.JWTSecret))
		r.Get("/", recurringHandler.List)
		r.Post("/", recurringHandler.Create)
		r.Post("/process-due", recurringHandler.ProcessDue)
		r.Get("/{id}", recurringHandler.GetByID)
		r.Patch("/{id}", recurringHandler.Update)
		r.Delete("/{id}", recurringHandler.Delete)
		r.Post("/{id}/apply", recurringHandler.ApplyNow)
	})

	// Currencies & Exchange Rates Subrouter (TXN-03)
	r.Route("/api/v1/currencies", func(r chi.Router) {
		r.Get("/rates", transactionHandler.ListRates)
	})

	// Budgets Subrouter (BUD-02)
	r.Route("/api/v1/budgets", func(r chi.Router) {
		r.Use(middleware.AuthenticateToken(cfg.JWTSecret))
		r.Get("/", budgetHandler.List)
		r.Post("/", budgetHandler.Upsert)
		r.Get("/{id}", budgetHandler.GetByID)
		r.Patch("/{id}", budgetHandler.Update)
		r.Delete("/{id}", budgetHandler.Delete)
	})

	// Analytics Subrouter (ANL-01, ANL-02)
	r.Route("/api/v1/analytics", func(r chi.Router) {
		r.Use(middleware.AuthenticateToken(cfg.JWTSecret))
		r.Get("/summary", analyticsHandler.GetSummary)
		r.Get("/categories", analyticsHandler.GetCategoryExpenses)
		r.Get("/cashflow", analyticsHandler.GetMonthlyCashflow)
	})

	// Export Subrouter (ANL-03)
	r.Route("/api/v1/export", func(r chi.Router) {
		r.Use(middleware.AuthenticateToken(cfg.JWTSecret))
		r.Get("/csv", exportHandler.ExportCSV)
		r.Get("/json", exportHandler.ExportJSON)
	})

	// Frontend SPA Serving & Fallback
	webDistPaths := []string{
		"/app/web/dist",
		"./web/dist",
		"../../apps/web/dist",
		"../web/dist",
		"apps/web/dist",
		"./dist",
	}

	var foundDistDir string
	for _, p := range webDistPaths {
		if fi, err := os.Stat(p); err == nil && fi.IsDir() {
			foundDistDir = p
			break
		}
	}

	if foundDistDir != "" {
		absPath, _ := filepath.Abs(foundDistDir)
		log.Printf("[Koin Web] Serving static SPA frontend from %s", absPath)
		fileServer := http.FileServer(http.Dir(foundDistDir))

		spaHandler := func(w http.ResponseWriter, r *http.Request) {
			// Do not intercept /api/ requests with SPA HTML
			if strings.HasPrefix(r.URL.Path, "/api") {
				response.Error(w, http.StatusNotFound, "Ruta de API no encontrada")
				return
			}

			// Check if the requested file exists
			requestedPath := filepath.Join(foundDistDir, filepath.Clean(r.URL.Path))
			if fi, err := os.Stat(requestedPath); err == nil && !fi.IsDir() {
				fileServer.ServeHTTP(w, r)
				return
			}

			// SPA Fallback: serve index.html
			http.ServeFile(w, r, filepath.Join(foundDistDir, "index.html"))
		}

		r.Get("/*", spaHandler)
		r.Head("/*", spaHandler)
	} else {
		log.Println("[Koin Web] Frontend dist folder not found. API mode only.")
		fallbackHandler := func(w http.ResponseWriter, r *http.Request) {
			if strings.HasPrefix(r.URL.Path, "/api") {
				response.Error(w, http.StatusNotFound, "Ruta de API no encontrada")
				return
			}
			w.Header().Set("Content-Type", "text/plain; charset=utf-8")
			w.WriteHeader(http.StatusOK)
			_, _ = w.Write([]byte("Koin Go API is running. Build frontend with `pnpm build` to serve web app."))
		}
		r.Get("/*", fallbackHandler)
		r.Head("/*", fallbackHandler)
	}

	// Server Configuration
	srv := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      r,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Start server in background
	serverErrors := make(chan error, 1)
	go func() {
		log.Printf("[Koin API] Server listening on http://localhost:%s", cfg.Port)
		serverErrors <- srv.ListenAndServe()
	}()

	// Graceful Shutdown
	shutdown := make(chan os.Signal, 1)
	signal.Notify(shutdown, os.Interrupt, syscall.SIGTERM)

	select {
	case err := <-serverErrors:
		if err != nil && err != http.ErrServerClosed {
			log.Fatalf("[Koin API] Fatal server error: %v", err)
		}
	case sig := <-shutdown:
		log.Printf("[Koin API] Received signal %v, gracefully shutting down...", sig)
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		if err := srv.Shutdown(ctx); err != nil {
			_ = srv.Close()
			log.Fatalf("[Koin API] Could not stop server gracefully: %v", err)
		}
		log.Println("[Koin API] Server exited cleanly")
	}
}
