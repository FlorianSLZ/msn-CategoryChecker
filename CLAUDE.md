# CLAUDE.md

Project-specific notes for working in this repo. Full context lives in `README.md`, `ARCHITECTURE.md`, and `DESIGN.md` — read those first. This file is for gotchas that aren't obvious from the code.

## Build/deploy gotchas

- **`wrangler.toml` must NOT set `pages_build_output_dir`.** This project deploys as a Cloudflare Worker with static assets (`wrangler deploy`), not classic Pages. `@astrojs/cloudflare`'s generated config always names its assets binding `ASSETS`; Wrangler treats that as reserved, but only when `pages_build_output_dir` signals "this is a Pages project." With that field present, both the build's prerender step and the real deploy fail on the same reserved-name error.
- **`astro.config.mjs` must keep the adapter's default `prerenderEnvironment` (`workerd`), not `'node'`.** `src/lib/providers/microsoft-gsa.ts` does a top-level `import { env } from "cloudflare:workers"`, which only resolves inside an actual Workers runtime. Static pages that transitively import the provider registry (e.g. `ProvidersSection.astro`) need prerendering to run through `workerd` for that import to resolve.
- **Never import `src/lib/providers/registry.ts` (or any provider file) from client-side code** (`src/scripts/checker.ts`) for the same `cloudflare:workers` reason — it won't resolve in the browser bundle.
- **Real provider credentials are Cloudflare Worker secrets, not `.env`/`import.meta.env`.** Use `.dev.vars` locally (see `.dev.vars.example`) and `wrangler secret put` in production. `import.meta.env` only covers Vite-inlined `PUBLIC_`-prefixed build-time values.
- On Windows, `astro dev` / `astro build` spawn a `workerd` subprocess. If a sandboxed shell blocks child-process creation, commands hang or fail silently — retry with sandboxing disabled.

## Provider scope

Only Microsoft Global Secure Access (`src/lib/providers/microsoft-gsa.ts`) is wired to a real API, deliberately. FortiGuard, Cisco Umbrella, Zscaler, and Netskope were investigated (not just assumed from vendor docs) and excluded:

- FortiGuard's and Zscaler's free public lookup pages are bot/WAF-protected (confirmed via direct `403`s, both server-side and in a real browser) — not a stable integration path.
- Cisco Umbrella (Investigate) and Netskope both require a paid subscription and API credentials.

**Don't build a scraper around a vendor's anti-bot protection as a "free" integration** — it's fragile and against the vendor's intent. If real API credentials for one of these becomes available, add a provider file following the `microsoft-gsa.ts` pattern (real call, `createMockProvider()` fallback from `mock.ts`) and register it in `registry.ts` — no other files need to change.
