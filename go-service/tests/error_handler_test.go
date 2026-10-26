package tests

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"go-service/internal/middleware"
)

func TestErrorHandlerRecoversFromPanic(t *testing.T) {
	handler := middleware.ErrorHandler(http.HandlerFunc(
		func(w http.ResponseWriter, r *http.Request) {
			panic("test panic")
		},
	))

	request := httptest.NewRequest(http.MethodGet, "/test", nil)
	response := httptest.NewRecorder()

	handler.ServeHTTP(response, request)

	if response.Code != http.StatusInternalServerError {
		t.Fatalf(
			"expected status %d, got %d",
			http.StatusInternalServerError,
			response.Code,
		)
	}

	if !strings.Contains(response.Header().Get("Content-Type"), "application/json") {
		t.Fatalf("expected JSON Content-Type, got %q", response.Header().Get("Content-Type"))
	}

	body := response.Body.String()

	if !strings.Contains(body, `"error":"INTERNAL_SERVER_ERROR"`) {
		t.Fatalf("expected JSON error code, got %q", body)
	}

	if !strings.Contains(body, `"message":"An unexpected server error occurred"`) {
		t.Fatalf("expected generic error message, got %q", body)
	}
}

func TestErrorHandlerDoesNotOverwriteStartedResponse(t *testing.T) {
	handler := middleware.ErrorHandler(http.HandlerFunc(
		func(w http.ResponseWriter, r *http.Request) {
			w.WriteHeader(http.StatusAccepted)
			_, _ = w.Write([]byte("started"))

			panic("panic after response")
		},
	))

	request := httptest.NewRequest(http.MethodGet, "/test", nil)
	response := httptest.NewRecorder()

	handler.ServeHTTP(response, request)

	if response.Code != http.StatusAccepted {
		t.Fatalf(
			"expected status %d, got %d",
			http.StatusAccepted,
			response.Code,
		)
	}

	if response.Body.String() != "started" {
		t.Fatalf(
			"expected body %q, got %q",
			"started",
			response.Body.String(),
		)
	}
}
