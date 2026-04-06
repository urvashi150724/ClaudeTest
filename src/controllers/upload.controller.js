import Project from "../models/project.model.js";
import TestSuite from "../models/testSuite.model.js";
import TestCase from "../models/testCase.model.js";
import { parseUploadedFile } from "../services/ingestion/parseFiles.service.js";
import { normalizeTestCasesWithClaude } from "../services/claude/normalizeTestCases.service.js";
import fs from "fs";

export async function uploadTestSuite(req, res) {
  try {
    const { projectId } = req.params;
    const { suiteType } = req.body;

    if (!suiteType) {
      return res.status(400).json({
        success: false,
        message: "suiteType is required",
      });
    }

    if (!["ux_ui", "frontend", "backend"].includes(suiteType)) {
      return res.status(400).json({
        success: false,
        message: "suiteType must be one of: ux_ui, frontend, backend",
      });
    }

    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "File is required",
      });
    }

    const testSuite = await TestSuite.create({
      projectId,
      suiteType,
      originalFileName: req.file.originalname,
      storedFilePath: req.file.path,
      mimeType: req.file.mimetype,
      uploadStatus: "uploaded",
    });

    return res.status(201).json({
      success: true,
      message: "Test suite uploaded successfully",
      data: testSuite,
    });
  } catch (error) {
    console.error("uploadTestSuite error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to upload test suite",
      error: error.message,
    });
  }
}

export async function getProjectUploads(req, res) {
  try {
    const { projectId } = req.params;

    const uploads = await TestSuite.find({ projectId }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: uploads,
    });
  } catch (error) {
    console.error("getProjectUploads error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch uploads",
      error: error.message,
    });
  }
}

export async function parseTestSuite(req, res) {
  try {
    const { projectId, suiteId } = req.params;

    const testSuite = await TestSuite.findOne({ _id: suiteId, projectId });

    if (!testSuite) {
      return res.status(404).json({
        success: false,
        message: "Test suite not found for this project",
      });
    }

    if (!fs.existsSync(testSuite.storedFilePath)) {
      return res.status(404).json({
        success: false,
        message: "Uploaded file not found on disk",
      });
    }

    const parseResult = await parseUploadedFile(testSuite.storedFilePath);

    if (!parseResult.success) {
      await TestSuite.findByIdAndUpdate(testSuite._id, {
        uploadStatus: "failed",
      });

      return res.status(400).json(parseResult);
    }

    const updatedSuite = await TestSuite.findByIdAndUpdate(
      testSuite._id,
      {
        uploadStatus: "parsed",
        parsedContent: parseResult.parsedContent,
      },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: "Test suite parsed successfully",
      data: {
        suiteId: updatedSuite._id,
        fileType: parseResult.fileType,
        uploadStatus: updatedSuite.uploadStatus,
        parsedContent: parseResult.parsedContent,
      },
    });
  } catch (error) {
    console.error("parseTestSuite error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to parse test suite",
      error: error.message,
    });
  }
}

export async function normalizeTestSuite(req, res) {
  try {
    const { projectId, suiteId } = req.params;

    const testSuite = await TestSuite.findOne({ _id: suiteId, projectId });

    if (!testSuite) {
      return res.status(404).json({
        success: false,
        message: "Test suite not found for this project",
      });
    }

    if (!testSuite.parsedContent) {
      return res.status(400).json({
        success: false,
        message: "Test suite must be parsed before normalization",
      });
    }

    const normalizeResult = await normalizeTestCasesWithClaude({
      parsedContent: testSuite.parsedContent,
      suiteType: testSuite.suiteType,
    });

    if (!normalizeResult.success) {
      await TestSuite.findByIdAndUpdate(testSuite._id, {
        uploadStatus: "failed",
      });

      return res.status(400).json(normalizeResult);
    }

    const normalizedCases = normalizeResult.normalizedTestCases;

    const preparedDocs = normalizedCases.map((item) => ({
      projectId,
      suiteId,
      testType: testSuite.suiteType,
      title: item.title || "Untitled Test Case",
      pageScope: item.pageScope || "",
      steps: Array.isArray(item.steps) ? item.steps : [],
      expectedResult: item.expectedResult || "",
      assertionType: item.assertionType || "functional_check",
      priority: item.priority || "medium",
      rawContent:
        typeof testSuite.parsedContent === "string"
          ? testSuite.parsedContent
          : JSON.stringify(testSuite.parsedContent),
      normalizedContent: item,
      status: "normalized",
    }));

    await TestCase.deleteMany({ projectId, suiteId });
    const savedTestCases = await TestCase.insertMany(preparedDocs);

    const updatedSuite = await TestSuite.findByIdAndUpdate(
      testSuite._id,
      {
        uploadStatus: "normalized",
        normalizedContent: normalizedCases,
      },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: "Test suite normalized successfully",
      data: {
        suiteId: updatedSuite._id,
        uploadStatus: updatedSuite.uploadStatus,
        testCasesCreated: savedTestCases.length,
        normalizedTestCases: savedTestCases,
      },
    });
  } catch (error) {
    console.error("normalizeTestSuite error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to normalize test suite",
      error: error.message,
    });
  }
}

export async function getNormalizedTestCases(req, res) {
  try {
    const { projectId, suiteId } = req.params;

    const testCases = await TestCase.find({ projectId, suiteId }).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      data: testCases,
    });
  } catch (error) {
    console.error("getNormalizedTestCases error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch normalized test cases",
      error: error.message,
    });
  }
}