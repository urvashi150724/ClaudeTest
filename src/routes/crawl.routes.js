import express from "express";

import { crawlProject } from "../controllers/crawl.controller.js";

const crawlRouter = express.Router();

crawlRouter.post("/:projectId/crawl", crawlProject);

export default crawlRouter;