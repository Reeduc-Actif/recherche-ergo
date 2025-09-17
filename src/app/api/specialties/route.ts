// src/app/api/specialties/route.ts
import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
    const supabase = await supabaseServer()
    const { data, error } = await supabase
        .from('specialties')
        .select('slug,label,parent_slug') // <-- parent_slug ajouté
        .order('parent_slug', { ascending: true, nullsFirst: true })
        .order('label', { ascending: true })

    if (error) {
        return NextResponse.json({ ok: false, error: error.message }, { status: 400 })
    }
    return NextResponse.json({ ok: true, specialties: data ?? [] })
}
