
const { Writable } = require("stream");

class SlowWritable extends Writable {
  constructor(options = {}) {
    super({
      ...options,
      highWaterMark: 64 * 1024,
    });

    this.processedChunks = 0;
    this.processedBytes = 0;
  }

  _write(chunk, encoding, callback) {
    // Імітуємо повільну обробку даних.
    setTimeout(() => {
      this.processedChunks++;
      this.processedBytes += chunk.length;

      callback();
    }, 10);
  }
}

module.exports = SlowWritable;
