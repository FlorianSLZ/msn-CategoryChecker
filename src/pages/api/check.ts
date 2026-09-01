import type { APIRoute } from "astro";
import { normalizeDomain } from "@/lib/providers/normalize";
import { checkAllProviders } from "@/lib/providers/registry";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Request body must be JSON.", 400);
  }

  const rawInput = typeof body === "object" && body !== null && "domain" in body ? String((body as Record<string, unknown>).domain ?? "") : "";

  const domain = normalizeDomain(rawInput);
  if (!domain) {
    return jsonError("Enter a valid website URL or domain name, e.g. microsoft.com.", 422);
  }

  const results = await checkAllProviders(domain);

  return new Response(JSON.stringify({ domain, results }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
};

function jsonError(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "content-type": "application/json" },
  });
}
