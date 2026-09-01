export type CategoryStatus = "categorized" | "uncategorized" | "error" | "pending";

export interface CategoryResult {
  provider: string;
  providerSlug: string;
  domain: string;
  category: string | null;
  status: CategoryStatus;
  confidence?: "high" | "medium" | "low";
  lastChecked: string; // ISO timestamp
  sourceUrl?: string;
  message?: string;
}

export interface CategoryProvider {
  name: string;
  slug: string;
  /** Public info/docs link for the provider, shown in the "Supported providers" section. */
  homepageUrl: string;
  checkCategory(domain: string): Promise<CategoryResult>;
}
