package main

import (
	"encoding/json"
	"net/http"
	"time"

	"go-service/internal/controller"
	"go-service/internal/middleware"
	"go-service/internal/repository"
	"go-service/internal/router"
	"go-service/internal/service"
)

func main() {
	carRepository := repository.NewMemoryCarRepository()
	carService := service.NewCarService(carRepository)
	carController := controller.NewCarController(carService)
	apiHandler := router.NewRouter(carController)

	mux := http.NewServeMux()

	mux.Handle("/health", apiHandler)
	mux.Handle("/api/cars", apiHandler)
	mux.Handle("/api/cars/", apiHandler)

	mux.Handle("/cars", legacyCarsHandler(apiHandler))
	mux.Handle("/cars/", legacyCarsHandler(apiHandler))

	mux.HandleFunc("/io", ioHandler)
	mux.HandleFunc("/cpu", cpuHandler)
	mux.HandleFunc("/cpu-sequential", cpuSequentialHandler)
	mux.HandleFunc("/cpu-goroutines", cpuGoroutinesHandler)

	var handler http.Handler = mux
	handler = middleware.ErrorHandler(handler)
	handler = middleware.RequestLogger(handler)

	server := &http.Server{
		Addr:              ":8080",
		Handler:           handler,
		ReadHeaderTimeout: 5 * time.Second,
	}

	println("Go server is running on http://localhost:8080")

	if err := server.ListenAndServe(); err != nil &&
		err != http.ErrServerClosed {
		println("Server error:", err.Error())
	}
}

func legacyCarsHandler(apiHandler http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		legacyRequest := r.Clone(r.Context())
		legacyURL := *r.URL
		legacyURL.Path = "/api" + r.URL.Path
		legacyRequest.URL = &legacyURL

		apiHandler.ServeHTTP(w, legacyRequest)
	})
}

func writeJSON(w http.ResponseWriter, status int, data any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(data)
}

func ioHandler(w http.ResponseWriter, r *http.Request) {
	time.Sleep(time.Second)

	writeJSON(w, http.StatusOK, map[string]any{
		"message": "I/O operation completed",
	})
}

func heavyComputation(iterations int) int64 {
	var counter int64

	for i := 0; i < iterations; i++ {
		counter++
	}

	return counter
}

func cpuHandler(w http.ResponseWriter, r *http.Request) {
	const iterations = 5_000_000_000

	counter := heavyComputation(iterations)

	writeJSON(w, http.StatusOK, map[string]any{
		"message": "CPU operation completed",
		"counter": counter,
	})
}

func cpuSequentialHandler(w http.ResponseWriter, r *http.Request) {
	const operations = 4
	const iterations = 1_000_000_000

	var total int64

	for i := 0; i < operations; i++ {
		total += heavyComputation(iterations)
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"message": "Sequential CPU operation completed",
		"counter": total,
	})
}

func cpuGoroutinesHandler(w http.ResponseWriter, r *http.Request) {
	const operations = 4
	const iterations = 1_000_000_000

	results := make(chan int64, operations)

	for i := 0; i < operations; i++ {
		go func() {
			results <- heavyComputation(iterations)
		}()
	}

	var total int64

	for i := 0; i < operations; i++ {
		total += <-results
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"message": "Goroutines CPU operation completed",
		"counter": total,
	})
}
