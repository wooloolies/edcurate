"use client";

import { createAuthClient } from "better-auth/react";
import { env } from "@/config/env";
import { apiClient } from "@/lib/api-client";
import { clearTokens, getAccessToken, setAccessToken, setRefreshToken } from "@/lib/auth/token";

export type OAuthProviderId = "google" | "github" | "facebook";

type BackendOAuthLoginRequest = {
  provider: OAuthProviderId;
  access_token: string;
  email: string;
  name?: string | null;
};

type BackendTokenResponse = {
  access_token: string;
  refresh_token: string;
  token_type?: string;
};

export const authClient = createAuthClient({
  baseURL: env.NEXT_PUBLIC_BETTER_AUTH_URL,
});

export const { useSession, signIn, signUp } = authClient;
export const signOut = authClient.signOut;

function normalizeProviderId(providerId: string): OAuthProviderId | null {
  if (providerId === "google" || providerId === "github" || providerId === "facebook") {
    return providerId;
  }
  return null;
}

async function resolveProviderFromAccounts(): Promise<OAuthProviderId | null> {
  const result = await authClient.listAccounts();
  const accounts = result.data;
  if (!accounts || result.error) return null;

  for (const account of accounts) {
    const providerId = normalizeProviderId((account as { providerId?: string }).providerId ?? "");
    if (providerId) return providerId;
  }
  return null;
}

export async function exchangeOAuthForBackendJwt(providerId?: OAuthProviderId) {
  const { data: session } = await authClient.getSession();

  const email = session?.user?.email ?? null;
  if (!session?.user || !email) return;

  const resolvedProviderId = providerId ?? (await resolveProviderFromAccounts());
  if (!resolvedProviderId) return;

  const tokenResult = await authClient.getAccessToken({ providerId: resolvedProviderId });
  const accessToken = tokenResult.data?.accessToken;
  if (!accessToken || tokenResult.error) return;

  const body: BackendOAuthLoginRequest = {
    provider: resolvedProviderId,
    access_token: accessToken,
    email,
    name: session.user.name,
  };

  const { data } = await apiClient.post<BackendTokenResponse>("/api/auth/login", body);

  if (data?.access_token) setAccessToken(data.access_token);
  if (data?.refresh_token) setRefreshToken(data.refresh_token);
}

export async function exchangeSessionForBackendJwt() {
  // Call Next.js API route (same-origin, cookies forwarded)
  // which verifies session server-side then calls backend
  const response = await fetch("/api/auth/backend-exchange", {
    method: "POST",
    credentials: "include",
  });

  if (!response.ok) return;

  const data: BackendTokenResponse = await response.json();
  if (data?.access_token) setAccessToken(data.access_token);
  if (data?.refresh_token) setRefreshToken(data.refresh_token);
}

export async function signOutAndClearBackendTokens() {
  await authClient.signOut();
  clearTokens();
}

export function clearBackendTokens() {
  clearTokens();
}

export function hasBackendAccessToken() {
  return Boolean(getAccessToken());
}
