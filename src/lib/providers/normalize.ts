/**
 * Normalizes arbitrary pasted input (a bare domain, a full URL, a domain with
 * a trailing path/query, mixed case, surrounding whitespace) down to a single
 * canonical lowercase domain — e.g. "https://Microsoft.com/en-us/?x=1 " -> "microsoft.com".
 * Ports the accept-many-forms/produce-one-canonical-form pattern from
 * msn-errorhunter's js/errorlookup.js.
 */
export function normalizeDomain(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  let hostname: string;
  try {
    hostname = new URL(withScheme).hostname;
  } catch {
    return null;
  }

  hostname = hostname.toLowerCase().replace(/^www\./, "");

  const domainPattern = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i;
  if (!domainPattern.test(hostname)) return null;

  return hostname;
}
