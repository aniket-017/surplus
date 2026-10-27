const WINDOW_MS = 60 * 60 * 1000;
const MAX_CALLS = Number(process.env.AI_CALLS_PER_HOUR) || 20;

const callsBySeller = new Map();

export function aiRateLimit(req, res, next) {
  const key = req.sellerId || req.user?.id;
  if (!key) return next();

  const now = Date.now();
  const recent = (callsBySeller.get(key) ?? []).filter((time) => now - time < WINDOW_MS);

  if (recent.length >= MAX_CALLS) {
    callsBySeller.set(key, recent);
    return res
      .status(429)
      .json({ error: "You've used AI a lot this hour. Please try again later or fill manually." });
  }

  recent.push(now);
  callsBySeller.set(key, recent);
  next();
}
