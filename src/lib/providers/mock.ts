import type { CategoryProvider, CategoryResult, CategoryStatus } from "./types";

const CATEGORIES = [
  "Business",
  "Social Media",
  "Streaming Media",
  "Search Engines",
  "News & Media",
  "Education",
  "Cloud & SaaS",
  "Adult Content",
  "Gambling",
  "Malware",
  "Phishing",
] as const;

/** Deterministic small hash so the same domain always yields the same mock result. */
function hash(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h * 31 + input.charCodeAt(i)) >>> 0;
  }
  return h;
}

/**
 * Builds a mock CategoryProvider. Real providers replace `checkCategory`'s body
 * with an authenticated fetch() to the vendor's API — the CategoryProvider shape,
 * and every caller of it, stays identical.
 */
export function createMockProvider(
  name: string,
  slug: string,
  homepageUrl: string,
  options: { latencyMs?: [number, number]; uncategorizedRate?: number } = {},
): CategoryProvider {
  const [minLatency, maxLatency] = options.latencyMs ?? [250, 900];
  const uncategorizedRate = options.uncategorizedRate ?? 0.12;

  return {
    name,
    slug,
    homepageUrl,
    async checkCategory(domain: string): Promise<CategoryResult> {
      const seed = hash(`${slug}:${domain}`);
      const latency = minLatency + (seed % (maxLatency - minLatency));
      await new Promise((resolve) => setTimeout(resolve, latency));

      const isUncategorized = seed % 100 < uncategorizedRate * 100;
      const category = isUncategorized ? null : CATEGORIES[seed % CATEGORIES.length];
      const status: CategoryStatus = isUncategorized ? "uncategorized" : "categorized";
      const confidenceRoll = seed % 3;
      const confidence = confidenceRoll === 0 ? "high" : confidenceRoll === 1 ? "medium" : "low";

      return {
        provider: name,
        providerSlug: slug,
        domain,
        category,
        status,
        confidence: isUncategorized ? undefined : confidence,
        lastChecked: new Date().toISOString(),
        sourceUrl: homepageUrl,
      };
    },
  };
}
