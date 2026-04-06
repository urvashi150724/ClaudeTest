import express from "express";
import upload from "../config/multer.js";
import {
  uploadTestSuite,
  getProjectUploads,
  parseTestSuite,
  normalizeTestSuite,
  getNormalizedTestCases
} from "../controllers/upload.controller.js";

const router = express.Router();

router.post("/:projectId", upload.single("file"), uploadTestSuite);
router.get("/:projectId", getProjectUploads);
router.post("/:projectId/:suiteId/parse", parseTestSuite);
router.post("/:projectId/:suiteId/normalize", normalizeTestSuite);
router.get("/:projectId/:suiteId/normalized", getNormalizedTestCases);

export default router;