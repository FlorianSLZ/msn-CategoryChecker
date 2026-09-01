---
name: msnugget Category Checker
description: Multi-provider website category checker for security and network administrators
colors:
  signal-green: "#39a751"
  signal-green-deep: "#2a7d3c"
  carbon: "#181818"
  surface-ash: "#303030"
  code-surface: "#0f0f0f"
  ink-dark: "#ffffff"
  body-dark: "#a0a0a0"
  muted-dark: "#666666"
  canvas-light: "#ffffff"
  surface-light: "#f3f4f6"
  ink-light: "#111111"
  body-light: "#4a4a4a"
  muted-light: "#888888"
typography:
  display:
    fontFamily: "-apple-system, 'Segoe UI Variable', 'Segoe UI', system-ui, sans-serif"
    fontSize: "56px"
    fontWeight: 500
    lineHeight: 1.1
    letterSpacing: "-1.12px"
  headline:
    fontFamily: "-apple-system, 'Segoe UI Variable', 'Segoe UI', system-ui, sans-serif"
    fontSize: "36px"
    fontWeight: 500
    lineHeight: 1.15
    letterSpacing: "-0.5px"
  body:
    fontFamily: "-apple-system, 'Segoe UI Variable', 'Segoe UI', system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "-apple-system, 'Segoe UI Variable', 'Segoe UI', system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 600
    letterSpacing: "1.1px"
  mono:
    fontFamily: "'Cascadia Code', 'Fira Code', 'Consolas', 'SF Mono', monospace"
    fontSize: "13px"
    lineHeight: 1.75
rounded:
  full: "999px"
  card: "16px"
  xl: "12px"
spacing:
  xxxs: "4px"
  xxs: "8px"
  xs: "16px"
  sm: "24px"
  md: "32px"
  lg: "48px"
  xl: "64px"
  xxl: "96px"
---

# Design System: msnugget Category Checker

