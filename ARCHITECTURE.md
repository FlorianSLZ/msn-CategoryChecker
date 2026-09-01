# Architecture

## Stack

Astro (strict TypeScript) + Tailwind v4 (CSS-first `@theme`, no config file needed) + `@astrojs/cloudflare`. No UI framework — interactivity is a single vanilla TypeScript module (`src/scripts/checker.ts`), matching the zero-framework philosophy of the reference project this design was ported from ([msn-errorhunter](https://github.com/FlorianSLZ/msn-errorhunter)).

`output: 'static'` with `export const prerender = false` on `src/pages/api/check.ts` — every content page is prerendered at build time; only the provider-check API route runs on-demand. This is what Astro v5+ calls the successor to the old `output: 'hybrid'` mode.

Deployment is a **Worker with static assets** (`wrangler deploy`, driven by the `dist/server/wrangler.json` that `@astrojs/cloudflare` generates at build time), not classic Cloudflare Pages — Cloudflare's Git-integration build system runs `npm run build` then `npx wrangler deploy` directly.

`wrangler.toml` deliberately does **not** set `pages_build_output_dir`. The adapter's generated wrangler configs (both the one used to prerender static pages through a local `workerd` instance, and the one used for the actual deploy) always name their static-assets binding `ASSETS` — and Wrangler treats that as a reserved name, but *only* when `pages_build_output_dir` signals "this is a Pages project" to it. With that field present, both the build's prerender step and the production `wrangler deploy` failed on the exact same reserved-name error; removing it fixed both at once, and let prerendering stay on its default `workerd` environment (needed since `src/lib/providers/microsoft-gsa.ts` does a top-level `import { env } from "cloudflare:workers"` — that import only resolves inside an actual Workers runtime, not plain Node, so anything that transitively imports the provider registry, like `ProvidersSection.astro`, needs prerendering to run through `workerd`). `session: false` is set because Astro sessions aren't used anywhere in this project — leaving them on makes the adapter add a KV binding nobody asked for.

Revisit `session: false` if a future page needs Astro's session API.

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

- `src/lib/providers/registry.ts` holds the ordered provider list — **only `microsoftGsaProvider` today** — and `checkAllProviders(domain)`, which runs every registered provider with `Promise.allSettled` and converts a rejected promise into a `status: "error"` result rather than letting one failing provider take down the whole request — every check always resolves to *something* for every provider.
- `src/lib/providers/mock.ts`'s `createMockProvider()` is the shared mock factory. It's used directly by `microsoft-gsa.ts` as its no-credentials fallback (see below), and is the pattern any future provider should follow too: hash `slug:domain` into a deterministic category/status/latency so the same domain always returns the same mock result and the loading state is exercised realistically. **This is placeholder data with no relationship to the domain's real content** — it exists to exercise the UI/architecture before real credentials are available, not to look accurate.
- `src/pages/api/check.ts` is the only place `checkAllProviders` is called. It normalizes the incoming domain (`normalize.ts`) and returns `{ domain, results }` as JSON. Individual provider files are the seam for real integrations — the client (`checker.ts`) only ever talks to `/api/check` and only ever knows about the `CategoryResult` shape, so adding or swapping a provider's implementation never touches the UI.

### Why FortiGuard, Cisco Umbrella, Zscaler, and Netskope aren't wired up

Investigated directly (not just from vendor marketing pages) before deciding to scope this down to Microsoft Global Secure Access only:

- **FortiGuard** (`fortiguard.com/webfilter`): returned `403 Forbidden` to a plain server-side request, and failed to load in a real browser tab too — WAF/bot-protected. Automated access requires FortiGuard's premium rating API (a token tied to a Fortinet/FortiCloud account).
- **Zscaler** (`sitereview.zscaler.com`): has an internal `/api/lookup` endpoint (`405` on GET confirms it exists, wants POST), but POSTing to it returns `403 Forbidden` without a real browser session/CSRF token. The documented API (ZIA URL Categories, or the newer OneAPI) requires a paid ZIA subscription and admin API credentials.
- **Cisco Umbrella / Talos**: Talos's reputation/category lookup is web-only, no public API (confirmed in Cisco's own support docs). Umbrella's actual categorization API (Investigate) is a paid product requiring a subscription and API key.
- **Netskope**: confirmed customer-only in Netskope's own docs — both the URL Lookup tool and its REST API v2 require an active subscription.

None of these offer a legitimate, free, unauthenticated path to real data, and scraping around FortiGuard's or Zscaler's bot protection would be fragile and against their intent. If real API credentials for any of them become available, add a provider file following the `microsoft-gsa.ts` pattern and register it in `registry.ts` — no other changes needed.

### Microsoft Global Secure Access — real integration

`microsoft-gsa.ts` is the one provider currently wired to a real API: the Graph **beta** function `GET /networkaccess/connectivity/getWebCategoryByUrl(url='@url')` ([docs](https://learn.microsoft.com/graph/api/networkaccess-connectivity-getwebcategorybyurl?view=graph-rest-beta)), which requires:

- An Entra ID app registration with the **`NetworkAccess.Read.All`** *application* permission, admin-consented.
- The tenant having **Global Secure Access / Entra Internet Access web content filtering** actually enabled — this isn't a generic "any Microsoft tenant" API.
- App-only (client credentials) auth: `src/lib/providers/microsoft-graph-auth.ts` exchanges `MSFT_TENANT_ID` / `MSFT_GSA_CLIENT_ID` / `MSFT_GSA_CLIENT_SECRET` for a token at `https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token` (`grant_type=client_credentials`, `scope=https://graph.microsoft.com/.default`), cached in a module-level variable for the isolate's lifetime.
- A `404 NotFound` response from the Graph API (`{"error":{"code":"NotFound","message":"No web category found for URL: ..."}}`) is the documented, expected shape for a domain with no categorization — mapped to `status: "uncategorized"`, not `"error"`.

**Credentials are Cloudflare Worker secrets, not Vite/`.env` variables.** They're read via `import { env } from "cloudflare:workers"` (the current `@astrojs/cloudflare` runtime-env access pattern — the older `context.locals.runtime.env` is deprecated in the installed adapter version) inside `microsoft-gsa.ts`, so `checkCategory`'s signature never changed and no other provider file, `registry.ts`, or `check.ts` needed to change. See `.dev.vars.example` for local dev (`wrangler`/`astro dev` reads secrets from `.dev.vars`, never from `.env`) and `wrangler secret put` for production. **If the three env vars aren't set, `microsoftGsaProvider` transparently falls back to `createMockProvider()`** — the tool stays usable without a GSA tenant, it just doesn't return real data.

## Why an API route instead of calling providers from the browser

Real provider APIs require authenticated calls with secrets that must never reach client JavaScript, and most reject direct browser requests via CORS regardless. Routing every check through `src/pages/api/check.ts` means a mock-to-real swap is transparent to the UI — it was already going through this route from day one.

## Client-side checker (`src/scripts/checker.ts`)

Imported from `src/pages/index.astro` as a plain module script (not a framework island — there's no framework to island). It:

1. Normalizes input client-side (reusing the same `normalizeDomain()` used server-side) purely for a snappy inline validation message; the API route re-validates authoritatively.
2. Shows a single generic skeleton block while `POST /api/check` is in flight — not one per provider, since the client doesn't know the registered provider count ahead of the response (and can't safely import the registry to find out: it transitively pulls in code that depends on the Workers runtime).
3. Renders one card per `CategoryResult`, using `status` to pick a badge color (`categorized` → accent-tinted "ok", `uncategorized` → warn, `error` → err).
4. Updates `?domain=` via `history.replaceState` and reads it on load, so a checked domain is shareable.
5. Persists recent lookups (max 12, deduped, newest first) and the theme preference to `localStorage` — nothing else is stored anywhere.

## Design tokens

`src/styles/global.css` defines the full msnugget "Signal Palette" as CSS custom properties under `:root` / `:root[data-theme="dark"]` / `:root[data-theme="light"]`, then re-exposes them to Tailwind via `@theme inline` so components can use `bg-bg-elev`, `text-accent`, `rounded-pill`, etc. Theme switching is a `data-theme` attribute on `<html>`, set synchronously by a blocking inline script in `BaseLayout.astro`'s `<head>` (before first paint, to avoid a flash of the wrong theme) and toggled by a later script that also owns the toggle button's click handler. See `DESIGN.md` for the full token/rule rationale.

## Content pages

`about.astro`, `privacy.astro`, `terms.astro` share `BaseLayout` and the same section/typography primitives as the landing page. There's no reference pattern for these (the source design had none), so they were authored fresh, matching the footer's disclaimer typography for visual consistency.
