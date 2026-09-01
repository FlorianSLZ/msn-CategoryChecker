interface GraphCredentials {
  MSFT_TENANT_ID?: string;
  MSFT_GSA_CLIENT_ID?: string;
  MSFT_GSA_CLIENT_SECRET?: string;
}

interface TokenCache {
  token: string;
  expiresAt: number;
}

// Module-level cache: Cloudflare Workers can reuse the same isolate across
// requests, so this saves a token round-trip on warm invocations. It's not
// required for correctness — a cold isolate just starts with an empty cache.
let cache: TokenCache | null = null;

export function isGraphConfigured(env: GraphCredentials): boolean {
  return Boolean(env.MSFT_TENANT_ID && env.MSFT_GSA_CLIENT_ID && env.MSFT_GSA_CLIENT_SECRET);
}

/**
 * Acquires an app-only (client credentials) Microsoft Graph token scoped to
 * `https://graph.microsoft.com/.default`. The Azure AD app registration
 * needs the NetworkAccess.Read.All application permission, admin-consented,
 * and the tenant needs Global Secure Access / Entra Internet Access enabled.
 */
export async function getGraphToken(env: GraphCredentials): Promise<string> {
  if (cache && cache.expiresAt > Date.now() + 30_000) {
    return cache.token;
  }

  if (!isGraphConfigured(env)) {
    throw new Error("Microsoft GSA credentials are not configured.");
  }

  const response = await fetch(`https://login.microsoftonline.com/${env.MSFT_TENANT_ID}/oauth2/v2.0/token`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: env.MSFT_GSA_CLIENT_ID!,
      client_secret: env.MSFT_GSA_CLIENT_SECRET!,
      scope: "https://graph.microsoft.com/.default",
      grant_type: "client_credentials",
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to acquire a Microsoft Graph token (HTTP ${response.status}).`);
  }

  const data = (await response.json()) as { access_token: string; expires_in: number };
  cache = { token: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 };
  return cache.token;
}
