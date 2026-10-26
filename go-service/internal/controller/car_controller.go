package controller

import (
	"encoding/json"
	"errors"
	"net/http"
	"strconv"

	"go-service/internal/model"
	"go-service/internal/service"
)

type CarController struct {
	service *service.CarService
}

func NewCarController(carService *service.CarService) *CarController {
	return &CarController{service: carService}
}

func (c *CarController) GetAllCars(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, c.service.GetAllCars())
}

func (c *CarController) GetCarByID(w http.ResponseWriter, r *http.Request, rawID string) {
	id, err := parseID(rawID)
	if err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_ID", "ID must be a positive integer")
		return
	}

	car, err := c.service.GetCarByID(id)
	if err != nil {
		c.handleServiceError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, car)
}

func (c *CarController) CreateCar(w http.ResponseWriter, r *http.Request) {
	var car model.Car
	if err := decodeJSON(r, &car); err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_JSON", "Request body must contain valid JSON")
		return
	}

	created, err := c.service.CreateCar(car)
	if err != nil {
		c.handleServiceError(w, err)
		return
	}

	writeJSON(w, http.StatusCreated, created)
}

func (c *CarController) UpdateCar(w http.ResponseWriter, r *http.Request, rawID string) {
	id, err := parseID(rawID)
	if err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_ID", "ID must be a positive integer")
		return
	}

	var car model.Car
	if err := decodeJSON(r, &car); err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_JSON", "Request body must contain valid JSON")
		return
	}

	updated, err := c.service.UpdateCar(id, car)
	if err != nil {
		c.handleServiceError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, updated)
}

func (c *CarController) DeleteCar(w http.ResponseWriter, r *http.Request, rawID string) {
	id, err := parseID(rawID)
	if err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_ID", "ID must be a positive integer")
		return
	}

	if err := c.service.DeleteCar(id); err != nil {
		c.handleServiceError(w, err)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (c *CarController) handleServiceError(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, service.ErrInvalidID), errors.Is(err, service.ErrInvalidCar):
		writeError(w, http.StatusBadRequest, "INVALID_CAR_DATA", err.Error())
	case errors.Is(err, service.ErrCarNotFound):
		writeError(w, http.StatusNotFound, "CAR_NOT_FOUND", err.Error())
	case errors.Is(err, service.ErrDuplicate):
		writeError(w, http.StatusConflict, "DUPLICATE_CAR", err.Error())
	default:
		writeError(w, http.StatusInternalServerError, "INTERNAL_SERVER_ERROR", "An unexpected server error occurred")
	}
}

func parseID(rawID string) (int, error) {
	id, err := strconv.Atoi(rawID)
	if err != nil || id <= 0 {
		return 0, service.ErrInvalidID
	}
	return id, nil
}

func decodeJSON(r *http.Request, destination any) error {
	defer r.Body.Close()

	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()

	if err := decoder.Decode(destination); err != nil {
		return err
	}

	var extra any
	if err := decoder.Decode(&extra); err != nil {
		return nil
	}

	return errors.New("request body must contain exactly one JSON value")
}

func writeJSON(w http.ResponseWriter, status int, data any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)

	if err := json.NewEncoder(w).Encode(data); err != nil {
		return
	}
}

func writeError(w http.ResponseWriter, status int, code, message string) {
	writeJSON(w, status, map[string]string{
		"error":   code,
		"message": message,
	})
}
