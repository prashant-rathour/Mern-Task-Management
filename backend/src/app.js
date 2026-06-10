import express from "express";
import cors from "cors";
import authRoutes from "./modules/auth/auth.routes.js";
import taskRoutes from "./modules/tasks/task.routes.js";
import { rateLimiter } from "./common/middleware/rateLimiter.js";

const app = express();

// Middleware
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*",
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiters
const authRateLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message:
    "Too many login or registration attempts. Please try again after 15 minutes.",
});

const apiRateLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: "Too many requests. Please try again after 15 minutes.",
});

// Routes
app.use("/api/auth", authRateLimiter, authRoutes);
app.use("/api/tasks", apiRateLimiter, taskRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.status(200).json({ success: true, message: "Server is running" });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// Global error handler
app.use((err, req, res, _next) => {
  console.error("Unhandled error:", err.stack);
  res.status(500).json({ success: false, message: "Internal server error" });
});

export default app;
