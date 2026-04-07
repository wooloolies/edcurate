import { env } from "@/config/env";
import { getAccessToken } from "@/lib/auth/token";

/**
 * Initiates a fetch-based SSE connection with Bearer auth.
 * Uses fetch() instead of EventSource so we can set the Authorization header.
 */
export function fetchSSE(
  path: string,
  params: Record<string, string>,
  signal: AbortSignal,
): Promise<Response> {
  const token = getAccessToken();
  const query = new URLSearchParams(params).toString();
  return fetch(`${env.NEXT_PUBLIC_API_URL}${path}?${query}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "text/event-stream",
    },
    signal,
  });
}
