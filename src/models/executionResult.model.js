import mongoose from "mongoose";

const executionResultSchema = new mongoose.Schema(
  {
    testRunId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TestRun",
      required: true,
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    testCaseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TestCase",
      required: true,
    },
    pageUrl: {
      type: String,
      default: "",
      trim: true,
    },
    executionPlan: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    status: {
      type: String,
      enum: ["pending", "passed", "failed"],
      default: "pending",
    },
    error: {
      type: String,
      default: "",
    },
    screenshotPath: {
      type: String,
      default: "",
      trim: true,
    },
    logs: {
      type: [String],
      default: [],
    },
    durationMs: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const ExecutionResult = mongoose.model("ExecutionResult", executionResultSchema);

export default ExecutionResult;