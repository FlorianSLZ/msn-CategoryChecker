# Architecture

## Stack

Astro (strict TypeScript) + Tailwind v4 (CSS-first `@theme`, no config file needed) + `@astrojs/cloudflare`. No UI framework — interactivity is a single vanilla TypeScript module (`src/scripts/checker.ts`), matching the zero-framework philosophy of the reference project this design was ported from ([msn-errorhunter](https://github.com/FlorianSLZ/msn-errorhunter)).

`output: 'static'` with `export const prerender = false` on `src/pages/api/check.ts` — every content page is prerendered at build time; only the provider-check API route runs on-demand. This is what Astro v5+ calls the successor to the old `output: 'hybrid'` mode.

Deployment is a **Worker with static assets** (`wrangler deploy`, driven by the `dist/server/wrangler.json` that `@astrojs/cloudflare` generates at build time), not classic Cloudflare Pages — Cloudflare's Git-integration build system runs `npm run build` then `npx wrangler deploy` directly. Two things had to be worked around for that pipeline, both stemming from the same root cause (the adapter's generated config always names its static-assets binding `ASSETS`, which Wrangler treats as reserved *specifically when it thinks it's building a Pages project*):

- **`astro.config.mjs`**: `prerenderEnvironment: 'node'` on the adapter. By default `@astrojs/cloudflare` prerenders static pages through a local `workerd` instance (so pages using Cloudflare bindings render accurately) — none of this project's pages touch a binding, and that workerd-based prerender path was generating its own internal wrangler config with the reserved `ASSETS` name and crashing the build outright. Prerendering through plain Node sidesteps it. `session: false` is set for the same reason (Astro sessions aren't used anywhere in this project) — leaving sessions on makes the adapter add a KV binding nobody asked for.
- **`wrangler.toml`**: does **not** set `pages_build_output_dir`. That field is what makes Wrangler apply Pages' reserved-binding-name validation to the deploy-time config in the first place — it fails during `wrangler deploy` on the exact same `ASSETS` name, just at deploy time instead of build time. Since this project is deployed as a Worker, not Pages, that field never belonged here.

Revisit the `prerenderEnvironment: 'node'` / `session: false` choices if a future page needs a real Cloudflare binding (KV, D1, etc.) at build time.

## Provider abstraction

```ts
// src/lib/providers/types.ts
interface CategoryProvider {
  name: string;
  slug: string;
  homepageUrl: string;
  checkCategory(domain: string): Promise<CategoryResult>;
}
```

- `src/lib/providers/registry.ts` holds the ordered provider list and `checkAllProviders(domain)`, which runs every provider with `Promise.allSettled` and converts a rejected promise into a `status: "error"` result rather than letting one failing provider take down the whole request — every check always resolves to *something* for every provider.
- `src/lib/providers/mock.ts`'s `createMockProvider()` is the shared factory behind all five current providers (`microsoft-gsa.ts`, `fortiguard.ts`, `cisco-umbrella.ts`, `zscaler.ts`, `netskope.ts`). It hashes `slug:domain` to a deterministic category/status/latency so the same domain always returns the same mock result across repeat checks, and the loading state is exercised realistically.
- `src/pages/api/check.ts` is the only place `checkAllProviders` is called. It normalizes the incoming domain (`normalize.ts`) and returns `{ domain, results }` as JSON. **This is the seam for real integrations** — swap a provider file's mock implementation for an authenticated `fetch()` using a server-only env var; nothing else changes, because the client (`checker.ts`) only ever talks to `/api/check` and only ever knows about the `CategoryResult` shape.

## Why an API route instead of calling providers from the browser

Real provider APIs (Microsoft Graph, FortiGuard, Cisco Umbrella Investigate, Zscaler, Netskope) require authenticated calls with secrets that must never reach client JavaScript, and several would reject direct browser requests via CORS regardless. Routing every check through `src/pages/api/check.ts` means the mock-to-real swap is transparent to the UI — it was already going through this route from day one.

## Client-side checker (`src/scripts/checker.ts`)

Imported from `src/pages/index.astro` as a plain module script (not a framework island — there's no framework to island). It:

1. Normalizes input client-side (reusing the same `normalizeDomain()` used server-side) purely for a snappy inline validation message; the API route re-validates authoritatively.
2. Shows a 5-card skeleton grid while `POST /api/check` is in flight (the mock providers have simulated per-provider latency, so this is visible).
3. Renders one card per `CategoryResult`, using `status` to pick a badge color (`categorized` → accent-tinted "ok", `uncategorized` → warn, `error` → err).
4. Updates `?domain=` via `history.replaceState` and reads it on load, so a checked domain is shareable.
5. Persists recent lookups (max 12, deduped, newest first) and the theme preference to `localStorage` — nothing else is stored anywhere.

## Design tokens

`src/styles/global.css` defines the full msnugget "Signal Palette" as CSS custom properties under `:root` / `:root[data-theme="dark"]` / `:root[data-theme="light"]`, then re-exposes them to Tailwind via `@theme inline` so components can use `bg-bg-elev`, `text-accent`, `rounded-pill`, etc. Theme switching is a `data-theme` attribute on `<html>`, set synchronously by a blocking inline script in `BaseLayout.astro`'s `<head>` (before first paint, to avoid a flash of the wrong theme) and toggled by a later script that also owns the toggle button's click handler. See `DESIGN.md` for the full token/rule rationale.

## Content pages

`about.astro`, `privacy.astro`, `terms.astro` share `BaseLayout` and the same section/typography primitives as the landing page. There's no reference pattern for these (the source design had none), so they were authored fresh, matching the footer's disclaimer typography for visual consistency.
