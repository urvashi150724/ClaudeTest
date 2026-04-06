import express from "express";
import {
  createProject,
  getAllProjects,
  getProjectById,
  updateProjectLiveUrl,
} from "../controllers/project.controller.js";

const router = express.Router();

router.post("/", createProject);
router.get("/", getAllProjects);
router.get("/:projectId", getProjectById);
router.patch("/:projectId/live-url", updateProjectLiveUrl);

export default router;