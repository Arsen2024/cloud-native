
const fs = require("fs");
const path = require("path");

const inputPath = path.join(__dirname, "../../data/cars.csv");

const readable = fs.createReadStream(inputPath, {
  highWaterMark: 64 * 1024,
});

const MAX_PENDING = 256;
const processingTasks = [];

let processedChunks = 0;
let processedBytes = 0;
let peakMemory = process.memoryUsage().rss;

const startTime = Date.now();

const memoryMonitor = setInterval(() => {
  const currentMemory = process.memoryUsage().rss;

  if (currentMemory > peakMemory) {
    peakMemory = currentMemory;
  }
}, 100);

function processChunk(chunk) {
  return new Promise((resolve) => {
    setTimeout(() => {
      processedChunks++;
      processedBytes += chunk.length;
      resolve();
    }, 10);
  });
}

readable.on("data", (chunk) => {
  // Не очікуємо завершення попередньої обробки.
  const task = processChunk(chunk);

  processingTasks.push(task);

  // Обмежуємо кількість одночасних операцій,
  // щоб черга не зростала безмежно.
  if (processingTasks.length >= MAX_PENDING) {
    readable.pause();

    Promise.all(processingTasks.splice(0)).then(() => {
      readable.resume();
    });
  }
});

readable.on("end", async () => {
  await Promise.all(processingTasks);

  clearInterval(memoryMonitor);

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log("\nNo-backpressure benchmark completed");
  console.log(`Processed chunks: ${processedChunks}`);
  console.log(
    `Processed data: ${(processedBytes / 1024 / 1024).toFixed(2)} MB`,
  );
  console.log(`Time: ${duration} seconds`);
  console.log(
    `Peak RSS memory: ${(peakMemory / 1024 / 1024).toFixed(2)} MB`,
  );
});

readable.on("error", (error) => {
  clearInterval(memoryMonitor);
  console.error("Reading error:", error);
});
