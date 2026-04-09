import express from "express";

import{
    planAndRunProjectTests,
    getProjectExecutionResults,
    getTestRunSummary,
    getExecutionResultDetail
} from "../controllers/execution.controller.js";

const executionRouter = express.Router();

executionRouter.post("/:projectId/plan-and-run", planAndRunProjectTests);
executionRouter.get("/:projectId/results", getProjectExecutionResults);

executionRouter.get("/run/:testRunId", getTestRunSummary);
executionRouter.get("/result/:resultId", getExecutionResultDetail);

export default executionRouter;