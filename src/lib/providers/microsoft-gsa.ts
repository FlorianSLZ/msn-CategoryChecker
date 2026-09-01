import { createMockProvider } from "./mock";

/**
 * Mock provider. Swap this file's export for a real Microsoft Global Secure
 * Access lookup (e.g. Graph API network access traffic/category data) using a
 * server-only env var (see .env.example) — no changes required outside this
 * file, since callers only depend on the CategoryProvider interface.
 */
export const microsoftGsaProvider = createMockProvider(
  "Microsoft Global Secure Access",
  "microsoft-gsa",
  "https://learn.microsoft.com/entra/global-secure-access/",
);
