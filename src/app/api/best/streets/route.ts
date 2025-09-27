import { NextResponse } from "next/server";

export const runtime = "nodejs";

const BASE   = process.env.BEST_BASE_URL ?? "https://best.pr.fedservices.be/api/opendata/best/v1/belgianAddress/v2";
const OAUTH  = "https://public.fedservices.be/api/oauth2/token";
const ID     = process.env.BEST_CLIENT_ID;
const SECRET = process.env.BEST_CLIENT_SECRET;

let cachedToken: { value: string; exp: number } | null = null;
async function getToken() {
  if (!ID || !SECRET) return null;
  const now = Date.now() / 1000;
  if (cachedToken && cachedToken.exp > now + 30) return cachedToken.value;

  const r = await fetch(OAUTH, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: ID,
      client_secret: SECRET,
    }),
  });
  if (!r.ok) return null;
  const j = await r.json();
  cachedToken = { value: j.access_token as string, exp: now + (j.expires_in ?? 300) };
  return cachedToken.value;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const nis  = searchParams.get("nis");      // ex: 25048
    const cp   = searchParams.get("cp");       // ex: 1410
    const q    = searchParams.get("q") ?? "";  // ex: "Rue"
    const page = searchParams.get("page") ?? "1";

    const qs = new URLSearchParams({ name: q, page, status: "current" });
    if (nis) qs.set("nisCode", nis);
    if (cp)  qs.set("postCode", cp);

    const url = `${BASE}/streets?${qs.toString()}`;

    const token = await getToken();
    const headers: Record<string, string> = {
      Accept: "application/json",
      "BelGov-Trace-Id": crypto.randomUUID(),
    };
    if (token) headers.Authorization = `Bearer ${token}`;

    const r = await fetch(url, { headers });
    if (!r.ok) {
      return NextResponse.json({ error: true, status: r.status }, { status: r.status });
    }
    const j = await r.json();

    const items = (j.items ?? []).map((s: { id: string; name?: { fr?: string; nl?: string; de?: string } }) => ({
      id: s.id,
      name_fr: s.name?.fr ?? null,
      name_nl: s.name?.nl ?? null,
      name_de: s.name?.de ?? null,
    }));

    return NextResponse.json({ items, total: j.total, totalPages: j.totalPages });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "unexpected";
    return NextResponse.json({ error: true, message }, { status: 500 });
  }
}
