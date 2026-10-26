
class CarService {
  constructor(carRepository) {
    this.carRepository = carRepository;
  }

  getAllCars() {
    return this.carRepository.findAll();
  }

  getCarById(id) {
    this.validateId(id);

    const car = this.carRepository.findById(id);

    if (!car) {
      const error = new Error(`Car with id ${id} was not found`);
      error.statusCode = 404;
      error.code = "CAR_NOT_FOUND";
      throw error;
    }

    return car;
  }

  createCar(data) {
    this.validateCarData(data);
    this.checkDuplicate(data);

    return this.carRepository.create({
      brand: data.brand.trim(),
      model: data.model.trim(),
      year: data.year,
    });
  }

  updateCar(id, data) {
    this.validateId(id);
    this.validateCarData(data);

    const existingCar = this.carRepository.findById(id);

    if (!existingCar) {
      const error = new Error(`Car with id ${id} was not found`);
      error.statusCode = 404;
      error.code = "CAR_NOT_FOUND";
      throw error;
    }

    this.checkDuplicate(data, id);

    return this.carRepository.update(id, {
      brand: data.brand.trim(),
      model: data.model.trim(),
      year: data.year,
    });
  }

  deleteCar(id) {
    this.validateId(id);

    const deleted = this.carRepository.delete(id);

    if (!deleted) {
      const error = new Error(`Car with id ${id} was not found`);
      error.statusCode = 404;
      error.code = "CAR_NOT_FOUND";
      throw error;
    }
  }

  validateId(id) {
    if (!Number.isInteger(id) || id <= 0) {
      const error = new Error("Car ID must be a positive integer");
      error.statusCode = 400;
      error.code = "INVALID_CAR_ID";
      throw error;
    }
  }

  validateCarData(data) {
    if (!data || typeof data !== "object" || Array.isArray(data)) {
      const error = new Error("Car data must be a JSON object");
      error.statusCode = 400;
      error.code = "INVALID_CAR_DATA";
      throw error;
    }

    if (
      typeof data.brand !== "string" ||
      !data.brand.trim() ||
      typeof data.model !== "string" ||
      !data.model.trim()
    ) {
      const error = new Error("Brand and model must be non-empty strings");
      error.statusCode = 400;
      error.code = "INVALID_CAR_DATA";
      throw error;
    }

    if (
      !Number.isInteger(data.year) ||
      data.year < 1886 ||
      data.year > 2100
    ) {
      const error = new Error("Year must be an integer between 1886 and 2100");
      error.statusCode = 400;
      error.code = "INVALID_CAR_DATA";
      throw error;
    }
  }

  checkDuplicate(data, excludedId = null) {
    const normalizedBrand = data.brand.trim().toLowerCase();
    const normalizedModel = data.model.trim().toLowerCase();

    const duplicate = this.carRepository.findAll().some((car) => {
      return (
        car.id !== excludedId &&
        car.brand.toLowerCase() === normalizedBrand &&
        car.model.toLowerCase() === normalizedModel &&
        car.year === data.year
      );
    });

    if (duplicate) {
      const error = new Error(
        "A car with the same brand, model, and year already exists",
      );
      error.statusCode = 409;
      error.code = "DUPLICATE_CAR";
      throw error;
    }
  }
}

module.exports = CarService;
