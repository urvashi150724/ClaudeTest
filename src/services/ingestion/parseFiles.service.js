import fs from "fs";
import path from "path";
import csv from "csv-parser";

function parseTxtFile(filePath) {
    const content = fs.readFileSync(filePath, "utf-8");

    return {
        success: true,
        fileType: "txt",
        parsedContent: content,
    };
}

function parseJsonFile(filePath) {
  const content = fs.readFileSync(filePath, "utf-8");
  const parsedJson = JSON.parse(content);

  return {
    success: true,
    fileType: "json",
    parsedContent: parsedJson,
  };
}

function parseCsvFile(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];

    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (data) => results.push(data))
      .on("end", () => {
        resolve({
          success: true,
          fileType: "csv",
          parsedContent: results,
        });
      })
      .on("error", (error) => reject(error));
  });
}


export async function parseUploadedFile(filePath) {
  try {
    const ext = path.extname(filePath).toLowerCase();

    if (ext === ".txt") {
      return parseTxtFile(filePath);
    }

    if (ext === ".json") {
      return parseJsonFile(filePath);
    }

    if (ext === ".csv") {
      return await parseCsvFile(filePath);
    }

    return {
      success: false,
      message: `Unsupported file type: ${ext}`,
    };
  } catch (error) {
    return {
      success: false,
      message: "Failed to parse file",
      error: error.message,
    };
  }
}