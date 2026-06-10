import Task from "./task.model.js";
import { apiResponse } from "../../common/utils/apiResponse.js";

// Get tasks
export const getTasks = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, parseInt(req.query.limit, 10) || 10);
    const skip = (page - 1) * limit;

    const query = { userId: req.user._id };

    const totalTasks = await Task.countDocuments(query);
    const pendingCount = await Task.countDocuments({ ...query, status: "pending" });
    const completedCount = await Task.countDocuments({ ...query, status: "completed" });

    const tasks = await Task.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalPages = Math.ceil(totalTasks / limit);

    return res.status(200).json({
      tasks,
      totalTasks,
      totalPages,
      currentPage: page,
      pendingCount,
      completedCount,
    });
  } catch (error) {
    console.error("Get tasks error:", error.message);
    return apiResponse.error(res, 500, "Failed to fetch tasks.");
  }
};

// POST /api/tasks — create a new task
export const createTask = async (req, res) => {
  try {
    const { title, description } = req.body;

    const task = await Task.create({
      title,
      description,
      userId: req.user._id,
    });

    return res.status(201).json(task);
  } catch (error) {
    console.error("Create task error:", error.message);
    return apiResponse.error(res, 500, "Failed to create task.");
  }
};

// PUT /api/tasks/:id — update a task
export const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, status } = req.body;

    const task = await Task.findOne({ _id: id, userId: req.user._id });
    if (!task) {
      return apiResponse.error(res, 404, "Task not found.");
    }

    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (status !== undefined) task.status = status;

    const updatedTask = await task.save();
    return res.status(200).json(updatedTask);
  } catch (error) {
    console.error("Update task error:", error.message);
    return apiResponse.error(res, 500, "Failed to update task.");
  }
};

// DELETE /api/tasks/:id — delete a task
export const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;

    const task = await Task.findOneAndDelete({
      _id: id,
      userId: req.user._id,
    });

    if (!task) {
      return apiResponse.error(res, 404, "Task not found.");
    }

    return apiResponse.success(res, 200, "Task deleted successfully.");
  } catch (error) {
    console.error("Delete task error:", error.message);
    return apiResponse.error(res, 500, "Failed to delete task.");
  }
};

// PATCH /api/tasks/:id — toggle task status
export const toggleTaskStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const task = await Task.findOne({ _id: id, userId: req.user._id });
    if (!task) {
      return apiResponse.error(res, 404, "Task not found.");
    }

    task.status = status;
    const updatedTask = await task.save();
    return res.status(200).json(updatedTask);
  } catch (error) {
    console.error("Toggle task status error:", error.message);
    return apiResponse.error(res, 500, "Failed to toggle task status.");
  }
};
