import jwt from "jsonwebtoken";
import User from "../../modules/auth/auth.model.js";
import { apiResponse } from "../utils/apiResponse.js";

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return apiResponse.error(res, 401, "Access denied. No token provided.");
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return apiResponse.error(res, 401, "User not found. Invalid token.");
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return apiResponse.error(res, 401, "Token expired. Please login again.");
    }
    if (error.name === "JsonWebTokenError") {
      return apiResponse.error(res, 401, "Invalid token.");
    }
    return apiResponse.error(res, 500, "Authentication error.");
  }
};

export default authMiddleware;
