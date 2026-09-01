import type { CategoryProvider, CategoryResult } from "./types";
import { microsoftGsaProvider } from "./microsoft-gsa";

// Microsoft Global Secure Access only, for now — FortiGuard, Cisco Umbrella,
// Zscaler, and Netskope were removed after research showed none of them
// offer a usable unauthenticated lookup (their public pages are bot-
// protected, and their real APIs require a paid subscription). Add a new
// entry here once real credentials for one of them are available; follow
// the pattern in microsoft-gsa.ts (real call with a mock fallback via
// createMockProvider() in mock.ts) — no other file needs to change.
export const providers: CategoryProvider[] = [microsoftGsaProvider];

/**
 * Runs every registered provider for a domain and always resolves — a
 * provider failure becomes a `status: "error"` result instead of rejecting
 * the whole batch, so the UI never hits a dead end.
 */
export async function checkAllProviders(domain: string): Promise<CategoryResult[]> {
  const settled = await Promise.allSettled(providers.map((provider) => provider.checkCategory(domain)));

  return settled.map((result, index) => {
    const provider = providers[index];
    if (result.status === "fulfilled") return result.value;

    return {
      provider: provider.name,
      providerSlug: provider.slug,
      domain,
      category: null,
      status: "error",
      lastChecked: new Date().toISOString(),
      sourceUrl: provider.homepageUrl,
      message: result.reason instanceof Error ? result.reason.message : "Lookup failed",
    } satisfies CategoryResult;
  });
}
