import mongoose from "mongoose";

const runSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    runType: {
      type: String,
      enum: ["crawl", "normalize", "map", "execute", "full"],
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "running", "completed", "failed"],
      default: "pending",
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

const Run = mongoose.model("Run", runSchema);

export default Run;