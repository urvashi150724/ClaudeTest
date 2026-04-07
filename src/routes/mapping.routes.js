import express from "express";
import { mapProjectTestCases } from "../controllers/mapping.controller.js";

const mappingRouter = express.Router();

mappingRouter.post("/:projectId/map-testcases", mapProjectTestCases);

export default mappingRouter;