
const fs = require("fs");
const path = require("path");

const outputPath = path.join(
  __dirname,
  "../../data/cars.csv",
);

const TOTAL_RECORDS = 5_000_000;

function generateData() {
  const output = fs.createWriteStream(outputPath);

  let currentRecord = 0;

  function write() {
    let canContinue = true;

    while (currentRecord < TOTAL_RECORDS && canContinue) {
      if (currentRecord === 0) {
        canContinue = output.write("id,brand,model,year\n");
      } else {
        const id = currentRecord;
        const brand = ["Toyota", "BMW", "Audi", "Nissan"][
          currentRecord % 4
        ];
        const model = ["Camry", "X5", "A6", "X-Trail"][
          currentRecord % 4
        ];
        const year = 2010 + (currentRecord % 15);

        const row = `${id},${brand},${model},${year}\n`;

        canContinue = output.write(row);
      }

      currentRecord++;
    }

    if (currentRecord < TOTAL_RECORDS) {
      output.once("drain", write);
    } else {
      output.end();
    }
  }

  output.on("finish", () => {
    console.log("CSV file generated successfully");
    console.log(`Records: ${TOTAL_RECORDS - 1}`);
    console.log(`File: ${outputPath}`);
  });

  output.on("error", (error) => {
    console.error("CSV generation failed:", error);
  });

  write();
}

generateData();
