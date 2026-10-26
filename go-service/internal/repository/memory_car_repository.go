package repository

import "go-service/internal/model"

// MemoryCarRepository зберігає автомобілі в оперативній пам'яті.
type MemoryCarRepository struct {
	cars   []model.Car
	nextID int
}

// NewMemoryCarRepository створює репозиторій з початковими даними.
func NewMemoryCarRepository() *MemoryCarRepository {
	return &MemoryCarRepository{
		cars: []model.Car{
			{ID: 1, Brand: "Toyota", Model: "Camry", Year: 2022},
			{ID: 2, Brand: "BMW", Model: "X5", Year: 2021},
		},
		nextID: 3,
	}
}

// FindAll повертає копію списку автомобілів.
func (r *MemoryCarRepository) FindAll() []model.Car {
	cars := make([]model.Car, len(r.cars))
	copy(cars, r.cars)
	return cars
}

// FindByID шукає автомобіль за його ID.
func (r *MemoryCarRepository) FindByID(id int) (model.Car, bool) {
	for _, car := range r.cars {
		if car.ID == id {
			return car, true
		}
	}
	return model.Car{}, false
}

// Create додає новий автомобіль.
func (r *MemoryCarRepository) Create(car model.Car) model.Car {
	car.ID = r.nextID
	r.nextID++
	r.cars = append(r.cars, car)
	return car
}

// Update оновлює автомобіль за ID.
func (r *MemoryCarRepository) Update(id int, updated model.Car) (model.Car, bool) {
	for i, car := range r.cars {
		if car.ID == id {
			updated.ID = id
			r.cars[i] = updated
			return updated, true
		}
	}
	return model.Car{}, false
}

// Delete видаляє автомобіль за ID.
func (r *MemoryCarRepository) Delete(id int) bool {
	for i, car := range r.cars {
		if car.ID == id {
			r.cars = append(r.cars[:i], r.cars[i+1:]...)
			return true
		}
	}
	return false
}

// Перевіряємо, що структура реалізує інтерфейс CarRepository.
var _ CarRepository = (*MemoryCarRepository)(nil)
