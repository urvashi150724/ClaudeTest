import Page from "../models/page.model.js";

export async function getProjectPages(req, res) {
  try {
    const { projectId } = req.params;

    const pages = await Page.find({ projectId }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: pages,
    });
  } catch (error) {
    console.error("getProjectPages error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch project pages",
      error: error.message,
    });
  }
}