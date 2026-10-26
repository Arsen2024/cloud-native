package router

import (
	"encoding/json"
	"net/http"
	"strings"

	"go-service/internal/controller"
)

func NewRouter(carController *controller.CarController) http.Handler {
	mux := http.NewServeMux()

	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			writeMethodNotAllowed(w)
			return
		}

		writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
	})

	mux.HandleFunc("/api/cars", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			carController.GetAllCars(w, r)
		case http.MethodPost:
			carController.CreateCar(w, r)
		default:
			writeMethodNotAllowed(w)
		}
	})

	mux.HandleFunc("/api/cars/", func(w http.ResponseWriter, r *http.Request) {
		rawID := strings.TrimPrefix(r.URL.Path, "/api/cars/")

		if rawID == "" || strings.Contains(rawID, "/") {
			writeJSON(w, http.StatusNotFound, map[string]string{
				"error":   "ROUTE_NOT_FOUND",
				"message": "Route not found",
			})
			return
		}

		switch r.Method {
		case http.MethodGet:
			carController.GetCarByID(w, r, rawID)
		case http.MethodPut:
			carController.UpdateCar(w, r, rawID)
		case http.MethodDelete:
			carController.DeleteCar(w, r, rawID)
		default:
			writeMethodNotAllowed(w)
		}
	})

	return mux
}

func writeMethodNotAllowed(w http.ResponseWriter) {
	writeJSON(w, http.StatusMethodNotAllowed, map[string]string{
		"error":   "METHOD_NOT_ALLOWED",
		"message": "HTTP method is not supported for this route",
	})
}

func writeJSON(w http.ResponseWriter, status int, data any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(data)
}
