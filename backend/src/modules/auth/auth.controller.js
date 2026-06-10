import User from "./auth.model.js";
import generateToken from "../../common/utils/generateToken.js";
import { apiResponse } from "../../common/utils/apiResponse.js";

// POST /api/auth/register
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return apiResponse.error(res, 400, "User with this email already exists.");
    }

    // Create user
    const user = await User.create({ name, email, password });

    // Generate token
    const token = generateToken(user._id);

    return apiResponse.success(res, 201, "User registered successfully.", {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Register error:", error.message);
    return apiResponse.error(res, 500, "Server error. Please try again.");
  }
};

// POST /api/auth/login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return apiResponse.error(res, 401, "Invalid email or password.");
    }

    // Compare password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return apiResponse.error(res, 401, "Invalid email or password.");
    }

    // Generate token
    const token = generateToken(user._id);

    return apiResponse.success(res, 200, "Login successful.", {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error.message);
    return apiResponse.error(res, 500, "Server error. Please try again.");
  }
};
