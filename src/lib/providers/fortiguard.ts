import { createMockProvider } from "./mock";

/**
 * Mock provider. Swap this file's export for a real FortiGuard Web Filter
 * category lookup using a Cloudflare Worker secret (see .dev.vars.example
 * and src/lib/providers/microsoft-gsa.ts for the pattern) — no changes
 * required outside this file, since callers only depend on the
 * CategoryProvider interface.
 */
export const fortiguardProvider = createMockProvider(
  "FortiGuard",
  "fortiguard",
  "https://www.fortiguard.com/webfilter",
);
