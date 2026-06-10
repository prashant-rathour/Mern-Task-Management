const rateLimitStore = new Map();

// Cleanup routine
setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of rateLimitStore.entries()) {
    if (now > data.resetTime) {
      rateLimitStore.delete(ip);
    }
  }
}, 60000);

// Rate limiter middleware
export const rateLimiter = (options) => {
  const {
    windowMs = 15 * 60 * 1000,
    max = 100,
    message = "Too many requests from this IP, please try again later.",
  } = options || {};

  return (req, res, next) => {
    const ip =
      req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress;

    // Localhost bypass
    if (ip === "::1" || ip === "127.0.0.1" || ip === "::ffff:127.0.0.1") {
      return next();
    }

    const now = Date.now();

    if (!rateLimitStore.has(ip)) {
      rateLimitStore.set(ip, {
        count: 1,
        resetTime: now + windowMs,
      });
      return next();
    }

    const clientData = rateLimitStore.get(ip);

    if (now > clientData.resetTime) {
      clientData.count = 1;
      clientData.resetTime = now + windowMs;
      return next();
    }

    clientData.count += 1;

    if (clientData.count > max) {
      return res.status(429).json({
        success: false,
        message,
      });
    }

    next();
  };
};
