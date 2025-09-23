// src/app/api/pro/onboard/route.ts
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseServer } from '@/lib/supabase'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Helpers pour convertir '' -> undefined
const emptyToUndef = <T,>(v: T) =>
  (v === '' || v === null || (typeof v === 'string' && v.trim() === '')) ? undefined : v

const Payload = z.object({
  full_name: z.string().trim().min(2, 'Nom requis'),
  headline: z.preprocess(emptyToUndef, z.string().trim().optional()),
  phone: z.preprocess(emptyToUndef, z.string().trim().optional()),
  booking_url: z.preprocess(emptyToUndef, z.string().url().optional()),

  languages: z.array(z.enum(['fr', 'nl', 'de', 'en'])).nonempty('Choisir au moins une langue'),
  specialties: z.array(z.string().min(1)).nonempty('Choisir au moins une spécialité'),
  modes: z.preprocess(
    (v) => Array.isArray(v) ? v : [],
    z.array(z.enum(['cabinet', 'domicile', 'visio'])).optional().default([]),
  ),

  address: z.string().trim().min(2),
  postal_code: z.string().trim().min(2),
  city: z.string().trim().min(2),
  country: z.preprocess(emptyToUndef, z.string().trim().default('BE')),

  // IMPORTANT : ne pas échouer si '' est envoyé
  price_min: z.preprocess(
    (v) => emptyToUndef(v),
    z.number().int().min(1).max(1000),
  ).optional(),
  price_max: z.preprocess(
    (v) => emptyToUndef(v),
    z.number().int().min(1).max(1000),
  ).optional(),
  price_unit: z.preprocess(emptyToUndef, z.enum(['hour', 'session']).optional()),
})

type Geo = { lon: number | null; lat: number | null }

async function geocode(addr: { address: string; postal_code: string; city: string; country: string }): Promise<Geo> {
  const token = process.env.MAPBOX_TOKEN_SERVER || process.env.NEXT_PUBLIC_MAPBOX_TOKEN
  if (!token) return { lon: null, lat: null }
  const q = encodeURIComponent(`${addr.address}, ${addr.postal_code} ${addr.city}, ${addr.country}`)
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${q}.json?access_token=${token}&limit=1&country=be`
  try {
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) return { lon: null, lat: null }
    const json = await res.json()
    const feat = json?.features?.[0]
    if (feat?.center?.length === 2) {
      const [lon, lat] = feat.center
      return { lon: Number(lon), lat: Number(lat) }
    }
    return { lon: null, lat: null }
  } catch {
    return { lon: null, lat: null }
  }
}

export async function POST(req: Request) {
  const supabase = await supabaseServer()
  const { data: auth } = await supabase.auth.getUser()
  const user = auth?.user
  if (!user) {
    return NextResponse.json({ ok: false, error: 'Unauthenticated' }, { status: 401 })
  }

  // 1) parse + validations métier
  let input: z.infer<typeof Payload>
  try {
    const raw = await req.json()
    input = Payload.parse(raw)
  } catch (e) {
    return NextResponse.json({ ok: false, error: 'Données invalides', details: e }, { status: 400 })
  }
  if (input.price_min && input.price_max && input.price_min > input.price_max) {
    return NextResponse.json({ ok: false, error: 'price_min > price_max' }, { status: 400 })
  }

  // 2) sécurité : filtrer les spécialités sur la table whitelist
  const { data: allowedSpecs, error: specsErr } = await supabase
    .from('specialties')
    .select('slug')
  if (specsErr) {
    return NextResponse.json({ ok: false, error: 'Erreur lecture spécialités' }, { status: 400 })
  }
  const allowed = new Set((allowedSpecs ?? []).map(s => s.slug as string))
  const cleanSpecialties = (input.specialties ?? []).filter(s => allowed.has(s))
  if (cleanSpecialties.length === 0) {
    return NextResponse.json({ ok: false, error: 'Aucune spécialité valide' }, { status: 400 })
  }

  // 3) géocodage
  const { lon, lat } = await geocode({
    address: input.address,
    postal_code: input.postal_code,
    city: input.city,
    country: input.country,
  })

  // 4) slug unique (basé sur nom)
  const base = input.full_name
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
  let slug = base || `ergo-${user.id.slice(0, 8)}`
  for (let i = 0; i < 5; i++) {
    const { data: exists } = await supabase.from('therapists').select('id').eq('slug', slug).maybeSingle()
    if (!exists) break
    slug = `${base}-${Math.random().toString(36).slice(2, 6)}`
  }

  // 5) transaction séquentielle avec upsert idempotent sur profile_id
  try {
    // A) therapists (upsert par profile_id pour éviter les duplicats)
    const { data: th, error: e1 } = await supabase
      .from('therapists')
      .upsert({
        // si le profil existe déjà, on ne l’écrase pas agressivement
        slug,
        profile_id: user.id,
        full_name: input.full_name,
        headline: input.headline ?? null,
        email: user.email,
        phone: input.phone ?? null,
        website: null,
        booking_url: input.booking_url ?? null,
        price_hint: null,
        price_min: input.price_min ?? null,
        price_max: input.price_max ?? null,
        price_unit: input.price_unit ?? null,
        is_published: true,
        is_approved: true,
      }, { onConflict: 'profile_id' })
      .select('id, slug')
      .single()
    if (e1) throw e1
    const therapist_id = th!.id as string

    // B) langues (table de relation : therapist_languages(language_code))
    if (input.languages?.length) {
      const rows = input.languages.map(code => ({ therapist_id, language_code: code }))
      const { error: e2 } = await supabase
        .from('therapist_languages')
        .upsert(rows, { onConflict: 'therapist_id,language_code', ignoreDuplicates: true })
      if (e2) throw e2
    }

    // C) spécialités (relation FK sécurisée par filtre plus haut)
    if (cleanSpecialties.length) {
      const rows = cleanSpecialties.map(slug => ({ therapist_id, specialty_slug: slug }))
      const { error: e3 } = await supabase
        .from('therapist_specialties')
        .upsert(rows, { onConflict: 'therapist_id,specialty_slug', ignoreDuplicates: true })
      if (e3) throw e3
    }

    // D) localisation
    const coordsWkt = (lon != null && lat != null) ? `SRID=4326;POINT(${lon} ${lat})` : null
    // pour idempotence : s’il existe déjà une localisation principale, on n’en recrée pas 50
    const { data: locExists, error: locErr } = await supabase
      .from('therapist_locations')
      .select('id')
      .eq('therapist_id', therapist_id)
      .limit(1)
    if (locErr) throw locErr
    if (!locExists || locExists.length === 0) {
      const { error: e4 } = await supabase.from('therapist_locations').insert({
        therapist_id,
        address: input.address,
        city: input.city,
        postal_code: input.postal_code,
        country: input.country,
        modes: input.modes ?? [],
        coords: coordsWkt,
      })
      if (e4) throw e4
    } else {
      // sinon, on met juste à jour l’adresse (optionnel)
      await supabase.from('therapist_locations').update({
        address: input.address,
        city: input.city,
        postal_code: input.postal_code,
        country: input.country,
        modes: input.modes ?? [],
        coords: coordsWkt,
      }).eq('id', locExists[0].id)
    }

    return NextResponse.json({ ok: true, therapist_id, slug })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Erreur'
    return NextResponse.json({ ok: false, error: msg }, { status: 400 })
  }
}
