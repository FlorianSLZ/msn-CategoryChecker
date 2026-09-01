<div align="center">

<a href="https://msnugget.com/"><img src="https://img.shields.io/badge/Part%20of-msnugget-39A751?style=for-the-badge&labelColor=1F8F3D" alt="Part of the msnugget family" /></a>

# Category Checker

**Check how a website or URL is categorized by Microsoft Global Secure Access web content filtering.**

[![Live](https://img.shields.io/badge/Live-categorychecker.msnugget.com-39A751?style=for-the-badge&logo=googlechrome&logoColor=white)](https://categorychecker.msnugget.com)

</div>

---

Global Secure Access web content filtering policies are written against web categories — get the category wrong and you either block something you meant to allow or leave something reachable a policy was supposed to catch. Category Checker looks up the real category in seconds, so that's a two-second check instead of a policy-testing round trip.

Built in the same [msnugget](https://msnugget.com/) design system as the rest of the tool family (see [`DESIGN.md`](./DESIGN.md)), adapted from [Error Hunter](https://errorhunter.app)'s reference design into an Astro + TypeScript + Tailwind stack.

## Features

- **Real Microsoft Global Secure Access data** — calls the Microsoft Graph API behind Entra Internet Access web content filtering (falls back to deterministic sample data when Graph credentials aren't configured, so the tool stays usable without a GSA tenant).
- **Provider-based architecture** — every provider implements the same `CategoryProvider` interface (see [`ARCHITECTURE.md`](./ARCHITECTURE.md)), so more real integrations can be added later without UI changes. Only Microsoft Global Secure Access is wired up today — see the [About page](https://categorychecker.msnugget.com/about) for why FortiGuard, Cisco Umbrella, Zscaler, and Netskope aren't (in short: no free, unauthenticated, non-scraped way to reach them).
- **Deep-linkable results** — `?domain=` in the URL, shareable and auto-runs on load.
- **Recent lookups** — remembered in `localStorage`, never sent to a server.
- **Dark / light theme**, system-aware by default.
- **SEO-ready** — Open Graph, Twitter Card, `SoftwareApplication` + `FAQPage` JSON-LD, sitemap.
- **No account, no telemetry by default** — analytics are opt-in via environment variables.

## Quick start

```bash
npm install
npm run dev       # http://localhost:4321
```

> **Windows note:** the Cloudflare adapter's local dev/build steps spawn a `workerd` subprocess. If your shell sandboxes child-process creation (some CI/dev-container setups do), run with sandboxing disabled or from a plain terminal.

## Build & deploy

```bash
npm run build      # outputs dist/client (static assets) + dist/server (the /api/check Worker)
npm run preview     # preview the built output locally via wrangler
```

Deploy target is a **Cloudflare Worker with static assets** (`wrangler.toml` + `@astrojs/cloudflare`) — not classic Cloudflare Pages. Connect the repo to Cloudflare's Git-integration "Workers Builds" (build command `npm run build`, deploy command `npx wrangler deploy`), or deploy manually with `npx wrangler deploy --config dist/server/wrangler.json` after building. See `ARCHITECTURE.md` for why `wrangler.toml` deliberately omits `pages_build_output_dir`.

## Environment variables

Two separate mechanisms, on purpose — don't mix them up:

- **Build-time / public config** — copy `.env.example` to `.env`. Vite inlines `PUBLIC_`-prefixed values at build time; everything here is optional (the site works with no `.env` at all).

  | Variable | Purpose |
  |---|---|
  | `PUBLIC_ANALYTICS_PROVIDER` | `plausible` \| `umami` \| `none` (default) |
  | `PUBLIC_PLAUSIBLE_DOMAIN` / `PUBLIC_PLAUSIBLE_SCRIPT_URL` | Plausible config |
  | `PUBLIC_UMAMI_WEBSITE_ID` / `PUBLIC_UMAMI_SCRIPT_URL` | Umami config |
  | `PUBLIC_FEATURE_RECENT_LOOKUPS` | Feature flag for the recent-lookups chip row |

- **Runtime secrets (real provider credentials)** — copy `.dev.vars.example` to `.dev.vars` for local dev; use `wrangler secret put <NAME>` (or the Cloudflare dashboard) in production. These are Cloudflare Worker secrets, read via `cloudflare:workers`' `env`, not Vite — see `ARCHITECTURE.md`.

  | Variable | Purpose |
  |---|---|
  | `MSFT_TENANT_ID` / `MSFT_GSA_CLIENT_ID` / `MSFT_GSA_CLIENT_SECRET` | Entra ID app registration (client-credentials flow, `NetworkAccess.Read.All` application permission) for the real Microsoft Global Secure Access provider. Unset → that provider falls back to mock data. |

## Project structure

```
src/
├── components/        # Header, Footer, Hero, ResultsGrid, FaqAccordion, Seo, Button, Chip, ...
├── layouts/
│   └── BaseLayout.astro
├── lib/providers/      # CategoryProvider interface, registry, normalize, microsoft-gsa (real) + mock factory
├── pages/
│   ├── index.astro     # landing page + embedded checker
│   ├── about.astro / privacy.astro / terms.astro
│   └── api/check.ts    # POST { domain } -> runs all providers server-side
├── scripts/checker.ts  # client-side interactivity (no framework)
└── styles/global.css   # design tokens, ported from msnugget's Signal Palette
```

See [`ARCHITECTURE.md`](./ARCHITECTURE.md) for the provider abstraction and rendering-mode rationale, and [`DESIGN.md`](./DESIGN.md) for the design system.

## Adding a real provider

`src/lib/providers/microsoft-gsa.ts` is a working example (real Microsoft Graph API call, with a mock fallback when credentials are absent) — follow the same pattern for a new provider:

1. Create `src/lib/providers/<provider>.ts`. Either call `createMockProvider(...)` from `mock.ts` directly (fully mock), or export an object implementing `CategoryProvider` (see `src/lib/providers/types.ts`) that calls the vendor's API in `checkCategory`, falling back to a `createMockProvider(...)` instance when credentials aren't configured (see `microsoft-gsa.ts`).
2. Add any required secret to `.dev.vars` locally / `wrangler secret put` in production (see Environment variables above), and read it inside that file via `import { env } from "cloudflare:workers"` — never `import.meta.env`, which won't see Worker secrets.
3. Register it in `src/lib/providers/registry.ts`'s `providers` array.

No other file changes — the UI and API route are provider-agnostic. Before wiring up FortiGuard, Cisco Umbrella, Zscaler, or Netskope specifically, note that none currently offer a free, unauthenticated API — see the About page.

## 🧩 Part of the msnugget family

Free, independent, privacy-first tools for Microsoft admins — explore them all at **[msnugget.com](https://msnugget.com/)**.

| Tool | What it does |
|---|---|
| [**CMTrace.dev**](https://cmtrace.dev) | Web-based CMTrace / ConfigMgr log viewer |
| [**MSFinder**](https://msfinder.dev) | Find any Microsoft admin portal setting in one search |
| [**MSChanges**](https://mschanges.dev) | Track every change to Microsoft's documentation |
| [**M365 Change Digest**](https://mcd.msnugget.com) | Every Microsoft 365 roadmap & Message Center change in one place |
| [**Error Hunter**](https://errorhunter.app) | Resolve any Intune / Windows error code |
| ⭐ **Category Checker** | Check a domain's Global Secure Access web category · **you are here** |

## Disclaimer

Category Checker is an **independent project** and is **not affiliated with, endorsed by, or sponsored by** Microsoft. The Microsoft Global Secure Access result is real Microsoft Graph data when this deployment has credentials configured, and mocked sample data otherwise. Always confirm against the Microsoft Entra admin center before relying on any result operationally.

## License

MIT.
