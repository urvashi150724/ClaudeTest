import Project from "../models/project.model.js";
import TestCase from "../models/testCase.model.js";
import Page from "../models/page.model.js";
import TestRun from "../models/testRun.model.js";
import ExecutionResult from "../models/executionResult.model.js";
import { planExecutionWithClaude } from "../services/claude/planExecution.service.js";
import { executePlan } from "../services/execution/executePlan.service.js";

export async function planAndRunProjectTests(req, res) {
  try {
    const { projectId } = req.params;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    const testCases = await TestCase.find({ projectId }).sort({ createdAt: 1 });
    const pages = await Page.find({ projectId }).sort({ createdAt: 1 });

    if (!testCases.length) {
      return res.status(400).json({
        success: false,
        message: "No normalized test cases found for this project",
      });
    }

    if (!pages.length) {
      return res.status(400).json({
        success: false,
        message: "No crawled pages found for this project",
      });
    }

    const testRun = await TestRun.create({
      projectId,
      status: "running",
      totalTestCases: testCases.length,
      startedAt: new Date(),
    });

    const runResults = [];
    let passedCount = 0;
    let failedCount = 0;

    const lightweightPages = pages.map((page) => ({
      url: page.url,
      title: page.title || "",
      path: page.path || "",
      pageText: page.pageText || "",
    }));

    for (const testCase of testCases) {
      const planningResult = await planExecutionWithClaude({
        testCase: {
          id: testCase._id,
          title: testCase.title,
          testType: testCase.testType,
          pageScope: testCase.pageScope,
          steps: testCase.steps,
          expectedResult: testCase.expectedResult,
          assertionType: testCase.assertionType,
          priority: testCase.priority,
        },
        pages: lightweightPages,
      });

      if (!planningResult.success) {
        failedCount += 1;

        const failedDoc = await ExecutionResult.create({
          testRunId: testRun._id,
          projectId,
          testCaseId: testCase._id,
          pageUrl: "",
          executionPlan: null,
          status: "failed",
          error:
            planningResult.message || planningResult.error || "Planning failed",
          logs: [
            planningResult.rawResponse || "",
            planningResult.cleanedResponse || "",
          ].filter(Boolean),
          durationMs: 0,
        });

        runResults.push(failedDoc);
        continue;
      }

      const executionPlan = planningResult.executionPlan;

      const executionOutput = await executePlan(executionPlan);

      const status = executionOutput.status === "passed" ? "passed" : "failed";

      if (status === "passed") {
        passedCount += 1;
      } else {
        failedCount += 1;
      }

      const savedResult = await ExecutionResult.create({
        testRunId: testRun._id,
        projectId,
        testCaseId: testCase._id,
        pageUrl: executionPlan.matchedPage?.url || "",
        executionPlan,
        status,
        error: executionOutput.error || "",
        screenshotPath: executionOutput.screenshotPath || "",
        logs: executionOutput.logs || [],
        durationMs: executionOutput.durationMs || 0,
      });

      runResults.push(savedResult);
    }

    const finalRunStatus = failedCount > 0 ? "completed" : "completed";

    const updatedRun = await TestRun.findByIdAndUpdate(
      testRun._id,
      {
        status: finalRunStatus,
        passedCount,
        failedCount,
        completedAt: new Date(),
      },
      { new: true },
    );

    return res.status(200).json({
      success: true,
      message: "Project test execution completed",
      data: {
        testRun: updatedRun,
        resultsCount: runResults.length,
        passedCount,
        failedCount,
        results: runResults,
      },
    });
  } catch (error) {
    console.error("planAndRunProjectTests error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to plan and run project tests",
      error: error.message,
    });
  }
}

export async function getProjectExecutionResults(req, res) {
  try {
    const { projectId } = req.params;

    const results = await ExecutionResult.find({ projectId })
      .populate("testCaseId", "title testType pageScope")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error("getProjectExecutionResults error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch execution results",
      error: error.message,
    });
  }
}

export async function getTestRunSummary(req, res) {
  try {
    const testRunId = String(req.params.testRunId || "").trim();

    const testRun = await TestRun.findById(testRunId).populate(
      "projectId",
      "projectName liveUrl",
    );

    if (!testRun) {
      return res.status(404).json({
        success: false,
        message: "Test run not found",
      });
    }

    const results = await ExecutionResult.find({ testRunId })
      .select("status durationMs")
      .lean();

    const summary = {
      totalResults: results.length,
      passedCount: results.filter((item) => item.status === "passed").length,
      failedCount: results.filter((item) => item.status === "failed").length,
      totalDurationMs: results.reduce(
        (sum, item) => sum + (item.durationMs || 0),
        0,
      ),
    };

    return res.status(200).json({
      success: true,
      data: {
        testRun,
        summary,
      },
    });
  } catch (error) {
    console.error("getTestRunSummary error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch test run summary",
      error: error.message,
    });
  }
}

export async function getExecutionResultDetail(req, res) {
  try {
    const resultId = String(req.params.resultId || "").trim();

    const result = await ExecutionResult.findById(resultId)
      .populate(
        "testCaseId",
        "title testType pageScope steps expectedResult priority",
      )
      .populate("testRunId", "status startedAt completedAt projectId");

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Execution result not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("getExecutionResultDetail error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch execution result detail",
      error: error.message,
    });
  }
}
