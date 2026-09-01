import { createMockProvider } from "./mock";

/**
 * Mock provider. Swap this file's export for a real Netskope URL category
 * lookup using a Cloudflare Worker secret (see .dev.vars.example and
 * src/lib/providers/microsoft-gsa.ts for the pattern) — no changes required
 * outside this file, since callers only depend on the CategoryProvider
 * interface.
 */
export const netskopeProvider = createMockProvider(
  "Netskope",
  "netskope",
  "https://www.netskope.com/",
);
