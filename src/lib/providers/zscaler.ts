import { createMockProvider } from "./mock";

/**
 * Mock provider. Swap this file's export for a real Zscaler URL category
 * lookup using a server-only env var (see .env.example) — no changes required
 * outside this file, since callers only depend on the CategoryProvider
 * interface.
 */
export const zscalerProvider = createMockProvider(
  "Zscaler",
  "zscaler",
  "https://www.zscaler.com/",
);
