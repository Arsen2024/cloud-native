
const test = require("node:test");
const assert = require("node:assert/strict");

const CarRepository = require("../src/repositories/car.repository");
const CarService = require("../src/services/car.service");

function createService() {
  const repository = new CarRepository();
  const service = new CarService(repository);

  return { repository, service };
}

test("getAllCars returns the initial cars", () => {
  const { service } = createService();

  const cars = service.getAllCars();

  assert.equal(cars.length, 2);
  assert.equal(cars[0].brand, "Toyota");
  assert.equal(cars[1].brand, "BMW");
});

test("createCar creates a new car", () => {
  const { service } = createService();

  const car = service.createCar({
    brand: "Audi",
    model: "A6",
    year: 2023,
  });

  assert.equal(car.id, 3);
  assert.equal(car.brand, "Audi");
  assert.equal(car.model, "A6");
  assert.equal(car.year, 2023);
});

test("createCar rejects invalid data", () => {
  const { service } = createService();

  assert.throws(
    () =>
      service.createCar({
        brand: "",
        model: "A6",
        year: 2023,
      }),
    { statusCode: 400, code: "INVALID_CAR_DATA" },
  );
});

test("createCar rejects duplicate cars", () => {
  const { service } = createService();

  assert.throws(
    () =>
      service.createCar({
        brand: "Toyota",
        model: "Camry",
        year: 2022,
      }),
    { statusCode: 409, code: "DUPLICATE_CAR" },
  );
});

test("getCarById returns 404 for a missing car", () => {
  const { service } = createService();

  assert.throws(
    () => service.getCarById(999),
    { statusCode: 404, code: "CAR_NOT_FOUND" },
  );
});

test("updateCar updates an existing car", () => {
  const { service } = createService();

  const car = service.updateCar(1, {
    brand: "Toyota",
    model: "Corolla",
    year: 2024,
  });

  assert.equal(car.id, 1);
  assert.equal(car.model, "Corolla");
  assert.equal(car.year, 2024);
});

test("deleteCar removes an existing car", () => {
  const { service } = createService();

  service.deleteCar(1);

  assert.equal(service.getAllCars().length, 1);
  assert.throws(
    () => service.getCarById(1),
    { statusCode: 404, code: "CAR_NOT_FOUND" },
  );
});
