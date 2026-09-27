package main

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"
	"time"
)

type Car struct {
	ID    int    `json:"id"`
	Brand string `json:"brand"`
	Model string `json:"model"`
	Year  int    `json:"year"`
}

var cars = []Car{
	{
		ID:    1,
		Brand: "Toyota",
		Model: "Camry",
		Year:  2022,
	},
	{
		ID:    2,
		Brand: "BMW",
		Model: "X5",
		Year:  2021,
	},
}

func healthHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)

	json.NewEncoder(w).Encode(map[string]string{
		"status": "ok",
	})
}

func carsHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodGet {
		getCars(w)
		return
	}

	if r.Method == http.MethodPost {
		createCar(w, r)
		return
	}

	http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
}

func carHandler(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(strings.TrimPrefix(r.URL.Path, "/cars/"))
	if err != nil {
		http.Error(w, "Invalid car ID", http.StatusBadRequest)
		return
	}

	switch r.Method {
	case http.MethodGet:
		getCar(w, id)
	case http.MethodPut:
		updateCar(w, r, id)
	case http.MethodDelete:
		deleteCar(w, id)
	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

func getCars(w http.ResponseWriter) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)

	json.NewEncoder(w).Encode(cars)
}

func getCar(w http.ResponseWriter, id int) {
	for _, car := range cars {
		if car.ID == id {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusOK)

			json.NewEncoder(w).Encode(car)
			return
		}
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusNotFound)

	json.NewEncoder(w).Encode(map[string]string{
		"error": "Car not found",
	})
}

func createCar(w http.ResponseWriter, r *http.Request) {
	var data Car

	err := json.NewDecoder(r.Body).Decode(&data)
	if err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	if data.Brand == "" || data.Model == "" || data.Year == 0 {
		http.Error(w, "Invalid car data", http.StatusBadRequest)
		return
	}

	newID := 1

	if len(cars) > 0 {
		newID = cars[len(cars)-1].ID + 1
	}

	newCar := Car{
		ID:    newID,
		Brand: data.Brand,
		Model: data.Model,
		Year:  data.Year,
	}

	cars = append(cars, newCar)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)

	json.NewEncoder(w).Encode(newCar)
}

func updateCar(w http.ResponseWriter, r *http.Request, id int) {
	for i := range cars {
		if cars[i].ID == id {
			var data Car

			err := json.NewDecoder(r.Body).Decode(&data)
			if err != nil {
				http.Error(w, "Invalid JSON", http.StatusBadRequest)
				return
			}

			if data.Brand == "" || data.Model == "" || data.Year == 0 {
				http.Error(w, "Invalid car data", http.StatusBadRequest)
				return
			}

			cars[i].Brand = data.Brand
			cars[i].Model = data.Model
			cars[i].Year = data.Year

			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusOK)

			json.NewEncoder(w).Encode(cars[i])
			return
		}
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusNotFound)

	json.NewEncoder(w).Encode(map[string]string{
		"error": "Car not found",
	})
}

func deleteCar(w http.ResponseWriter, id int) {
	for i, car := range cars {
		if car.ID == id {
			cars = append(cars[:i], cars[i+1:]...)

			w.WriteHeader(http.StatusNoContent)
			return
		}
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusNotFound)

	json.NewEncoder(w).Encode(map[string]string{
		"error": "Car not found",
	})
}

func ioHandler(w http.ResponseWriter, r *http.Request) {
	time.Sleep(1 * time.Second)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)

	json.NewEncoder(w).Encode(map[string]string{
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

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)

	json.NewEncoder(w).Encode(map[string]interface{}{
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

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)

	json.NewEncoder(w).Encode(map[string]interface{}{
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

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)

	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "Goroutines CPU operation completed",
		"counter": total,
	})
}

func main() {
	http.HandleFunc("/health", healthHandler)
	http.HandleFunc("/cars", carsHandler)
	http.HandleFunc("/cars/", carHandler)
	http.HandleFunc("/io", ioHandler)
	http.HandleFunc("/cpu", cpuHandler)
	http.HandleFunc("/cpu-sequential", cpuSequentialHandler)
	http.HandleFunc("/cpu-goroutines", cpuGoroutinesHandler)

	println("Go server is running on http://localhost:8080")

	err := http.ListenAndServe(":8080", nil)
	if err != nil {
		println("Server error:", err.Error())
	}
}
