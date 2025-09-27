import { NextResponse } from "next/server";

export const runtime = "nodejs"; // ou "edge" si tu veux

const BASE   = process.env.BEST_BASE_URL ?? "https://best.pr.fedservices.be/api/opendata/best/v1/belgianAddress/v2";
const OAUTH  = "https://public.fedservices.be/api/oauth2/token";
const ID     = process.env.BEST_CLIENT_ID;
const SECRET = process.env.BEST_CLIENT_SECRET;

// --- Cache simple du token en mémoire ---
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
    const q    = searchParams.get("q")    ?? "";
    const page = searchParams.get("page") ?? "1";

    const url = `${BASE}/municipalities?status=current&name=${encodeURIComponent(q)}&page=${encodeURIComponent(page)}`;

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

    const items = (j.items ?? []).map((m: { nisCode?: string; name?: { fr?: string; nl?: string; de?: string } }) => ({
      nis_code: m.nisCode ? parseInt(m.nisCode, 10) : null,
      name_fr: m.name?.fr ?? null,
      name_nl: m.name?.nl ?? null,
      name_de: m.name?.de ?? null,
    }));

    return NextResponse.json({ items, total: j.total, totalPages: j.totalPages });
  } catch (e: unknown) {
    return NextResponse.json({ error: true, message: e?.message ?? "unexpected" }, { status: 500 });
  }
}
