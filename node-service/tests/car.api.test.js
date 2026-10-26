
const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");

const { createApp } = require("../src/app");

let server;
let baseUrl;

test("API endpoints", async (t) => {
  server = createApp();

  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });

  const address = server.address();
  baseUrl = `http://127.0.0.1:${address.port}`;

  t.after(async () => {
    await new Promise((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  });

  await t.test("GET /health returns 200", async () => {
    const response = await fetch(`${baseUrl}/health`);
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.status, "ok");
  });

  await t.test("GET /api/cars returns the initial cars", async () => {
    const response = await fetch(`${baseUrl}/api/cars`);
    const cars = await response.json();

    assert.equal(response.status, 200);
    assert.equal(cars.length, 2);
    assert.equal(cars[0].brand, "Toyota");
  });

  await t.test("POST /api/cars creates a car", async () => {
    const response = await fetch(`${baseUrl}/api/cars`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        brand: "Audi",
        model: "A6",
        year: 2023,
      }),
    });

    const car = await response.json();

    assert.equal(response.status, 201);
    assert.equal(car.id, 3);
    assert.equal(car.model, "A6");
  });

  await t.test("GET /api/cars/:id returns a car", async () => {
    const response = await fetch(`${baseUrl}/api/cars/3`);
    const car = await response.json();

    assert.equal(response.status, 200);
    assert.equal(car.id, 3);
    assert.equal(car.brand, "Audi");
  });

  await t.test("PUT /api/cars/:id updates a car", async () => {
    const response = await fetch(`${baseUrl}/api/cars/3`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        brand: "Audi",
        model: "A7",
        year: 2024,
      }),
    });

    const car = await response.json();

    assert.equal(response.status, 200);
    assert.equal(car.model, "A7");
    assert.equal(car.year, 2024);
  });

  await t.test("POST rejects invalid car data with 400", async () => {
    const response = await fetch(`${baseUrl}/api/cars`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        brand: "",
        model: "A6",
        year: 2023,
      }),
    });

    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(body.error, "INVALID_CAR_DATA");
  });

  await t.test("POST rejects duplicate cars with 409", async () => {
    const response = await fetch(`${baseUrl}/api/cars`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        brand: "Toyota",
        model: "Camry",
        year: 2022,
      }),
    });

    const body = await response.json();

    assert.equal(response.status, 409);
    assert.equal(body.error, "DUPLICATE_CAR");
  });

  await t.test("DELETE /api/cars/:id removes a car", async () => {
    const response = await fetch(`${baseUrl}/api/cars/3`);

    assert.equal(response.status, 200);

    const deleteResponse = await fetch(`${baseUrl}/api/cars/3`, {
      method: "DELETE",
    });

    assert.equal(deleteResponse.status, 204);

    const missingResponse = await fetch(`${baseUrl}/api/cars/3`);
    const body = await missingResponse.json();

    assert.equal(missingResponse.status, 404);
    assert.equal(body.error, "CAR_NOT_FOUND");
  });

  await t.test("Unknown routes return JSON 404", async () => {
    const response = await fetch(`${baseUrl}/unknown`);
    const body = await response.json();

    assert.equal(response.status, 404);
    assert.equal(body.error, "ROUTE_NOT_FOUND");
  });
});
