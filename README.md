<div align="center">

<a href="https://msnugget.com/"><img src="https://img.shields.io/badge/Part%20of-msnugget-39A751?style=for-the-badge&labelColor=1F8F3D" alt="Part of the msnugget family" /></a>

# Category Checker

**Check how a website or URL is categorized across security and web filtering platforms — Microsoft Global Secure Access, FortiGuard, Cisco Umbrella, Zscaler, and Netskope — side by side.**

[![Live](https://img.shields.io/badge/Live-categorychecker.msnugget.com-39A751?style=for-the-badge&logo=googlechrome&logoColor=white)](https://categorychecker.msnugget.com)

</div>

---

Category-based access policies only work if every enforcement point agrees on how a domain is categorized. Category Checker queries five providers at once and renders them as a card grid, so mismatches are obvious before they turn into a broken access policy or a support ticket.

Built in the same [msnugget](https://msnugget.com/) design system as the rest of the tool family (see [`DESIGN.md`](./DESIGN.md)), adapted from [Error Hunter](https://errorhunter.app)'s reference design into an Astro + TypeScript + Tailwind stack.

## Features

- **Five providers checked in parallel** — Microsoft Global Secure Access, FortiGuard, Cisco Umbrella, Zscaler, Netskope.
- **Provider-based architecture** — every provider implements the same `CategoryProvider` interface (see [`ARCHITECTURE.md`](./ARCHITECTURE.md)). Currently mocked with deterministic sample data; swapping in a real API is a one-file change.
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
npm run build      # outputs to dist/ (client) + a Cloudflare Pages Function for /api/check
npm run preview     # preview the built output locally via wrangler
```

Deploy target is **Cloudflare Pages** (`wrangler.toml` + `@astrojs/cloudflare`). Connect the repo in the Cloudflare dashboard (build command `npm run build`, output directory `dist`), or deploy via `wrangler pages deploy dist`.

## Environment variables

Copy `.env.example` to `.env` and fill in what you need — nothing is hardcoded, and everything is optional (the site works with no `.env` at all).

| Variable | Purpose |
|---|---|
| `PUBLIC_ANALYTICS_PROVIDER` | `plausible` \| `umami` \| `none` (default) |
| `PUBLIC_PLAUSIBLE_DOMAIN` / `PUBLIC_PLAUSIBLE_SCRIPT_URL` | Plausible config |
| `PUBLIC_UMAMI_WEBSITE_ID` / `PUBLIC_UMAMI_SCRIPT_URL` | Umami config |
| `PUBLIC_FEATURE_RECENT_LOOKUPS` | Feature flag for the recent-lookups chip row |
| `*_API_KEY` (commented out) | Server-only credentials for real provider integrations, consumed only in `src/pages/api/check.ts` |

## Project structure

```
src/
├── components/        # Header, Footer, Hero, ResultsGrid, FaqAccordion, Seo, Button, Chip, ...
├── layouts/
│   └── BaseLayout.astro
├── lib/providers/      # CategoryProvider interface, registry, normalize, mock providers
├── pages/
│   ├── index.astro     # landing page + embedded checker
│   ├── about.astro / privacy.astro / terms.astro
│   └── api/check.ts    # POST { domain } -> runs all providers server-side
├── scripts/checker.ts  # client-side interactivity (no framework)
└── styles/global.css   # design tokens, ported from msnugget's Signal Palette
```

See [`ARCHITECTURE.md`](./ARCHITECTURE.md) for the provider abstraction and rendering-mode rationale, and [`DESIGN.md`](./DESIGN.md) for the design system.

## Adding a real provider

1. Open `src/lib/providers/<provider>.ts`.
2. Replace the `createMockProvider(...)` call with your own object implementing `CategoryProvider` (see `src/lib/providers/types.ts`), calling the vendor's API inside `checkCategory`.
3. Add any required secret to `.env` (server-only, no `PUBLIC_` prefix) and read it via `import.meta.env` inside that file — it's only ever evaluated in `src/pages/api/check.ts`'s server context, never bundled to the client.

No other file changes — the UI, registry, and API route are all provider-agnostic.

## 🧩 Part of the msnugget family

Free, independent, privacy-first tools for Microsoft admins — explore them all at **[msnugget.com](https://msnugget.com/)**.

| Tool | What it does |
|---|---|
| [**CMTrace.dev**](https://cmtrace.dev) | Web-based CMTrace / ConfigMgr log viewer |
| [**MSFinder**](https://msfinder.dev) | Find any Microsoft admin portal setting in one search |
| [**MSChanges**](https://mschanges.dev) | Track every change to Microsoft's documentation |
| [**M365 Change Digest**](https://mcd.msnugget.com) | Every Microsoft 365 roadmap & Message Center change in one place |
| [**Error Hunter**](https://errorhunter.app) | Resolve any Intune / Windows error code |
| ⭐ **Category Checker** | Check a domain's category across security providers · **you are here** |

## Disclaimer

Category Checker is an **independent project** and is **not affiliated with, endorsed by, or sponsored by** Microsoft, Fortinet, Cisco, Zscaler, or Netskope. Provider results — currently mocked sample data — should always be confirmed against the provider's own console before being relied on operationally.

## License

MIT.
