package middleware

import (
	"encoding/json"
	"log"
	"net/http"
)

type errorResponseWriter struct {
	http.ResponseWriter
	wroteHeader bool
}

func (w *errorResponseWriter) WriteHeader(statusCode int) {
	if w.wroteHeader {
		return
	}

	w.wroteHeader = true
	w.ResponseWriter.WriteHeader(statusCode)
}

func (w *errorResponseWriter) Write(data []byte) (int, error) {
	if !w.wroteHeader {
		w.WriteHeader(http.StatusOK)
	}

	return w.ResponseWriter.Write(data)
}

func ErrorHandler(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		recorder := &errorResponseWriter{
			ResponseWriter: w,
		}

		defer func() {
			if recovered := recover(); recovered != nil {
				log.Printf("Recovered from panic: %v", recovered)

				if recorder.wroteHeader {
					return
				}

				w.Header().Set("Content-Type", "application/json; charset=utf-8")
				w.WriteHeader(http.StatusInternalServerError)

				_ = json.NewEncoder(w).Encode(map[string]string{
					"error":   "INTERNAL_SERVER_ERROR",
					"message": "An unexpected server error occurred",
				})
			}
		}()

		next.ServeHTTP(recorder, r)
	})
}
