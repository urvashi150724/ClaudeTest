import mongoose from "mongoose";

const pageSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    url: {
      type: String,
      required: true,
      trim: true,
    },
    title: {
      type: String,
      default: "",
      trim: true,
    },
    statusCode: {
      type: Number,
      default: null,
    },
    screenshotPath: {
      type: String,
      default: "",
      trim: true,
    },
    pageText: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

const Page = mongoose.model("Page", pageSchema);

export default Page;