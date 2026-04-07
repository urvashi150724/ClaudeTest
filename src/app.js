import express from "express";
import cors from "cors";
import projectRoutes from "./routes/project.routes.js";
import uploadRoutes from "./routes/upload.routes.js";
import runRoutes from "./routes/run.routes.js";
import crawlRoutes from "./routes/crawl.routes.js";
import pageRoutes from "./routes/page.routes.js";
import mappingRoutes from "./routes/mapping.routes.js";

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
app.use("/api/projects", crawlRoutes);
app.use("/api/projects", pageRoutes);
app.use("/api/projects", mappingRoutes)
 

export default app;