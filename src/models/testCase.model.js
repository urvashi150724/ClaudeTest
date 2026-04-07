import mongoose from "mongoose";

const testCaseSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    suiteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TestSuite",
      required: true,
    },
    testType: {
      type: String,
      enum: ["ux_ui", "frontend", "backend"],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    pageScope: {
      type: String,
      default: "",
      trim: true,
    },
    steps: {
      type: [String],
      default: [],
    },
    expectedResult: {
      type: String,
      default: "",
      trim: true,
    },
    assertionType: {
      type: String,
      default: "functional_check",
      trim: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
    },
    rawContent: {
      type: String,
      default: "",
    },
    normalizedContent: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    status: {
      type: String,
      enum: ["pending", "normalized", "failed"],
      default: "normalized",
    },
    matchedPageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Page",
      default: null,
    },
    matchedPageUrl: {
      type: String,
      default: "",
      trim: true,
    },
    mappingMethod: {
      type: String,
      default: "",
      trim: true,
    },
    mappingConfidence: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "low",
    },
  },
  {
    timestamps: true,
  },
);

const TestCase = mongoose.model("TestCase", testCaseSchema);

export default TestCase;
