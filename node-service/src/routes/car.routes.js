
function createCarRoutes(carController, errorHandler) {
  return function carRoutes(req, res, pathname) {
    const collectionPath = "/api/cars";
    const itemMatch = pathname.match(/^\/api\/cars\/([^/]+)$/);

    try {
      if (pathname === collectionPath) {
        if (req.method === "GET") {
          carController.getAllCars(req, res);
          return true;
        }

        if (req.method === "POST") {
          readBody(req, (error, body) => {
            if (error) {
              errorHandler(error, req, res);
              return;
            }

            try {
              req.body = body;
              carController.createCar(req, res);
            } catch (handlerError) {
              errorHandler(handlerError, req, res);
            }
          });

          return true;
        }

        return false;
      }

      if (itemMatch) {
        const rawId = itemMatch[1];
        const id = /^\d+$/.test(rawId) ? Number(rawId) : NaN;

        if (req.method === "GET") {
          carController.getCarById(req, res, id);
          return true;
        }

        if (req.method === "PUT") {
          readBody(req, (error, body) => {
            if (error) {
              errorHandler(error, req, res);
              return;
            }

            try {
              req.body = body;
              carController.updateCar(req, res, id);
            } catch (handlerError) {
              errorHandler(handlerError, req, res);
            }
          });

          return true;
        }

        if (req.method === "DELETE") {
          carController.deleteCar(req, res, id);
          return true;
        }

        return false;
      }

      return false;
    } catch (error) {
      errorHandler(error, req, res);
      return true;
    }
  };
}

function readBody(req, callback) {
  let body = "";
  let finished = false;

  function fail(error) {
    if (finished) {
      return;
    }

    finished = true;
    callback(error);
  }

  req.on("data", (chunk) => {
    if (finished) {
      return;
    }

    body += chunk.toString();

    if (Buffer.byteLength(body, "utf8") > 1_000_000) {
      const error = new Error("Request body is too large");
      error.statusCode = 413;
      error.code = "BODY_TOO_LARGE";
      fail(error);
      req.resume();
    }
  });

  req.on("end", () => {
    if (finished) {
      return;
    }

    try {
      const data = JSON.parse(body);
      finished = true;
      callback(null, data);
    } catch {
      const error = new Error("Request body contains invalid JSON");
      error.statusCode = 400;
      error.code = "INVALID_JSON";
      fail(error);
    }
  });

  req.on("error", (error) => {
    error.statusCode = 400;
    error.code = "REQUEST_READ_ERROR";
    fail(error);
  });
}

module.exports = createCarRoutes;
