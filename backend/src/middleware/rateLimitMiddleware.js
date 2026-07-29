/**
 * Sliding window rate limiting middleware for API Key ingestion.
 * Limit: 1,000 requests per hour per API Key.
 */
const rateLimitMap = new Map();

const WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_REQUESTS = 1000;

const rateLimitMiddleware = (req, res, next) => {
  const apiKeyId = req.apiKey ? req.apiKey.id : req.ip;
  const now = Date.now();

  if (!rateLimitMap.has(apiKeyId)) {
    rateLimitMap.set(apiKeyId, []);
  }

  const timestamps = rateLimitMap.get(apiKeyId);

  // Remove timestamps outside current window
  while (timestamps.length > 0 && timestamps[0] <= now - WINDOW_MS) {
    timestamps.shift();
  }

  if (timestamps.length >= MAX_REQUESTS) {
    const oldestTimestamp = timestamps[0];
    const resetTime = Math.ceil((oldestTimestamp + WINDOW_MS - now) / 1000);

    res.setHeader("X-RateLimit-Limit", MAX_REQUESTS);
    res.setHeader("X-RateLimit-Remaining", 0);
    res.setHeader("X-RateLimit-Reset", resetTime);

    return res.status(429).json({
      error: "Too Many Requests",
      message: `Rate limit exceeded. Maximum ${MAX_REQUESTS} requests per hour allowed. Try again in ${resetTime} seconds.`,
    });
  }

  timestamps.push(now);

  res.setHeader("X-RateLimit-Limit", MAX_REQUESTS);
  res.setHeader("X-RateLimit-Remaining", MAX_REQUESTS - timestamps.length);

  next();
};

module.exports = rateLimitMiddleware;
