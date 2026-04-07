import { mapTestCasesToPages } from "../services/mapping/ruleBasedMapper.service.js";

export async function mapProjectTestCases(req, res) {
  try {
    const { projectId } = req.params;

    const result = await mapTestCasesToPages(projectId);

    return res.status(200).json({
      success: true,
      message: "Test case mapping completed",
      data: result,
    });
  } catch (error) {
    console.error("mapProjectTestCases error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to map test cases to pages",
      error: error.message,
    });
  }
}