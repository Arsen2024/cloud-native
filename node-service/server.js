const http = require("http");

const PORT = 3000;

const cars = [
  {
    id: 1,
    brand: "Toyota",
    model: "Camry",
    year: 2022,
  },
  {
    id: 2,
    brand: "BMW",
    model: "X5",
    year: 2021,
  },
];

const server = http.createServer((req, res) => {
  if (req.method === "GET" && req.url === "/cars") {
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify(cars));
  return;
  }
  
  if (req.method === "GET" && req.url.startsWith("/cars/")) {
  const id = Number(req.url.split("/")[2]);
  const car = cars.find((car) => car.id === id);

  if (!car) {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Car not found" }));
    return;
  }

  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify(car));
  return;
  }

  if (req.method === "POST" && req.url === "/cars") {
  let body = "";

  req.on("data", (chunk) => {
    body += chunk;
  });

  req.on("end", () => {
    try {
      const data = JSON.parse(body);

      if (!data.brand || !data.model || !data.year) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Invalid car data" }));
        return;
      }

      const newCar = {
        id: cars.length > 0 ? cars[cars.length - 1].id + 1 : 1,
        brand: data.brand,
        model: data.model,
        year: data.year,
      };

      cars.push(newCar);

      res.writeHead(201, { "Content-Type": "application/json" });
      res.end(JSON.stringify(newCar));
    } catch {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Invalid JSON" }));
    }
  });

  return;
  }

  if (req.method === "PUT" && req.url.startsWith("/cars/")) {
  const id = Number(req.url.split("/")[2]);
  const car = cars.find((car) => car.id === id);

  if (!car) {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Car not found" }));
    return;
  }

  let body = "";

  req.on("data", (chunk) => {
    body += chunk;
  });

  req.on("end", () => {
    try {
      const data = JSON.parse(body);

      if (!data.brand || !data.model || !data.year) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Invalid car data" }));
        return;
      }

      car.brand = data.brand;
      car.model = data.model;
      car.year = data.year;

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(car));
    } catch {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Invalid JSON" }));
    }
  });

  return;
  }

  if (req.method === "DELETE" && req.url.startsWith("/cars/")) {
  const id = Number(req.url.split("/")[2]);
  const index = cars.findIndex((car) => car.id === id);

  if (index === -1) {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Car not found" }));
    return;
  }

  cars.splice(index, 1);

  res.writeHead(204);
  res.end();
  return;
  }
    
  if (req.method === "GET" && req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok" }));
    return;
  }

  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Not Found" }));
});

server.listen(PORT, () => {
  console.log(`Node.js server is running on http://localhost:${PORT}`);
});