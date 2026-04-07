import express from "express";

import { getProjectPages } from "../controllers/page.controller.js";

const pageRouter = express.Router();

pageRouter.get("/:projectId/pages", getProjectPages);

export default pageRouter;      