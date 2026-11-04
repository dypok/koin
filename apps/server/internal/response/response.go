package response

import (
	"encoding/json"
	"net/http"
)

type APIEnvelope struct {
	Message string `json:"message,omitempty"`
	Data    any    `json:"data,omitempty"`
	Error   string `json:"error,omitempty"`
	Details any    `json:"details,omitempty"`
}

func JSON(w http.ResponseWriter, statusCode int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	_ = json.NewEncoder(w).Encode(payload)
}

func Success(w http.ResponseWriter, statusCode int, message string, data any) {
	JSON(w, statusCode, APIEnvelope{
		Message: message,
		Data:    data,
	})
}

func Error(w http.ResponseWriter, statusCode int, errorMsg string) {
	JSON(w, statusCode, APIEnvelope{
		Error: errorMsg,
	})
}

func ErrorWithDetails(w http.ResponseWriter, statusCode int, errorMsg string, details any) {
	JSON(w, statusCode, APIEnvelope{
		Error:   errorMsg,
		Details: details,
	})
}
