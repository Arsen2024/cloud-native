
class CarController {
  constructor(carService) {
    this.carService = carService;
  }

  getAllCars(req, res) {
    const cars = this.carService.getAllCars();

    res.writeHead(200, {
      "Content-Type": "application/json; charset=utf-8",
    });
    res.end(JSON.stringify(cars));
  }

  getCarById(req, res, id) {
    const car = this.carService.getCarById(id);

    res.writeHead(200, {
      "Content-Type": "application/json; charset=utf-8",
    });
    res.end(JSON.stringify(car));
  }

  createCar(req, res) {
    const car = this.carService.createCar(req.body);

    res.writeHead(201, {
      "Content-Type": "application/json; charset=utf-8",
    });
    res.end(JSON.stringify(car));
  }

  updateCar(req, res, id) {
    const car = this.carService.updateCar(id, req.body);

    res.writeHead(200, {
      "Content-Type": "application/json; charset=utf-8",
    });
    res.end(JSON.stringify(car));
  }

  deleteCar(req, res, id) {
    this.carService.deleteCar(id);

    res.writeHead(204);
    res.end();
  }
}

module.exports = CarController;
