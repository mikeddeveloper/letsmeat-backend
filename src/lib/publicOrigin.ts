import "server-only";

/**
 * The backend is only ever reached by the browser through the frontend's
 * own domain (it rewrite-proxies /api/customer/* server-side) — never
 * directly. Anything that redirects the browser back to our own site
 * (Google OAuth, Paystack) must target that same frontend origin, or a
 * session cookie set on callback ends up scoped to the backend's own
 * domain instead, which the frontend can never read. So this is an
 * explicit env var, not derived from the incoming request's own origin.
 */
export function getPublicWebOrigin() {
  const origin = process.env.PUBLIC_WEB_ORIGIN;
  if (!origin) throw new Error("Missing required env var: PUBLIC_WEB_ORIGIN");
  return origin;
}
