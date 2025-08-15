// src/app/api/specialties/route.ts
import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
    const supabase = await supabaseServer()
    const { data, error } = await supabase
        .from('specialties')
        .select('slug,label')
        .order('label', { ascending: true })

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json({ specialties: data ?? [] })
}
