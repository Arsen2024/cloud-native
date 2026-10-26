
function errorHandler(error, req, res) {
  if (res.writableEnded || res.destroyed) {
    return;
  }

  const statusCode = Number.isInteger(error.statusCode)
    ? error.statusCode
    : 500;

  const messages = {
    400: "Bad Request",
    404: "Not Found",
    409: "Conflict",
    413: "Payload Too Large",
    500: "Internal Server Error",
  };

  const response = {
    error: error.code || "INTERNAL_SERVER_ERROR",
    message:
      statusCode === 500
        ? "An unexpected server error occurred"
        : error.message || messages[statusCode] || "Request failed",
  };

  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
  });

  res.end(JSON.stringify(response));
}

module.exports = errorHandler;
