import mongoose from "mongoose";

const testSuiteSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    suiteType: {
      type: String,
      enum: ["ux_ui", "frontend", "backend"],
      required: true,
    },
    originalFileName: {
      type: String,
      required: true,
      trim: true,
    },
    storedFilePath: {
      type: String,
      required: true,
      trim: true,
    },
    mimeType: {
      type: String,
      default: "",
      trim: true,
    },
    uploadStatus: {
      type: String,
      enum: ["uploaded", "parsed", "failed"],
      default: "uploaded",
    },
     parsedContent: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    normalizedContent: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const TestSuite = mongoose.model("TestSuite", testSuiteSchema);

export default TestSuite;