import fs from "fs";
import path from "path";
import { chromium } from "playwright";

const screenshotDir = "src/data/screenshots";

if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true });
}

export async function executePlan(executionPlan) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const logs = [];
  const startTime = Date.now();

  let status = "passed";
  let error = "";
  let screenshotPath = "";

  try {
    for (const step of executionPlan.steps) {
      if (!step?.action) continue;

      logs.push(`Running action: ${step.action}`);

      switch (step.action) {
        case "goto":
          await page.goto(step.value, {
            waitUntil: "domcontentloaded",
            timeout: 20000,
          });
          break;

        case "fill":
          await page.fill(step.selector, step.value ?? "");
          break;

        case "click":
          await page.click(step.selector);
          break;

        case "assert_url_contains": {
          const currentUrl = page.url();
          if (!currentUrl.includes(step.value)) {
            throw new Error(
              `URL assertion failed. Current URL "${currentUrl}" does not include "${step.value}"`
            );
          }
          break;
        }

        case "assert_text_contains": {
          const bodyText = await page.locator("body").innerText();
          if (!bodyText.toLowerCase().includes(String(step.value).toLowerCase())) {
            throw new Error(
              `Text assertion failed. Page does not contain "${step.value}"`
            );
          }
          break;
        }

        default:
          throw new Error(`Unsupported action: ${step.action}`);
      }
    }
  } catch (err) {
    status = "failed";
    error = err.message;

    const fileName = `failure-${Date.now()}.png`;
    const fullPath = path.join(screenshotDir, fileName);

    await page.screenshot({
      path: fullPath,
      fullPage: true,
    });

    screenshotPath = fullPath;
    logs.push(`Execution failed: ${err.message}`);
  }

  const durationMs = Date.now() - startTime;

  await browser.close();

  return {
    status,
    error,
    screenshotPath,
    logs,
    durationMs,
  };
}