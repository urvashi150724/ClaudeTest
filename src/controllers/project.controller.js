import Project from "../models/project.model.js";

export async function createProject(req, res) {
  try {
    const { projectName, description, liveUrl } = req.body;

    if (!projectName) {
      return res.status(400).json({
        success: false,
        message: "projectName is required",
      });
    }

    const project = await Project.create({
      projectName,
      description: description || "",
      liveUrl: liveUrl || "",
    });

    return res.status(201).json({
      success: true,
      message: "Project created successfully",
      data: project,
    });
  } catch (error) {
    console.error("createProject error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to create project",
      error: error.message,
    });
  }
}

export async function getAllProjects(req, res) {
  try {
    const projects = await Project.find().sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: projects,
    });
  } catch (error) {
    console.error("getAllProjects error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch projects",
      error: error.message,
    });
  }
}

export async function getProjectById(req, res) {
  try {
    const { projectId } = req.params;

    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: project,
    });
  } catch (error) {
    console.error("getProjectById error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch project",
      error: error.message,
    });
  }
}

export async function updateProjectLiveUrl(req, res) {
  try {
    const { projectId } = req.params;
    const { liveUrl } = req.body;

    if (!liveUrl) {
      return res.status(400).json({
        success: false,
        message: "liveUrl is required",
      });
    }

    const updatedProject = await Project.findByIdAndUpdate(
      projectId,
      { liveUrl },
      { new: true, runValidators: true }
    );

    if (!updatedProject) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Live URL updated successfully",
      data: updatedProject,
    });
  } catch (error) {
    console.error("updateProjectLiveUrl error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to update live URL",
      error: error.message,
    });
  }
}