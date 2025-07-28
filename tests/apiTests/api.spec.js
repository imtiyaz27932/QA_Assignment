const { test, expect, request } = require("@playwright/test");
const Logger= require("../../utils/logger")
const fs = require("fs");
const path = require("path");
require("dotenv").config();


const TEMP_DIR = path.join(__dirname, "../temp");
const ASSETS_DIR = path.join(__dirname, "../assets");
const PDF_URL =
  "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf";
const CV_FILE = path.join(ASSETS_DIR, "cv.pdf");
const UPLOAD_RESPONSE_FILE = path.join(TEMP_DIR, "upload_response.json");

//  Create folders before tests
test.beforeAll(() => {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
  fs.mkdirSync(ASSETS_DIR, { recursive: true });
  Logger.info("Temporary and assets directories created.");
});



test.describe("📄 API File Upload using PDF & Auth Tests", () => {
  test("Should download a real PDF and save locally", async () => {
    Logger.info("Starting PDF download...");

    const apiContext = await request.newContext();
    const response = await apiContext.get(PDF_URL);
    expect(response.status()).toBe(200);

    const buffer = await response.body();
    fs.writeFileSync(CV_FILE, buffer);

    const stats = fs.statSync(CV_FILE);
    expect(stats.size).toBeGreaterThan(0);

    Logger.success("PDF downloaded and saved as 'cv.pdf'");
  });

    

  test(" Should upload downloaded PDF to ConvertAPI", async () => {
    Logger.info("Preparing for PDF upload...");

    const token = process.env.CONVERT_API_TOKEN;
    if (!token) {
      Logger.error("CONVERT_API_TOKEN is missing in .env");
      throw new Error("CONVERT_API_TOKEN is missing in .env");
    }

    if (!fs.existsSync(CV_FILE)) {
      Logger.error("File 'cv.pdf' not found in assets folder");
      throw new Error("File 'cv.pdf' not found in assets folder");
    }

    const apiContext = await request.newContext();

    Logger.info("Sending POST request to ConvertAPI with file...");
    const response = await apiContext.post(
      `${process.env.CONVERT_API_BASE}/upload`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        multipart: {
          File: fs.createReadStream(CV_FILE),
        },
      }
    );

    const result = await response.json();

    if (!response.ok()) {
      Logger.error(`Upload failed: ${JSON.stringify(result)}`);
      throw new Error("File upload failed");
    }

    fs.writeFileSync(UPLOAD_RESPONSE_FILE, JSON.stringify(result, null, 2));

    expect(result.FileName).toBeDefined();
    expect(result.FileExt).toBe("pdf");

    Logger.success(`CV PDF uploaded successfully as '${result.FileName}'`);
  });
    


  test(" Should verify token with ConvertAPI /user endpoint", async () => {
    Logger.info("Verifying ConvertAPI token with /user endpoint...");

    const token = process.env.CONVERT_API_TOKEN;
    if (!token) {
      Logger.error("CONVERT_API_TOKEN is missing in .env");
      throw new Error("CONVERT_API_TOKEN is missing in .env");
    }

    const apiContext = await request.newContext({
      baseURL: process.env.CONVERT_API_BASE,
      extraHTTPHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });

    const response = await apiContext.get("/user");
    const result = await response.json();

    expect(response.status()).toBe(200);
    expect(result.Active).toBe(true);
    expect(result.Email).toContain("@");

    Logger.success(`Authenticated user verified: ${result.Email}`);
  });
});
