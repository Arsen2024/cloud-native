
const Car = require("../models/car");

class CarRepository {
  constructor() {
    this.cars = [
      new Car({
        id: 1,
        brand: "Toyota",
        model: "Camry",
        year: 2022,
      }),
      new Car({
        id: 2,
        brand: "BMW",
        model: "X5",
        year: 2021,
      }),
    ];

    this.nextId = 3;
  }

  findAll() {
    return [...this.cars];
  }

  findById(id) {
    return this.cars.find((car) => car.id === id) ?? null;
  }

  create(data) {
    const car = new Car({
      id: this.nextId++,
      brand: data.brand,
      model: data.model,
      year: data.year,
    });

    this.cars.push(car);
    return car;
  }

  update(id, data) {
    const car = this.findById(id);

    if (!car) {
      return null;
    }

    car.brand = data.brand;
    car.model = data.model;
    car.year = data.year;

    return car;
  }

  delete(id) {
    const index = this.cars.findIndex((car) => car.id === id);

    if (index === -1) {
      return false;
    }

    this.cars.splice(index, 1);
    return true;
  }
}

module.exports = CarRepository;
