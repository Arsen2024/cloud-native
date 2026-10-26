
const http = require("http");
const { URL } = require("url");

const CarRepository = require("./repositories/car.repository");
const CarService = require("./services/car.service");
const CarController = require("./controllers/car.controller");
const createCarRoutes = require("./routes/car.routes");

const requestLogger = require("./middleware/request-logger");
const errorHandler = require("./middleware/error-handler");

function createApp() {
  const carRepository = new CarRepository();
  const carService = new CarService(carRepository);
  const carController = new CarController(carService);
  const carRoutes = createCarRoutes(carController, errorHandler);

  const server = http.createServer((req, res) => {
    requestLogger(req, res, () => {
      handleRequest(req, res, carRoutes);
    });
  });

  return server;
}

function handleRequest(req, res, carRoutes) {
  try {
    const url = new URL(req.url, "http://localhost");
    const pathname = url.pathname;

    if (pathname === "/health" && req.method === "GET") {
      sendJson(res, 200, { status: "ok" });
      return;
    }

    if (pathname === "/io" && req.method === "GET") {
      setTimeout(() => {
        sendJson(res, 200, {
          message: "I/O operation completed",
        });
      }, 1000);
      return;
    }

    if (pathname === "/cpu" && req.method === "GET") {
      let counter = 0;

      for (let i = 0; i < 1_000_000_000; i++) {
        counter++;
      }

      sendJson(res, 200, {
        message: "CPU operation completed",
        counter,
      });
      return;
    }

    const handled = carRoutes(req, res, pathname);

    if (!handled) {
      const error = new Error("Route not found");
      error.statusCode = 404;
      error.code = "ROUTE_NOT_FOUND";
      errorHandler(error, req, res);
    }
  } catch (error) {
    errorHandler(error, req, res);
  }
}

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
  });
  res.end(JSON.stringify(data));
}

module.exports = { createApp };
