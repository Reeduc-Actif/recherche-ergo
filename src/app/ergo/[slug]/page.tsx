// src/app/ergo/[slug]/page.tsx
import { supabaseServer } from '@/lib/supabase'
import Link from 'next/link'

export default async function ErgoPage({ params }: { params: { slug: string } }) {
    const supabase = await supabaseServer()
    const { data: t } = await supabase
        .from('therapists')
        .select('id, full_name, headline, bio, booking_url, website, email, phone')
        .eq('slug', params.slug)
        .maybeSingle()

    if (!t)
        return <div className="text-sm text-neutral-600">Profil introuvable.</div>

    const { data: locs } = await supabase
        .from('therapist_locations')
        .select('address, city, postal_code, modes')
        .eq('therapist_id', t.id)

    // On UTILISE réellement les spécialités pour éviter le warning "unused"
    const { data: specs } = await supabase
        .from('therapist_specialties')
        .select('specialty_slug, specialties(label)')
        .eq('therapist_id', t.id)

    return (
        <main className="space-y-6">
            <h1 className="text-3xl font-semibold">{t.full_name}</h1>
            {t.headline && <p className="text-neutral-700">{t.headline}</p>}
            {t.bio && <p className="whitespace-pre-line text-neutral-700">{t.bio}</p>}

            {specs && specs.length > 0 && (
                <div>
                    <h2 className="mb-1 text-lg font-medium">Spécialités</h2>
                    <div className="flex flex-wrap gap-2">
                        {specs.map((s, i) => (
                            <span
                                key={`${s.specialty_slug}-${i}`}
                                className="rounded-full border px-2 py-0.5 text-sm"
                            >
                                {s.specialties?.[0]?.label ?? s.specialty_slug}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            <div className="space-y-1">
                {locs?.map((l, i) => (
                    <div key={i} className="text-sm text-neutral-700">
                        {l.address}, {l.postal_code} {l.city}
                        {l.modes?.length ? ` — ${l.modes.join(', ')}` : null}
                    </div>
                ))}
            </div>

            <div className="flex gap-3">
                {t.booking_url && (
                    <a
                        className="rounded-lg border px-3 py-1"
                        href={t.booking_url}
                        target="_blank"
                        rel="noreferrer"
                    >
                        Prendre RDV
                    </a>
                )}
                {t.website && (
                    <a
                        className="rounded-lg border px-3 py-1"
                        href={t.website}
                        target="_blank"
                        rel="noreferrer"
                    >
                        Site web
                    </a>
                )}
                <Link className="rounded-lg border px-3 py-1" href="/recherche">
                    ← Retour
                </Link>
            </div>
        </main>
    )
}
