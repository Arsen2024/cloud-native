package tests

import (
	"errors"
	"testing"

	"go-service/internal/model"
	"go-service/internal/repository"
	"go-service/internal/service"
)

func newTestService() *service.CarService {
	repo := repository.NewMemoryCarRepository()
	return service.NewCarService(repo)
}

func TestGetAllCars(t *testing.T) {
	svc := newTestService()

	cars := svc.GetAllCars()

	if len(cars) != 2 {
		t.Fatalf("expected 2 cars, got %d", len(cars))
	}
}

func TestGetCarByID(t *testing.T) {
	svc := newTestService()

	car, err := svc.GetCarByID(1)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if car.Brand != "Toyota" || car.Model != "Camry" {
		t.Fatalf("unexpected car: %+v", car)
	}
}

func TestGetCarByIDNotFound(t *testing.T) {
	svc := newTestService()

	_, err := svc.GetCarByID(999)
	if !errors.Is(err, service.ErrCarNotFound) {
		t.Fatalf("expected ErrCarNotFound, got %v", err)
	}
}

func TestCreateCar(t *testing.T) {
	svc := newTestService()

	car, err := svc.CreateCar(model.Car{
		Brand: "Audi",
		Model: "A6",
		Year:  2023,
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if car.ID != 3 {
		t.Fatalf("expected ID 3, got %d", car.ID)
	}
}

func TestCreateCarInvalidData(t *testing.T) {
	svc := newTestService()

	_, err := svc.CreateCar(model.Car{
		Brand: "",
		Model: "A6",
		Year:  2023,
	})

	if !errors.Is(err, service.ErrInvalidCar) {
		t.Fatalf("expected ErrInvalidCar, got %v", err)
	}
}

func TestCreateDuplicateCar(t *testing.T) {
	svc := newTestService()

	_, err := svc.CreateCar(model.Car{
		Brand: "Toyota",
		Model: "Camry",
		Year:  2022,
	})

	if !errors.Is(err, service.ErrDuplicate) {
		t.Fatalf("expected ErrDuplicate, got %v", err)
	}
}

func TestUpdateCar(t *testing.T) {
	svc := newTestService()

	updated, err := svc.UpdateCar(1, model.Car{
		Brand: "Toyota",
		Model: "Corolla",
		Year:  2024,
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if updated.ID != 1 || updated.Model != "Corolla" {
		t.Fatalf("unexpected updated car: %+v", updated)
	}
}

func TestDeleteCar(t *testing.T) {
	svc := newTestService()

	if err := svc.DeleteCar(1); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	_, err := svc.GetCarByID(1)
	if !errors.Is(err, service.ErrCarNotFound) {
		t.Fatalf("expected ErrCarNotFound after deletion, got %v", err)
	}
}
