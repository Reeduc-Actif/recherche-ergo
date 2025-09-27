import fetch from 'node-fetch'
import { createClient } from '@supabase/supabase-js'

const BASE = process.env.BEST_BASE_URL
  ?? 'https://best.pr.fedservices.be/api/opendata/best/v1/belgianAddress/v2'
const SUPA_URL = "https://adhynbjpjvlezmlxjfow.supabase.co"
const SUPA_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkaHluYmpwanZsZXptbHhqZm93Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyNTc4OTUsImV4cCI6MjA3MDgzMzg5NX0.U15aHqZFLluA1r-EnG0G4wpxd460KyxtsqdAJVWMOxc"
const supa = createClient(SUPA_URL, SUPA_KEY)

async function getAllMunicipalities() {
  let page = 1, items = []
  while (true) {
    const r = await fetch(`${BASE}/municipalities?status=current&page=${page}`, {
      headers: { 'Accept':'application/json', 'BelGov-Trace-Id': `seed-${page}` }
    })
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
    const j = await r.json()
    items.push(...(j.items ?? []))
    if (page >= (j.totalPages ?? 1)) break
    page++
  }
  return items.map(m => ({
    nis_code: parseInt(m.nisCode, 10),
    name_fr: m.name?.fr ?? null,
    name_nl: m.name?.nl ?? null,
    name_de: m.name?.de ?? null
  }))
}

const rows = await getAllMunicipalities()
for (let i = 0; i < rows.length; i += 500) {
  const chunk = rows.slice(i, i + 500)
  const { error } = await supa.from('belgian_cities').upsert(chunk, { onConflict: 'nis_code' })
  if (error) throw error
}
console.log('Inserted', rows.length)
