
function requestLogger(req, res, next) {
  const startTime = process.hrtime.bigint();

  const originalWriteHead = res.writeHead;

  res.writeHead = function (statusCode, ...args) {
    res.statusCode = statusCode;
    return originalWriteHead.call(this, statusCode, ...args);
  };

  res.on("finish", () => {
    const durationMs =
      Number(process.hrtime.bigint() - startTime) / 1_000_000;

    console.log(
      `${req.method} ${req.url} ${res.statusCode} ${durationMs.toFixed(2)} ms`,
    );
  });

  next();
}

module.exports = requestLogger;
