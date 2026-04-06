import express from "express";
import cors from "cors";
import projectRoutes from "./routes/project.routes.js";
import uploadRoutes from "./routes/upload.routes.js";
import runRoutes from "./routes/run.routes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Claude test backend is running",
  });
});

app.use("/api/projects", projectRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/runs", runRoutes);

export default app;