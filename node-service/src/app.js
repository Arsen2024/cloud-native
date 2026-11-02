
const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");

const CarRepository = require("./repositories/car.repository");
const CarService = require("./services/car.service");
const CarController = require("./controllers/car.controller");
const WebSocketServerManager = require("./websocket/websocket-server");
const createCarRoutes = require("./routes/car.routes");

const requestLogger = require("./middleware/request-logger");
const errorHandler = require("./middleware/error-handler");
const processCars = require("./streams/process-cars");

function createApp() {
  const carRepository = new CarRepository();
  const carService = new CarService(carRepository);
  const carController = new CarController(carService);
  const carRoutes = createCarRoutes(carController, errorHandler);

  let websocketServer;

  let isProcessing = false;

  const server = http.createServer((req, res) => {
    requestLogger(req, res, () => {
      handleRequest(req, res, carRoutes, websocketServer, () => isProcessing, (value) => {
        isProcessing = value;
      });
    });
  });

  websocketServer = new WebSocketServerManager(server);

  server.websocketServer = websocketServer;

  return server;
}

function handleRequest(
  req,
  res,
  carRoutes,
  websocketServer,
  getIsProcessing,
  setIsProcessing,
) {
  try {
    const url = new URL(req.url, "http://localhost");
    const pathname = url.pathname;

    if (pathname === "/health" && req.method === "GET") {
      sendJson(res, 200, { status: "ok" });
      return;
    }

  if (pathname === "/api/cars/process" && req.method === "POST") {
    if (getIsProcessing()) {
      sendJson(res, 409, {
        error: "CSV processing is already running",
      });
      return;
    }

    const inputPath = path.join(__dirname, "../data/cars.csv");

    if (!fs.existsSync(inputPath)) {
      sendJson(res, 404, {
        error: "CSV file not found",
      });
      return;
    }

    const totalBytes = fs.statSync(inputPath).size;

    setIsProcessing(true);

    sendJson(res, 202, {
      message: "CSV processing started",
      totalBytes,
    });

    processCars(
      (progress) => {
        websocketServer.broadcastProgress(progress);
      },
      (error) => {
        setIsProcessing(false);

        if (error) {
          console.error("CSV processing failed:", error);
        }
      },
    );

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
