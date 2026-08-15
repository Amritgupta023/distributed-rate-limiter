const requestStore = new Map();

const WINDOW_SIZE = 30 * 1000; // 30 seconds
const MAX_REQUESTS = 5;

function rateLimiter(req, res, next) {
  const clientIP = req.ip;
  const currentTime = Date.now();

  console.log("*************map",requestStore);

  // Get previous request timestamps
  let requestTimestamps = requestStore.get(clientIP) || [];

  // Anything older than 30 seconds is irrelevant
  const windowStart = currentTime - WINDOW_SIZE;

  requestTimestamps = requestTimestamps.filter(
    (timestamp) => timestamp > windowStart
  );

  // Rate limit headers
  res.setHeader("X-RateLimit-Limit", MAX_REQUESTS);

  // Limit exceeded
  if (requestTimestamps.length >= MAX_REQUESTS) {
    const oldestRequest = requestTimestamps[0];

    const retryAfterSeconds = Math.ceil(
      (oldestRequest + WINDOW_SIZE - currentTime) / 1000
    );

    res.setHeader("X-RateLimit-Remaining", 0);
    res.setHeader("Retry-After", retryAfterSeconds);

    requestStore.set(clientIP, requestTimestamps);

    return res.status(429).json({
      success: false,
      message: "Too many requests",
      retryAfter: retryAfterSeconds,
    });
  }

  // Add current request timestamp
  requestTimestamps.push(currentTime);

  requestStore.set(clientIP, requestTimestamps);

  const remainingRequests =
    MAX_REQUESTS - requestTimestamps.length;

  res.setHeader(
    "X-RateLimit-Remaining",
    remainingRequests
  );

  next();
}

module.exports = rateLimiter;