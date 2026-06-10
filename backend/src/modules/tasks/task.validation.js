export const validateCreateTask = (req, res, next) => {
  const { title, description } = req.body;
  const errors = [];

  if (!title || title.trim().length === 0) {
    errors.push("Title is required.");
  }

  if (!description || description.trim().length === 0) {
    errors.push("Description is required.");
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, message: errors[0], errors });
  }

  next();
};

export const validateUpdateTask = (req, res, next) => {
  const { title, description, status } = req.body;

  // At least one field must be provided
  if (title === undefined && description === undefined && status === undefined) {
    return res.status(400).json({
      success: false,
      message: "At least one field (title, description, or status) is required.",
    });
  }

  if (status !== undefined && !["pending", "completed"].includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'Status must be either "pending" or "completed".',
    });
  }

  next();
};

export const validateToggleStatus = (req, res, next) => {
  const { status } = req.body;

  if (!status || !["pending", "completed"].includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'Status must be either "pending" or "completed".',
    });
  }

  next();
};
