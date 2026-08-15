const requestStore = new Map();

const WINDOW_SIZE = 30 * 1000; // 30 seconds
const MAX_REQUESTS = 5;

function rateLimiter(req, res, next) {
  const clientIP = req.ip;
  const currentTime = Date.now();

  let clientData = requestStore.get(clientIP);

  // First request OR window expired
  if (
    !clientData ||
    currentTime - clientData.windowStart >= WINDOW_SIZE
  ) {
    clientData = {
      count: 0,
      windowStart: currentTime,
    };

    requestStore.set(clientIP, clientData);
  }

  const resetTime = clientData.windowStart + WINDOW_SIZE;
  const retryAfterSeconds = Math.ceil(
    (resetTime - currentTime) / 1000
  );

  // Common rate-limit headers
  res.setHeader("X-RateLimit-Limit", MAX_REQUESTS);
  res.setHeader(
    "X-RateLimit-Reset",
    Math.ceil(resetTime / 1000)
  );

  // Limit exceeded
  if (clientData.count >= MAX_REQUESTS) {
    res.setHeader("X-RateLimit-Remaining", 0);
    res.setHeader("Retry-After", retryAfterSeconds);

    return res.status(429).json({
      success: false,
      message: "Too many requests",
      retryAfter: retryAfterSeconds,
    });
  }

  // Count current request
  clientData.count += 1;

  const remainingRequests =
    MAX_REQUESTS - clientData.count;

  res.setHeader(
    "X-RateLimit-Remaining",
    remainingRequests
  );

  next();
}

module.exports = rateLimiter;