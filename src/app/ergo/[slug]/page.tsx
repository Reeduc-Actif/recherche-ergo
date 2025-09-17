// src/app/ergo/[slug]/page.tsx
import { supabaseServer } from '@/lib/supabase'
import Link from 'next/link'

type Params = { slug: string }

type SpecRow = {
    specialty_slug: string
    specialties: { slug: string; label: string; parent_slug: string | null }[] // Supabase renvoie un array
}

export default async function ErgoPage({ params }: { params: Promise<Params> }) {
    const { slug } = await params
    const supabase = await supabaseServer()

    // 1) Thérapeute (profil de base)
    const { data: t, error: tErr } = await supabase
        .from('therapists')
        .select('id, slug, full_name, headline, bio, booking_url, website, email, phone, is_published')
        .eq('slug', slug)
        .maybeSingle()

    if (tErr) {
        return <div className="text-sm text-red-600">Erreur chargement profil.</div>
    }
    if (!t || !t.id) {
        return <div className="text-sm text-neutral-600">Profil introuvable.</div>
    }
    if (!t.is_published) {
        return <div className="text-sm text-neutral-600">Ce profil n’est pas publié.</div>
    }

    // 2) Localisations (adresses + modes)
    const { data: locs } = await supabase
        .from('therapist_locations')
        .select('address, city, postal_code, modes')
        .eq('therapist_id', t.id)
        .order('id', { ascending: true })

    // 3) Spécialités (jointes pour les labels + parent_slug)
    const { data: specsRaw } = await supabase
        .from('therapist_specialties')
        .select('specialty_slug, specialties ( slug, label, parent_slug )')
        .eq('therapist_id', t.id)

    // Mise en forme : groupage par catégorie (parent)
    // parent_slug = null => c'est une catégorie top-level (ex: "pediatrie", "adulte", "geriatrie")
    // On affiche les sous-spécialités sous leur catégorie ; si l’ergo n’a que la catégorie, on la montre telle quelle.
    const byCategory = new Map<string, { catSlug: string; catLabel: string; subs: { slug: string; label: string }[] }>()
    const ensureCat = (catSlug: string, catLabel: string) => {
        if (!byCategory.has(catSlug)) {
            byCategory.set(catSlug, { catSlug, catLabel, subs: [] })
        }
        return byCategory.get(catSlug)!
    }

        ; (specsRaw as SpecRow[] | null)?.forEach((row) => {
            const s = row.specialties?.[0]
            if (!s) return
            const isCategory = !s.parent_slug
            if (isCategory) {
                // L’ergo a sélectionné la catégorie directement → on affiche la catégorie seule
                const cat = ensureCat(s.slug, s.label)
                // on n'ajoute pas de sous-spé, juste la catégorie sera affichée comme "badge"
                if (cat.subs.length === 0) {
                    // pas d’action spécifique; on affichera un badge "catégorie"
                }
            } else {
                // Sous-spécialité : ranger sous sa catégorie
                const parentSlug = s.parent_slug!
                // On a besoin du label de la catégorie : on peut le déduire via une requête supplémentaire
                // pour éviter un aller-retour, on stocke le slug et label sous-spé, et mettra un label "fallback" de catSlug capitalisé si on ne le résout pas mieux
                const cat = ensureCat(parentSlug, slugToLabelFallback(parentSlug))
                cat.subs.push({ slug: s.slug, label: s.label })
            }
        })

    // Récupérer les labels de catégories présentes si on a des sous-spés sans label de cat
    // (facultatif : améliore l’affichage)
    if (byCategory.size > 0) {
        const missingCatSlugs = [...byCategory.values()]
            .filter((c) => c.catLabel === slugToLabelFallback(c.catSlug))
            .map((c) => c.catSlug)
        if (missingCatSlugs.length) {
            const { data: cats } = await supabase
                .from('specialties')
                .select('slug,label')
                .in('slug', missingCatSlugs)
            cats?.forEach((c) => {
                const bucket = byCategory.get(c.slug)
                if (bucket) bucket.catLabel = c.label
            })
        }
    }

    // 4) Langues (source unique : table de liaison `therapist_languages`)
    const LANG_LABELS: Record<string, string> = {
        fr: 'Français',
        nl: 'Néerlandais',
        de: 'Allemand',
        en: 'Anglais',
    }
    const mapLang = (code: string) => LANG_LABELS[code] ?? null

    const { data: langs } = await supabase
        .from('therapist_languages')
        .select('language_code')
        .eq('therapist_id', t.id)
        .order('language_code', { ascending: true })

    const languages: string[] = Array.from(
        new Set((langs ?? []).map(l => mapLang(l.language_code)).filter(Boolean) as string[])
    )


    // 5) Rendu
    return (
        <main className="space-y-6">
            <div>
                <h1 className="text-3xl font-semibold">{t.full_name}</h1>
                {t.headline && <p className="text-neutral-700">{t.headline}</p>}
            </div>

            {/* Coordonnées rapides */}
            {(t.email || t.phone || t.website || t.booking_url) && (
                <div className="flex flex-wrap gap-2">
                    {t.booking_url && (
                        <a className="rounded-lg border px-3 py-1 text-sm hover:bg-neutral-50" href={t.booking_url} target="_blank" rel="noreferrer">
                            Prendre RDV
                        </a>
                    )}
                    {t.website && (
                        <a className="rounded-lg border px-3 py-1 text-sm hover:bg-neutral-50" href={t.website} target="_blank" rel="noreferrer">
                            Site web
                        </a>
                    )}
                    {t.email && (
                        <a className="rounded-lg border px-3 py-1 text-sm hover:bg-neutral-50" href={`mailto:${t.email}`}>
                            Email
                        </a>
                    )}
                    {t.phone && (
                        <a className="rounded-lg border px-3 py-1 text-sm hover:bg-neutral-50" href={`tel:${t.phone}`}>
                            Téléphone
                        </a>
                    )}
                </div>
            )}

            {/* Bio */}
            {t.bio && (
                <section>
                    <h2 className="mb-1 text-lg font-medium">À propos</h2>
                    <p className="whitespace-pre-line text-neutral-700">{t.bio}</p>
                </section>
            )}

            {/* Spécialités (groupées par catégorie) */}
            {byCategory.size > 0 && (
                <section className="space-y-3">
                    <h2 className="text-lg font-medium">Spécialités</h2>
                    <div className="space-y-2">
                        {[...byCategory.values()].map((bucket) => (
                            <div key={bucket.catSlug}>
                                <div className="text-sm font-semibold">{bucket.catLabel}</div>
                                {bucket.subs.length > 0 ? (
                                    <div className="mt-1 flex flex-wrap gap-2">
                                        {bucket.subs.map((sub) => (
                                            <span key={sub.slug} className="rounded-full border px-2 py-0.5 text-sm">
                                                {sub.label}
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    // l’ergo a coché directement la catégorie top-level
                                    <div className="mt-1 flex flex-wrap gap-2">
                                        <span className="rounded-full border px-2 py-0.5 text-sm">{bucket.catLabel}</span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Langues parlées */}
            {languages?.length ? (
                <div>
                    <h2 className="mb-1 text-lg font-medium">Langues</h2>
                    <div className="flex flex-wrap gap-2">
                        {languages.map((code, i) => (
                            <span key={`${code}-${i}`} className="rounded-full border px-2 py-0.5 text-sm">
                                {mapLang(code)}
                            </span>
                        ))}
                    </div>
                </div>
            ) : null}

            {/* Localisations + modes */}
            {locs && locs.length > 0 && (
                <section className="space-y-2">
                    <h2 className="text-lg font-medium">Lieux de consultation</h2>
                    <div className="space-y-1">
                        {locs.map((l, i) => (
                            <div key={i} className="text-sm text-neutral-700">
                                {[l.address, [l.postal_code, l.city].filter(Boolean).join(' ')].filter(Boolean).join(', ')}
                                {l.modes?.length ? (
                                    <span className="ml-2 text-neutral-500">— {l.modes.map(modeLabel).join(', ')}</span>
                                ) : null}
                            </div>
                        ))}
                    </div>
                </section>
            )}

            <div className="pt-2">
                <Link className="rounded-lg border px-3 py-1 text-sm hover:bg-neutral-50" href="/recherche">
                    ← Retour
                </Link>
            </div>
        </main>
    )
}

/** Helpers d’affichage */

function slugToLabelFallback(slug: string) {
    // petit fallback lisible si on n’a pas le label de la catégorie en main
    return slug
        .split('-')
        .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
        .join(' ')
}

function modeLabel(m: string) {
    if (m === 'cabinet') return 'Au cabinet'
    if (m === 'domicile') return 'À domicile'
    if (m === 'visio') return 'En visio'
    return m
}
