import mongoose from "mongoose";

const resultSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    runId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Run",
      required: true,
    },
    testCaseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TestCase",
      required: true,
    },
    pageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Page",
      default: null,
    },
    verdict: {
      type: String,
      enum: ["pass", "fail", "warning", "not_run"],
      default: "not_run",
    },
    severity: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const Result = mongoose.model("Result", resultSchema);

export default Result;