import { Router } from "express";
import authMiddleware from "../../common/middleware/authMiddleware.js";
import {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  toggleTaskStatus,
} from "./task.controller.js";
import {
  validateCreateTask,
  validateUpdateTask,
  validateToggleStatus,
} from "./task.validation.js";

const router = Router();

// All task routes are protected
router.use(authMiddleware);

router.get("/", getTasks);
router.post("/", validateCreateTask, createTask);
router.put("/:id", validateUpdateTask, updateTask);
router.delete("/:id", deleteTask);
router.patch("/:id", validateToggleStatus, toggleTaskStatus);

export default router;
