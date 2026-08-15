const buckets = new Map();

const BUCKET_CAPACITY = 5;

// 1 token every 6 seconds
const REFILL_RATE = 1 / 6000;

function rateLimiter(req, res, next) {
  const clientIP = req.ip;
  const currentTime = Date.now();

  let bucket = buckets.get(clientIP);

  // First request from this IP
  if (!bucket) {
    bucket = {
      tokens: BUCKET_CAPACITY,
      lastRefillTime: currentTime,
    };

    buckets.set(clientIP, bucket);
  }

  // Calculate how much time has passed
  const timePassed = currentTime - bucket.lastRefillTime;

  // Calculate tokens generated during that time
  const tokensToAdd = timePassed * REFILL_RATE;

  // Refill bucket
  bucket.tokens = Math.min(
    BUCKET_CAPACITY,
    bucket.tokens + tokensToAdd
  );

  // Update refill time
  bucket.lastRefillTime = currentTime;

  res.setHeader(
    "X-RateLimit-Limit",
    BUCKET_CAPACITY
  );

  // No token available
  if (bucket.tokens < 1) {
    const timeUntilNextToken =
      (1 - bucket.tokens) / REFILL_RATE;

    const retryAfterSeconds = Math.ceil(
      timeUntilNextToken / 1000
    );

    res.setHeader("X-RateLimit-Remaining", 0);
    res.setHeader(
      "Retry-After",
      retryAfterSeconds
    );

    return res.status(429).json({
      success: false,
      message: "Too many requests",
      retryAfter: retryAfterSeconds,
    });
  }

  // Consume one token
  bucket.tokens -= 1;

  res.setHeader(
    "X-RateLimit-Remaining",
    Math.floor(bucket.tokens)
  );

  next();
}

module.exports = rateLimiter;