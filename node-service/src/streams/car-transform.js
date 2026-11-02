
const { Transform } = require("stream");

class CarTransform extends Transform {
  constructor(options = {}) {
    super();

    this.remaining = "";
    this.totalRecords = 0;
    this.brands = {};
    this.isHeader = true;

    this.totalBytes = options.totalBytes || 0;
    this.processedBytes = 0;
    this.lastProgress = 0;

    this.onProgress = options.onProgress || (() => {});
  }

  _transform(chunk, encoding, callback) {
    try {
      this.processedBytes += chunk.length;

      const data = this.remaining + chunk.toString();
      const lines = data.split("\n");

      this.remaining = lines.pop();

      for (const line of lines) {
        this.processLine(line);
      }

      // Надсилаємо прогрес приблизно кожні 5%,
      // а також після завершення читання.
      const progress = this.totalBytes
        ? Math.floor((this.processedBytes / this.totalBytes) * 100)
        : 0;

      if (
        progress >= this.lastProgress + 5 &&
        progress < 100
      ) {
        this.lastProgress = progress;

        this.onProgress({
          type: "progress",
          processed: this.processedBytes,
          total: this.totalBytes,
        });
      }

      callback();
    } catch (error) {
      callback(error);
    }
  }

  _flush(callback) {
    try {
      if (this.remaining.trim()) {
        this.processLine(this.remaining);
      }

      this.onProgress({
        type: "progress",
        processed: this.processedBytes,
        total: this.totalBytes,
      });

      const result = {
        totalRecords: this.totalRecords,
        brands: this.brands,
      };

      this.push(JSON.stringify(result, null, 2));

      console.log("\nCSV processing completed");
      console.log(`Total records: ${this.totalRecords}`);
      console.log("Cars by brand:", this.brands);

      callback();
    } catch (error) {
      callback(error);
    }
  }

  processLine(line) {
    if (!line.trim()) {
      return;
    }

    if (this.isHeader) {
      this.isHeader = false;
      return;
    }

    const columns = line.split(",");
    const brand = columns[1];

    if (!brand) {
      return;
    }

    this.totalRecords++;
    this.brands[brand] = (this.brands[brand] || 0) + 1;
  }
}

module.exports = CarTransform;
