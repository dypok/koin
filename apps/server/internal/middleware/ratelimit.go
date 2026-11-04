package middleware

import (
	"net"
	"net/http"
	"strings"
	"sync"
	"time"

	"koin/server/internal/response"
)

type clientRecord struct {
	count    int
	lastSeen time.Time
}

type IPRateLimiter struct {
	mu      sync.Mutex
	clients map[string]*clientRecord
	limit   int
	window  time.Duration
	message string
}

func NewIPRateLimiter(limit int, window time.Duration, message string) *IPRateLimiter {
	limiter := &IPRateLimiter{
		clients: make(map[string]*clientRecord),
		limit:   limit,
		window:  window,
		message: message,
	}

	// Periodic cleanup of stale client records
	go func() {
		ticker := time.NewTicker(window)
		for range ticker.C {
			limiter.mu.Lock()
			now := time.Now()
			for ip, record := range limiter.clients {
				if now.Sub(record.lastSeen) > limiter.window {
					delete(limiter.clients, ip)
				}
			}
			limiter.mu.Unlock()
		}
	}()

	return limiter
}

func getClientIP(r *http.Request) string {
	// Check X-Forwarded-For header
	xff := r.Header.Get("X-Forwarded-For")
	if xff != "" {
		ips := strings.Split(xff, ",")
		return strings.TrimSpace(ips[0])
	}

	// Check X-Real-IP header
	xri := r.Header.Get("X-Real-IP")
	if xri != "" {
		return strings.TrimSpace(xri)
	}

	// Fallback to RemoteAddr
	ip, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		return r.RemoteAddr
	}
	return ip
}

func (limiter *IPRateLimiter) Middleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ip := getClientIP(r)

		limiter.mu.Lock()
		record, exists := limiter.clients[ip]
		now := time.Now()

		if !exists || now.Sub(record.lastSeen) > limiter.window {
			limiter.clients[ip] = &clientRecord{count: 1, lastSeen: now}
			limiter.mu.Unlock()
			next.ServeHTTP(w, r)
			return
		}

		if record.count >= limiter.limit {
			limiter.mu.Unlock()
			response.Error(w, http.StatusTooManyRequests, limiter.message)
			return
		}

		record.count++
		record.lastSeen = now
		limiter.mu.Unlock()

		next.ServeHTTP(w, r)
	})
}
