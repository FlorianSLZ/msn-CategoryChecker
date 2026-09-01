/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_ANALYTICS_PROVIDER?: "plausible" | "umami" | "none";
  readonly PUBLIC_PLAUSIBLE_DOMAIN?: string;
  readonly PUBLIC_PLAUSIBLE_SCRIPT_URL?: string;
  readonly PUBLIC_UMAMI_SCRIPT_URL?: string;
  readonly PUBLIC_UMAMI_WEBSITE_ID?: string;
  readonly PUBLIC_FEATURE_RECENT_LOOKUPS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Cloudflare Workers runtime bindings/secrets — set via `.dev.vars` locally
// and `wrangler secret put` / the dashboard in production. Not visible via
// `import.meta.env`; see src/lib/providers/microsoft-gsa.ts for usage.
declare module "cloudflare:workers" {
  export const env: {
    MSFT_TENANT_ID?: string;
    MSFT_GSA_CLIENT_ID?: string;
    MSFT_GSA_CLIENT_SECRET?: string;
  };
}
