import fs from "fs";
import csv from "csv-parser";
import { Index } from "@upstash/vector";

// Install tsx to enable run typescript
// Run the file: npx tsx ./seed.ts

const index = new Index({
  url: "https://enough-burro-16462-us1-vector.upstash.io",
  token:
    "ABYFMGVub3VnaC1idXJyby0xNjQ2Mi11czFhZG1pbllqSXhPR1k0WVdVdE9UTTVOeTAwWlRrMUxXSmhPRFl0T1RrMFpXWXhaVFU1Tm1SbA==",
});

interface Row {
  text: string;
}

async function parseCSV(filePath: string): Promise<Row[]> {
  return new Promise((resolve, reject) => {
    const rows: Row[] = [];

    fs.createReadStream(filePath)
      .pipe(csv({ separator: "," }))
      .on("data", (row) => {
        rows.push(row);
      })
      .on("error", (err) => {
        reject(err);
      })
      .on("end", () => {
        resolve(rows);
      });
  });
}

const STEP = 30;
const seed = async () => {
  const data = await parseCSV("training_data.csv");
  // console.log(data);

  for (let i = 0; i < data.length; i += STEP) {
    const chunk = data.slice(i, i + STEP);

    const formatted = chunk.map((row, batchIndex) => {
      return {
        data: row.text,
        id: i + batchIndex,
        metadata: {
          text: row.text,
        },
      };
    });

    // console.log("upsert", formatted);
    await index.upsert(formatted);
  }
};

seed();
