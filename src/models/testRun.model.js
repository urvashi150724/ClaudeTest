import mongoose from "mongoose";

const testRunSchema = new mongoose.Schema({

     projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "running", "completed", "failed"],
      default: "pending",
    },
    totalTestCases: {
      type: Number,
      default: 0,
    },
    passedCount: {
      type: Number,
      default: 0,
    },
    failedCount: {
      type: Number,
      default: 0,
    },
    startedAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const TestRun = mongoose.model("TestRun", testRunSchema);

export default TestRun;

