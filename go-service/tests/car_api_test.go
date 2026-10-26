package tests

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"go-service/internal/controller"
	"go-service/internal/middleware"
	"go-service/internal/repository"
	"go-service/internal/router"
	"go-service/internal/service"
)

func newTestHandler() http.Handler {
	repo := repository.NewMemoryCarRepository()
	carService := service.NewCarService(repo)
	carController := controller.NewCarController(carService)

	var handler http.Handler = router.NewRouter(carController)
	handler = middleware.ErrorHandler(handler)
	handler = middleware.RequestLogger(handler)

	return handler
}

func performRequest(handler http.Handler, method, path string, body []byte) *httptest.ResponseRecorder {
	req := httptest.NewRequest(method, path, bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")

	recorder := httptest.NewRecorder()
	handler.ServeHTTP(recorder, req)

	return recorder
}

func TestHealthEndpoint(t *testing.T) {
	response := performRequest(newTestHandler(), http.MethodGet, "/health", nil)

	if response.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", response.Code)
	}
}

func TestGetCarsEndpoint(t *testing.T) {
	response := performRequest(newTestHandler(), http.MethodGet, "/api/cars", nil)

	if response.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", response.Code)
	}

	var cars []map[string]any
	if err := json.Unmarshal(response.Body.Bytes(), &cars); err != nil {
		t.Fatalf("invalid JSON response: %v", err)
	}

	if len(cars) != 2 {
		t.Fatalf("expected 2 cars, got %d", len(cars))
	}
}

func TestCreateCarEndpoint(t *testing.T) {
	body := []byte(`{"brand":"Audi","model":"A6","year":2023}`)
	response := performRequest(newTestHandler(), http.MethodPost, "/api/cars", body)

	if response.Code != http.StatusCreated {
		t.Fatalf("expected status 201, got %d: %s", response.Code, response.Body.String())
	}
}

func TestCreateInvalidCarEndpoint(t *testing.T) {
	body := []byte(`{"brand":"","model":"A6","year":2023}`)
	response := performRequest(newTestHandler(), http.MethodPost, "/api/cars", body)

	if response.Code != http.StatusBadRequest {
		t.Fatalf("expected status 400, got %d", response.Code)
	}
}

func TestDuplicateCarEndpoint(t *testing.T) {
	body := []byte(`{"brand":"Toyota","model":"Camry","year":2022}`)
	response := performRequest(newTestHandler(), http.MethodPost, "/api/cars", body)

	if response.Code != http.StatusConflict {
		t.Fatalf("expected status 409, got %d", response.Code)
	}
}

func TestCarNotFoundEndpoint(t *testing.T) {
	response := performRequest(newTestHandler(), http.MethodGet, "/api/cars/999", nil)

	if response.Code != http.StatusNotFound {
		t.Fatalf("expected status 404, got %d", response.Code)
	}
}

func TestUpdateCarEndpoint(t *testing.T) {
	body := []byte(`{"brand":"Toyota","model":"Corolla","year":2024}`)
	response := performRequest(newTestHandler(), http.MethodPut, "/api/cars/1", body)

	if response.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d: %s", response.Code, response.Body.String())
	}
}

func TestDeleteCarEndpoint(t *testing.T) {
	response := performRequest(newTestHandler(), http.MethodDelete, "/api/cars/1", nil)

	if response.Code != http.StatusNoContent {
		t.Fatalf("expected status 204, got %d", response.Code)
	}
}

func TestUnknownRoute(t *testing.T) {
	response := performRequest(newTestHandler(), http.MethodGet, "/unknown", nil)

	if response.Code != http.StatusNotFound {
		t.Fatalf("expected status 404, got %d", response.Code)
	}
}
