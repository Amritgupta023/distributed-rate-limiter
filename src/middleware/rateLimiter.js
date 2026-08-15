const requestStore = new Map();

const WINDOW_SIZE = 60 * 1000; // 60 seconds
const MAX_REQUESTS = 5;

function rateLimiter(req, res, next) {
  const clientIP = req.ip;

  const currentTime = Date.now();

  const clientData = requestStore.get(clientIP);

  // First request from this IP
  if (!clientData) {
    requestStore.set(clientIP, {
      count: 1,
      windowStart: currentTime,
    });

    return next();
  }

  const timePassed = currentTime - clientData.windowStart;

  // Window expired -> start new window
  if (timePassed >= WINDOW_SIZE) {
    requestStore.set(clientIP, {
      count: 1,
      windowStart: currentTime,
    });

    return next();
  }

  // Limit exceeded
  if (clientData.count >= MAX_REQUESTS) {
    return res.status(429).json({
      success: false,
      message: "Too many requests. Please try again later.",
    });
  }

  // Increase request count
  clientData.count += 1;

  next();
}

module.exports = rateLimiter;