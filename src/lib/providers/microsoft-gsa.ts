import { env } from "cloudflare:workers";
import type { CategoryProvider, CategoryResult } from "./types";
import { createMockProvider } from "./mock";
import { getGraphToken, isGraphConfigured } from "./microsoft-graph-auth";

const NAME = "Microsoft Global Secure Access";
const SLUG = "microsoft-gsa";
const HOMEPAGE_URL = "https://learn.microsoft.com/entra/global-secure-access/how-to-check-web-content-filtering-categories";

// Used automatically whenever MSFT_TENANT_ID / MSFT_GSA_CLIENT_ID /
// MSFT_GSA_CLIENT_SECRET aren't set (see .dev.vars.example) — keeps the tool
// usable out of the box for anyone without a GSA tenant to point at.
const mockFallback = createMockProvider(NAME, SLUG, HOMEPAGE_URL);

/**
 * Real Microsoft Global Secure Access provider. Calls the Graph beta
 * `getWebCategoryByUrl` function (NetworkAccess.Read.All, application
 * permission), which requires Entra Internet Access / GSA web content
 * filtering to be enabled on the tenant.
 * https://learn.microsoft.com/graph/api/networkaccess-connectivity-getwebcategorybyurl?view=graph-rest-beta
 */
export const microsoftGsaProvider: CategoryProvider = {
  name: NAME,
  slug: SLUG,
  homepageUrl: HOMEPAGE_URL,

  async checkCategory(domain: string): Promise<CategoryResult> {
    if (!isGraphConfigured(env)) {
      return mockFallback.checkCategory(domain);
    }

    const lastChecked = new Date().toISOString();

    try {
      const token = await getGraphToken(env);
      const url = `https://graph.microsoft.com/beta/networkaccess/connectivity/getWebCategoryByUrl(url='@url')?@url=${encodeURIComponent(domain)}`;
      const response = await fetch(url, {
        headers: { authorization: `Bearer ${token}` },
      });

      if (response.status === 404) {
        return {
          provider: NAME,
          providerSlug: SLUG,
          domain,
          category: null,
          status: "uncategorized",
          lastChecked,
          sourceUrl: HOMEPAGE_URL,
        };
      }

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        const message =
          body && typeof body === "object" && "error" in body
            ? String((body as { error?: { message?: string } }).error?.message ?? `HTTP ${response.status}`)
            : `HTTP ${response.status}`;
        throw new Error(message);
      }

      const data = (await response.json()) as { name?: string; displayName?: string; group?: string };
      const category = data.displayName ?? data.name ?? null;

      return {
        provider: NAME,
        providerSlug: SLUG,
        domain,
        category,
        status: category ? "categorized" : "uncategorized",
        confidence: category ? "high" : undefined,
        lastChecked,
        sourceUrl: HOMEPAGE_URL,
      };
    } catch (error) {
      return {
        provider: NAME,
        providerSlug: SLUG,
        domain,
        category: null,
        status: "error",
        lastChecked,
        sourceUrl: HOMEPAGE_URL,
        message: error instanceof Error ? error.message : "Lookup failed.",
      };
    }
  },
};
