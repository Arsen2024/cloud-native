
const test = require("node:test");
const assert = require("node:assert/strict");

const errorHandler = require("../src/middleware/error-handler");

function createMockResponse(overrides = {}) {
  const response = {
    writableEnded: false,
    destroyed: false,
    statusCode: null,
    headers: {},
    body: null,

    writeHead(statusCode, headers) {
      this.statusCode = statusCode;
      this.headers = headers;
    },

    end(body) {
      this.body = body;
      this.writableEnded = true;
    },

    ...overrides,
  };

  return response;
}

test("ErrorHandler returns the correct status and JSON for a 400 error", () => {
  const error = {
    statusCode: 400,
    code: "INVALID_CAR_DATA",
    message: "Invalid car data",
  };

  const req = {};
  const res = createMockResponse();

  errorHandler(error, req, res);

  assert.equal(res.statusCode, 400);
  assert.equal(
    res.headers["Content-Type"],
    "application/json; charset=utf-8",
  );
  assert.deepEqual(JSON.parse(res.body), {
    error: "INVALID_CAR_DATA",
    message: "Invalid car data",
  });
  assert.equal(res.writableEnded, true);
});

test("ErrorHandler hides internal details for a 500 error", () => {
  const error = {
    statusCode: 500,
    code: "DATABASE_FAILURE",
    message: "Sensitive database connection details",
  };

  const req = {};
  const res = createMockResponse();

  errorHandler(error, req, res);

  assert.equal(res.statusCode, 500);
  assert.deepEqual(JSON.parse(res.body), {
    error: "DATABASE_FAILURE",
    message: "An unexpected server error occurred",
  });
  assert.equal(
    res.body.includes("Sensitive database connection details"),
    false,
  );
});

test("ErrorHandler does not write when the response has already ended", () => {
  let writeHeadCalls = 0;
  let endCalls = 0;

  const req = {};
  const res = createMockResponse({
    writableEnded: true,

    writeHead() {
      writeHeadCalls += 1;
    },

    end() {
      endCalls += 1;
    },
  });

  errorHandler(
    {
      statusCode: 500,
      message: "Test error",
    },
    req,
    res,
  );

  assert.equal(writeHeadCalls, 0);
  assert.equal(endCalls, 0);
});

test("ErrorHandler does not write when the response is destroyed", () => {
  let writeHeadCalls = 0;
  let endCalls = 0;

  const req = {};
  const res = createMockResponse({
    destroyed: true,

    writeHead() {
      writeHeadCalls += 1;
    },

    end() {
      endCalls += 1;
    },
  });

  errorHandler(
    {
      statusCode: 500,
      message: "Test error",
    },
    req,
    res,
  );

  assert.equal(writeHeadCalls, 0);
  assert.equal(endCalls, 0);
});
