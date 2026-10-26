package service

import (
	"errors"
	"fmt"
	"strings"

	"go-service/internal/model"
	"go-service/internal/repository"
)

var (
	ErrInvalidID   = errors.New("ID must be a positive integer")
	ErrInvalidCar  = errors.New("invalid car data")
	ErrCarNotFound = errors.New("car not found")
	ErrDuplicate   = errors.New("car already exists")
)

type CarService struct {
	repo repository.CarRepository
}

func NewCarService(repo repository.CarRepository) *CarService {
	return &CarService{repo: repo}
}

func (s *CarService) GetAllCars() []model.Car {
	return s.repo.FindAll()
}

func (s *CarService) GetCarByID(id int) (model.Car, error) {
	if id <= 0 {
		return model.Car{}, ErrInvalidID
	}

	car, found := s.repo.FindByID(id)
	if !found {
		return model.Car{}, fmt.Errorf("%w: %d", ErrCarNotFound, id)
	}

	return car, nil
}

func (s *CarService) CreateCar(car model.Car) (model.Car, error) {
	if err := validateCar(car); err != nil {
		return model.Car{}, err
	}

	if s.isDuplicate(car, 0) {
		return model.Car{}, ErrDuplicate
	}

	return s.repo.Create(car), nil
}

func (s *CarService) UpdateCar(id int, car model.Car) (model.Car, error) {
	if id <= 0 {
		return model.Car{}, ErrInvalidID
	}

	if err := validateCar(car); err != nil {
		return model.Car{}, err
	}

	if _, found := s.repo.FindByID(id); !found {
		return model.Car{}, fmt.Errorf("%w: %d", ErrCarNotFound, id)
	}

	if s.isDuplicate(car, id) {
		return model.Car{}, ErrDuplicate
	}

	updated, found := s.repo.Update(id, car)
	if !found {
		return model.Car{}, fmt.Errorf("%w: %d", ErrCarNotFound, id)
	}

	return updated, nil
}

func (s *CarService) DeleteCar(id int) error {
	if id <= 0 {
		return ErrInvalidID
	}

	if deleted := s.repo.Delete(id); !deleted {
		return fmt.Errorf("%w: %d", ErrCarNotFound, id)
	}

	return nil
}

func validateCar(car model.Car) error {
	if strings.TrimSpace(car.Brand) == "" ||
		strings.TrimSpace(car.Model) == "" ||
		car.Year < 1886 ||
		car.Year > 2100 {
		return ErrInvalidCar
	}

	return nil
}

func (s *CarService) isDuplicate(candidate model.Car, excludedID int) bool {
	for _, existing := range s.repo.FindAll() {
		if existing.ID == excludedID {
			continue
		}

		sameBrand := strings.EqualFold(
			strings.TrimSpace(existing.Brand),
			strings.TrimSpace(candidate.Brand),
		)
		sameModel := strings.EqualFold(
			strings.TrimSpace(existing.Model),
			strings.TrimSpace(candidate.Model),
		)

		if sameBrand && sameModel && existing.Year == candidate.Year {
			return true
		}
	}

	return false
}
