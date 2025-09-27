// scripts/seed-best.mjs
import fetch from "node-fetch";
import { createClient } from "@supabase/supabase-js";

const BASE = process.env.BEST_BASE_URL ?? "https://best.pr.fedservices.be/api/opendata/best/v1/belgianAddress/v2";
const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPA_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!SUPA_URL || !SUPA_KEY) throw new Error("Missing Supabase env vars");
const supa = createClient(SUPA_URL, SUPA_KEY);

async function fetchPaged(path) {
  let page = 1, out = [];
  for (;;) {
    const url = `${BASE}${path}${path.includes("?") ? "&" : "?"}page=${page}`;
    const r = await fetch(url, { headers: { Accept: "application/json", "BelGov-Trace-Id": `seed-${page}` }});
    if (!r.ok) throw new Error(`${r.status} ${url}`);
    const j = await r.json();
    out.push(...(j.items ?? []));
    if (page >= (j.totalPages ?? 1)) break;
    page++;
  }
  return out;
}

async function seedMunicipalities() {
  const items = await fetchPaged("/municipalities?status=current");
  const rows = items.map(m => ({
    nis_code: parseInt(m.nisCode, 10),
    name_fr:  m.name?.fr ?? null,
    name_nl:  m.name?.nl ?? null,
    name_de:  m.name?.de ?? null,
  }));
  for (let i=0;i<rows.length;i+=500) {
    const chunk = rows.slice(i,i+500);
    const { error } = await supa.from("belgian_municipalities").upsert(chunk, { onConflict:"nis_code" });
    if (error) throw error;
  }
  console.log("Municipalities:", rows.length);
}

async function seedPostalInfosAndLinks() {
  const items = await fetchPaged("/postalInfos?status=current");

  // 1) Upsert postal infos
  const postalRows = items.map(p => ({
    post_code: p.postCode ?? null,
    name_fr:   p.name?.fr ?? null,
    name_nl:   p.name?.nl ?? null,
    name_de:   p.name?.de ?? null,
  }));

  const { data: inserted, error } = await supa
    .from("belgian_postalinfos")
    .upsert(postalRows, { onConflict: "uniq_key" })
    .select("id, post_code, name_fr, name_nl, name_de");
  if (error) throw error;

  // 2) Lier CP <-> communes via NIS si présent dans la réponse
  const links = [];
  for (const p of items) {
    const match = inserted.find(x =>
      x.post_code === (p.postCode ?? null) &&
      x.name_fr   === (p.name?.fr ?? null) &&
      x.name_nl   === (p.name?.nl ?? null) &&
      x.name_de   === (p.name?.de ?? null)
    );
    if (!match) continue;

    const nisList = (p.municipalities ?? [])
      .map(m => parseInt(m.nisCode,10))
      .filter(Boolean);

    for (const nis of nisList) links.push({ postalinfo_id: match.id, nis_code: nis });
  }

  // dédoublonner
  const key = new Set(), dedup = [];
  for (const l of links) {
    const k = `${l.postalinfo_id}:${l.nis_code}`;
    if (!key.has(k)) { key.add(k); dedup.push(l); }
  }

  for (let i=0;i<dedup.length;i+=1000) {
    const chunk = dedup.slice(i,i+1000);
    const { error: e2 } = await supa.from("belgian_postalinfo_municipality").upsert(chunk);
    if (e2) throw e2;
  }

  console.log("PostalInfos:", inserted.length, "links:", dedup.length);
}

await seedMunicipalities();
await seedPostalInfosAndLinks();
console.log("✅ Done");