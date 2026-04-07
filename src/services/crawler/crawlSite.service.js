import { chromium } from "playwright";
import Page from "../../models/page.model.js";
import Project from "../../models/project.model.js";
import { URL } from "url";

function normalizeUrl(base, href) {
  try {
    return new URL(href, base).href.split("#")[0];
  } catch {
    return null;
  }
}

function isInternal(url, baseDomain) {
  try {
    return new URL(url).hostname === baseDomain;
  } catch {
    return false;
  }
}

export async function crawlSite(projectId) {
  const project = await Project.findById(projectId);

  if (!project) {
    throw new Error("Project not found");
  }

  const baseUrl = project.liveUrl;
  const baseDomain = new URL(baseUrl).hostname;

  const browser = await chromium.launch();
  const page = await browser.newPage();

  const visited = new Set();
  const queue = [baseUrl];

  const discoveredPages = [];

  while (queue.length && visited.size < 50) {
    const currentUrl = queue.shift();

    if (!currentUrl || visited.has(currentUrl)) continue;

    visited.add(currentUrl);

    try {
      await page.goto(currentUrl, { timeout: 15000 });

      const title = await page.title();

      discoveredPages.push({
        projectId,
        url: currentUrl,
        path: new URL(currentUrl).pathname,
        title,
        status: "active",
      });

      const links = await page.$$eval("a", (anchors) =>
        anchors.map((a) => a.href),
      );

      for (const href of links) {
        const normalized = normalizeUrl(currentUrl, href);
        if (!normalized) continue;

        if (!isInternal(normalized, baseDomain)) continue;

        if (!visited.has(normalized)) {
          queue.push(normalized);
        }
      }
    } catch (err) {
      discoveredPages.push({
        projectId,
        url: currentUrl,
        path: new URL(currentUrl).pathname,
        title: "",
        status: "error",
      });
    }
  }

  await browser.close();

  await Page.insertMany(discoveredPages, { ordered: false });

  return {
    totalDiscovered: discoveredPages.length,
  };
}