This design system is adapted directly from [Error Hunter](https://errorhunter.app)'s (`msn-errorhunter`) reference design — same brand, same "Signal Palette," same component grammar. Only the domain-specific language changes: "error code" → "URL/domain," Intune error-family categories → web-filtering categories, single-winner lookup → multi-provider result grid.

## 1. Overview

**Creative North Star: "One search, one real verdict."** Visitors arrive with one question — how is this domain categorized by Global Secure Access? — and want the answer fast. The result-card grid is built to hold several providers side by side as more are wired up; today it holds one. Marketing sections build trust and explain the provider architecture; the search bar and the result card are the actual product.

Dark by default, for the same reason as the rest of the msnugget family: this is IT tooling, not a consumer product, and admins often work in low-ambient, multi-monitor environments. One committed accent (Signal Green, `#39a751`) is used only on active, confirmed, and actionable states.

## 2. Colors: The Signal Palette

Identical token values to the rest of the msnugget family (see `src/styles/global.css` for the exact CSS custom properties). Same named rules apply:

- **The Signal Rule.** Signal Green covers no more than ~10% of any screen. It means active/confirmed/actionable — never decorative.
- **The Muted Warning.** `#666666` (dark) / `#888888` (light) is decorative-only and fails WCAG AA for body text. Use Body (`#a0a0a0` dark / `#4a4a4a` light) or Ink for anything the user must read.

### Category taxonomy

Where the reference used one hue per Intune error family, this project uses one hue per web-filtering category (`--cat-business`, `--cat-social`, `--cat-streaming`, `--cat-adult`, `--cat-gambling`, `--cat-malware`, `--cat-phishing`, `--cat-news`, `--cat-education`, `--cat-cloud`, `--cat-uncategorized`) — same mechanism, new taxonomy.

### Status badges

Per-provider result status uses the same ok/warn/err/info vocabulary as the reference, remapped:

| Status | Meaning | Color |
|---|---|---|
| `categorized` | Provider returned a category | `--ok` (Signal Green family) |
| `uncategorized` | Provider has no category for this domain | `--warn` |
| `error` | Provider lookup failed | `--err` |
| `pending` | Check in progress | `--info` |

## 3. Typography

System font stack, no web fonts — identical to the reference, for the same reason: instant render, native OS legibility, zero FOUT.

## 4. Radius grammar

Unchanged: `999px` (pill) on every interactive control — buttons, the search input, chips, status badges, toast. `16px` (card) on content containers — result cards, FAQ items.

## 5. Elevation

Flat at rest, with one deliberate, narrowly scoped exception (see "Ambient glow" below). Result cards reveal a border + `0 4px 16px rgba(0,0,0,0.25)` shadow together on hover, never independently — same compound-state rule as the reference. Filter pills, chips, status badges, and secondary/ghost buttons stay flat at rest — the exception below is not a general license to add shadows everywhere.

### Ambient glow

A resting Signal Green glow appears in a handful of deliberate places, added to soften the flat-at-rest system without diluting the Signal Rule — each is a genuinely primary/brand element or a page-rhythm device, not a decorative flourish scattered everywhere:

- **Hero background wash** (`--accent-wash`): a large, very soft `radial-gradient` centered above the hero content (`640px 360px`, fading to transparent by 70%). Atmospheric lighting, not an elevation shadow — no offset/blur mechanics apply to it the way they do to a box-shadow.
- **Section-edge washes** (`--accent-wash`, `SectionGlow.astro`): each major landing-page section below the hero (`FeatureSection`, `ProvidersSection`, `FaqAccordion`) carries a soft gradient bleeding in from a screen edge — alternating left/right down the page (left, right, left) so scrolling has a quiet rhythm instead of a repeated identical accent. The gradient's own center point sits exactly on the edge (`radial-gradient(560px 420px at 0%/100% 50%, ...)`), so only its inward half is ever visible — pure falloff flush with the edge, not a rounded shape or "dot" floating near it. Deliberately off to the side and mostly out of the reading column, not behind any text, so it reads as ambience, not a focal point. The section must be `relative overflow-hidden` and unconstrained by `.wrap` itself (the wrap-constrained content nests inside it) so the glow can bleed toward the actual viewport edge rather than being clipped to the 1120px column.
- **Primary CTA button** (`--accent-glow`, `Button.astro`'s `primary` variant only): a real offset+blur shadow (`0 8px 24px -6px`, deepening slightly on hover), not a centered halo. Ghost buttons stay shadow-free.
- **Brand glyph in the header** (`--accent-glow` via `drop-shadow`): small, offset, present only in the sticky header — the footer's glyph stays plain so the effect doesn't read as "every green icon glows."

`--accent-wash` and `--accent-glow` are theme-aware CSS custom properties (see `src/styles/global.css`), calibrated separately for dark/light so the glow reads correctly against both surfaces. Content pages (About, Privacy, Terms) don't carry any of this — it's scoped to the landing page's own persuade-mode sections.

## 6. Do's and Don'ts

Carried over unchanged from the reference (see `msn-errorhunter/DESIGN.md` for the full original if needed), with the ambient-glow exception noted above:

- **Do** reserve Signal Green for active/confirmed/actionable states only.
- **Do** apply pill radius to every interactive control, card radius to every content container.
- **Do** keep dark as the primary surface; light is a user toggle, not the default.
- **Do** provide a visible `outline: 2px solid var(--accent); outline-offset: 2px` on every `:focus-visible` state.
- **Do** respect `prefers-reduced-motion` on every transition.
- **Don't** use Muted (`#666666`/`#888888`) for content text.
- **Don't** add resting shadows outside the three ambient-glow spots above — chips, secondary buttons, and cards stay flat at rest.
- **Don't** style this to look like an official Microsoft, Fortinet, Cisco, Zscaler, or Netskope product — no vendor color palettes, no implied affiliation.
- **Don't** introduce a second accent color.
