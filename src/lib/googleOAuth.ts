import "server-only";
import { getPublicWebOrigin } from "@/lib/publicOrigin";

export const GOOGLE_STATE_COOKIE = "google_oauth_state";

export function getGoogleRedirectUri() {
  return `${getPublicWebOrigin()}/api/customer/auth/google/callback`;
}
