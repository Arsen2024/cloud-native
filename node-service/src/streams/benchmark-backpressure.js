
const fs = require("fs");
const path = require("path");
const SlowWritable = require("./slow-writable");

const inputPath = path.join(__dirname, "../../data/cars.csv");

const readable = fs.createReadStream(inputPath, {
  highWaterMark: 64 * 1024,
});

const slowWritable = new SlowWritable();

const startTime = Date.now();
let peakMemory = process.memoryUsage().rss;

const memoryMonitor = setInterval(() => {
  const currentMemory = process.memoryUsage().rss;

  if (currentMemory > peakMemory) {
    peakMemory = currentMemory;
  }
}, 100);

readable.pipe(slowWritable);

slowWritable.on("finish", () => {
  clearInterval(memoryMonitor);

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log("\nBackpressure benchmark completed");
  console.log(`Processed chunks: ${slowWritable.processedChunks}`);
  console.log(
    `Processed data: ${(slowWritable.processedBytes / 1024 / 1024).toFixed(2)} MB`,
  );
  console.log(`Time: ${duration} seconds`);
  console.log(
    `Peak RSS memory: ${(peakMemory / 1024 / 1024).toFixed(2)} MB`,
  );
});

readable.on("error", (error) => {
  console.error("Reading error:", error);
});

slowWritable.on("error", (error) => {
  console.error("Writing error:", error);
});
