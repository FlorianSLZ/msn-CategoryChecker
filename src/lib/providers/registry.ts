import type { CategoryProvider, CategoryResult } from "./types";
import { microsoftGsaProvider } from "./microsoft-gsa";
import { fortiguardProvider } from "./fortiguard";
import { ciscoUmbrellaProvider } from "./cisco-umbrella";
import { zscalerProvider } from "./zscaler";
import { netskopeProvider } from "./netskope";

export const providers: CategoryProvider[] = [
  microsoftGsaProvider,
  fortiguardProvider,
  ciscoUmbrellaProvider,
  zscalerProvider,
  netskopeProvider,
];

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
