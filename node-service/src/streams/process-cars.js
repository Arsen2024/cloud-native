
const fs = require("fs");
const path = require("path");

const CarTransform = require("./car-transform");

const inputPath = path.join(__dirname, "../../data/cars.csv");
const outputPath = path.join(__dirname, "../../output/processed-cars.txt");

function processCars(onProgress = () => {}, onComplete = () => {}) {
  let completed = false;

  function finish(error = null) {
    if (completed) {
      return;
    }

    completed = true;
    onComplete(error);
  }

  let totalBytes;

  try {
    totalBytes = fs.statSync(inputPath).size;
  } catch (error) {
    finish(error);
    return;
  }

  const readable = fs.createReadStream(inputPath, {
    encoding: "utf8",
    highWaterMark: 64 * 1024,
  });

  const transform = new CarTransform({
    totalBytes,
    onProgress,
  });

  const writable = fs.createWriteStream(outputPath);

  readable
    .pipe(transform)
    .pipe(writable);

  readable.on("error", (error) => {
    console.error("Reading error:", error);
    finish(error);
  });

  transform.on("error", (error) => {
    console.error("Transform error:", error);
    finish(error);
  });

  writable.on("error", (error) => {
    console.error("Writing error:", error);
    finish(error);
  });

  writable.on("finish", () => {
    console.log(`Processing finished. Result: ${outputPath}`);
    finish();
  });
}

module.exports = processCars;

if (require.main === module) {
  processCars();
}
