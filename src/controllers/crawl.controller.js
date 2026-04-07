import { crawlSite } from "../services/crawler/crawlSite.service.js";

export async function crawlProject(req, res) {
  try {
    const { projectId } = req.params;

    const result = await crawlSite(projectId);

    return res.json({
      success: true,
      message: "Crawl completed",
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Crawl failed",
      error: error.message,
    });
  }
}
