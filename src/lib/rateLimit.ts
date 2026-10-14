import "server-only";

// In-memory, per-process — fine because this app runs as a single
// long-lived server (Render), not distributed serverless functions where
// each invocation would get its own empty memory. If this ever moves to a
// multi-instance deployment, swap the Map for Redis.
const buckets = new Map<string, { count: number; resetAt: number }>();

// Buckets never get cleaned up otherwise — a long-running process would
// slowly accumulate one entry per distinct key (IP+route) forever.
const SWEEP_INTERVAL_MS = 10 * 60 * 1000;
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (now > bucket.resetAt) buckets.delete(key);
  }
}, SWEEP_INTERVAL_MS).unref();

/** Returns true if the request is within the limit, false if it should be rejected. */
export function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (bucket.count >= limit) return false;
  bucket.count += 1;
  return true;
}

/** Render sits behind a proxy, so the real client IP is in x-forwarded-for, not the socket. */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}
