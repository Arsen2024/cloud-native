package repository

import "go-service/internal/model"

// CarRepository визначає контракт для роботи з автомобілями.
type CarRepository interface {
	FindAll() []model.Car
	FindByID(id int) (model.Car, bool)
	Create(car model.Car) model.Car
	Update(id int, car model.Car) (model.Car, bool)
	Delete(id int) bool
}
