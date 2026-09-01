import { normalizeDomain } from "@/lib/providers/normalize";
import type { CategoryResult } from "@/lib/providers/types";

const RECENT_KEY = "cc-recent";
const RECENT_MAX = 12;

const form = document.getElementById("checker-form") as HTMLFormElement | null;
const input = document.getElementById("checker-input") as HTMLInputElement | null;
const errorEl = document.getElementById("checker-error");
const resultsSection = document.getElementById("results-section");
const resultsGrid = document.getElementById("results-grid");
const resultsDomainEl = document.getElementById("results-domain");
const recentWrap = document.getElementById("recent-lookups");
const recentChipsEl = document.getElementById("recent-chips");
const clearRecentBtn = document.getElementById("clear-recent");
const toastHost = document.getElementById("toast-host");

if (form && input && errorEl && resultsSection && resultsGrid && resultsDomainEl) {
  init();
}

function init() {
  form!.addEventListener("submit", (event) => {
    event.preventDefault();
    runCheck(input!.value);
  });

  document.querySelectorAll<HTMLButtonElement>(".example-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      const domain = chip.dataset.domain ?? "";
      input!.value = domain;
      runCheck(domain);
    });
  });

  clearRecentBtn?.addEventListener("click", () => {
    localStorage.removeItem(RECENT_KEY);
    renderRecent();
  });

  renderRecent();

  const params = new URLSearchParams(window.location.search);
  const initialDomain = params.get("domain");
  if (initialDomain) {
    input!.value = initialDomain;
    runCheck(initialDomain, { skipUrlUpdate: true });
  }
}

async function runCheck(rawInput: string, options: { skipUrlUpdate?: boolean } = {}) {
  const domain = normalizeDomain(rawInput);
  if (!domain) {
    setError("Enter a valid website URL or domain name, e.g. microsoft.com.");
    return;
  }
  setError("");

  if (!options.skipUrlUpdate) {
    const url = new URL(window.location.href);
    url.searchParams.set("domain", domain);
    history.replaceState(null, "", url);
  }

  showLoading(domain);

  try {
    const response = await fetch("/api/check", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ domain }),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({ error: "Something went wrong." }));
      setError(body.error ?? "Something went wrong. Please try again.");
      resultsSection!.classList.add("hidden");
      return;
    }

    const data = (await response.json()) as { domain: string; results: CategoryResult[] };
    renderResults(data.domain, data.results);
    addRecent(data.domain);
  } catch {
    setError("Network error — could not reach the check API. Please try again.");
    resultsSection!.classList.add("hidden");
  }
}

function setError(message: string) {
  errorEl!.textContent = message;
}

function showLoading(domain: string) {
  resultsSection!.classList.remove("hidden");
  resultsDomainEl!.textContent = domain;
  resultsGrid!.innerHTML = "";
  // One generic skeleton rather than N provider-shaped ones — the client
  // doesn't know how many providers are registered ahead of the response
  // (and can't safely import the registry: it pulls in provider code that
  // depends on the Cloudflare Workers runtime).
  const skeleton = document.createElement("div");
  skeleton.className = "h-[148px] animate-pulse rounded-card border border-border bg-bg-elev";
  resultsGrid!.appendChild(skeleton);
}

const STATUS_LABEL: Record<CategoryResult["status"], string> = {
  categorized: "Categorized",
  uncategorized: "Uncategorized",
  error: "Lookup failed",
  pending: "Checking…",
};

const STATUS_CLASS: Record<CategoryResult["status"], string> = {
  categorized: "bg-accent-soft text-ok border-accent-border",
  uncategorized: "bg-[var(--hover-bg)] text-warn border-border-strong",
  error: "bg-[var(--hover-bg)] text-err border-border-strong",
  pending: "bg-[var(--hover-bg)] text-info border-border-strong",
};

function renderResults(domain: string, results: CategoryResult[]) {
  resultsSection!.classList.remove("hidden");
  resultsDomainEl!.textContent = domain;
  resultsGrid!.innerHTML = "";

  for (const result of results) {
    resultsGrid!.appendChild(buildResultCard(result));
  }
}

function buildResultCard(result: CategoryResult): HTMLElement {
  const card = document.createElement("article");
  card.className =
    "result-card flex flex-col gap-3 rounded-card border border-transparent bg-bg-elev p-6 transition-[border-color,box-shadow] hover:border-border-strong hover:shadow-[0_4px_16px_rgba(0,0,0,0.25)]";

  const top = document.createElement("div");
  top.className = "flex items-start justify-between gap-3";

  const providerName = document.createElement("h3");
  providerName.className = "text-[16px] font-medium text-heading";
  providerName.textContent = result.provider;

  const badge = document.createElement("span");
  badge.className = `shrink-0 rounded-pill border px-3 py-1 text-[11px] font-semibold uppercase tracking-[1.1px] ${STATUS_CLASS[result.status]}`;
  badge.textContent = STATUS_LABEL[result.status];

  top.append(providerName, badge);

  const category = document.createElement("p");
  category.className = "font-mono text-[14px] text-fg";
  category.textContent = result.category ?? (result.status === "error" ? (result.message ?? "No data available") : "No category assigned");

  const footer = document.createElement("div");
  footer.className = "mt-auto flex items-center justify-between border-t border-border pt-3 text-[12px] text-fg-faint";

  const lastChecked = document.createElement("span");
  lastChecked.textContent = `Checked ${formatTime(result.lastChecked)}`;

  const copyBtn = document.createElement("button");
  copyBtn.type = "button";
  copyBtn.className = "font-semibold uppercase tracking-[0.6px] text-fg hover:text-heading";
  copyBtn.textContent = "Copy";
  copyBtn.addEventListener("click", () => {
    const summary = `${result.provider}: ${result.category ?? "uncategorized"} (${result.domain})`;
    void copyText(summary);
    showToast("Copied to clipboard");
  });

  footer.append(lastChecked, copyBtn);
  card.append(top, category, footer);
  return card;
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  } catch {
    return iso;
  }
}

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
  }
}

function showToast(message: string) {
  if (!toastHost) return;
  const toast = document.createElement("div");
  toast.className =
    "pointer-events-auto rounded-pill bg-accent px-4 py-2 text-[13px] font-semibold tracking-[0.5px] text-accent-fg opacity-0 translate-y-2 transition-all duration-200";
  toast.textContent = message;
  toastHost.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.remove("opacity-0", "translate-y-2");
  });

  setTimeout(() => {
    toast.classList.add("opacity-0", "translate-y-2");
    setTimeout(() => toast.remove(), 200);
  }, 1800);
}

function getRecent(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function addRecent(domain: string) {
  const current = getRecent().filter((d) => d !== domain);
  current.unshift(domain);
  localStorage.setItem(RECENT_KEY, JSON.stringify(current.slice(0, RECENT_MAX)));
  renderRecent();
}

function renderRecent() {
  if (!recentWrap || !recentChipsEl) return;
  const recent = getRecent();
  recentWrap.classList.toggle("hidden", recent.length === 0);
  recentWrap.classList.toggle("flex", recent.length > 0);
  recentChipsEl.innerHTML = "";

  for (const domain of recent) {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "rounded-pill border border-border-strong px-3 py-1 font-mono text-fg transition-colors hover:bg-[var(--hover-bg)] hover:text-heading";
    chip.textContent = domain;
    chip.addEventListener("click", () => {
      input!.value = domain;
      runCheck(domain);
    });
    recentChipsEl.appendChild(chip);
  }
}
