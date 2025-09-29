import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase'
import { geocodeAddress } from '@/lib/geocoding-clients'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Helper pour créer les coordonnées WKT
function toWKT(lon: number, lat: number): string {
  return `SRID=4326;POINT(${lon} ${lat})`
}

// Calculer le délai de backoff
function getBackoffDelay(tries: number): number {
  switch (tries) {
    case 0: return 0        // Immédiat
    case 1: return 15 * 60  // 15 minutes
    case 2: return 60 * 60  // 1 heure
    case 3: return 6 * 60 * 60  // 6 heures
    case 4: return 24 * 60 * 60 // 24 heures
    default: return -1 // Failed
  }
}

// Vérifier si un job doit être traité maintenant
function shouldProcessJob(tries: number, createdAt: string): boolean {
  const delay = getBackoffDelay(tries)
  if (delay === -1) return false // Failed
  
  const now = new Date().getTime()
  const jobTime = new Date(createdAt).getTime()
  return (now - jobTime) >= (delay * 1000)
}

export async function POST(req: NextRequest) {
  const sb = await supabaseServer()

  try {
    // Vérifier l'auth via header
    const cronSecret = req.headers.get('x-cron-secret')
    const expectedSecret = process.env.CRON_SECRET
    
    if (!expectedSecret) {
      console.error('❌ CRON_SECRET not configured')
      return NextResponse.json({ ok: false, error: 'Cron secret not configured' }, { status: 500 })
    }
    
    if (cronSecret !== expectedSecret) {
      console.error('❌ Invalid cron secret')
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
    }

    // Récupérer max 25 jobs queued
    const { data: jobs, error: fetchError } = await sb
      .from('address_geocode_jobs')
      .select('*')
      .eq('status', 'queued')
      .order('created_at', { ascending: true })
      .limit(25)

    if (fetchError) {
      console.error('❌ Failed to fetch jobs:', fetchError)
      return NextResponse.json({ ok: false, error: 'Database error' }, { status: 500 })
    }

    if (!jobs || jobs.length === 0) {
      console.log('✅ No jobs to process')
      return NextResponse.json({ ok: true, processed: 0 })
    }

    console.log(`🔄 Processing ${jobs.length} geocode jobs`)

    let processed = 0
    let successful = 0
    let failed = 0

    for (const job of jobs) {
      try {
        // Vérifier si le job doit être traité maintenant
        if (!shouldProcessJob(job.tries, job.created_at)) {
          console.log(`⏳ Job ${job.id} not ready yet (tries: ${job.tries})`)
          continue
        }

        // Marquer comme processing
        await sb
          .from('address_geocode_jobs')
          .update({ 
            status: 'processing',
            updated_at: new Date().toISOString()
          })
          .eq('id', job.id)

        console.log(`🔍 Geocoding job ${job.id}: ${job.full_address}`)

        // Géocoder l'adresse
        const result = await geocodeAddress(job.full_address)

        if (result) {
          // Succès → update la location avec les coordonnées
          const coords = toWKT(result.lon, result.lat)
          
          const { error: updateError } = await sb
            .from('therapist_locations')
            .update({
              lon: result.lon,
              lat: result.lat,
              coords,
              place_name: result.place_name || null,
              bbox: result.bbox || null,
            })
            .eq('id', job.location_id)

          if (updateError) {
            console.error(`❌ Failed to update location ${job.location_id}:`, updateError)
            throw new Error(`Database update failed: ${updateError.message}`)
          }

          // Marquer le job comme done
          await sb
            .from('address_geocode_jobs')
            .update({ 
              status: 'done',
              updated_at: new Date().toISOString()
            })
            .eq('id', job.id)

          console.log(`✅ Job ${job.id} completed successfully`)
          successful++
        } else {
          // Échec → incrémenter tries et marquer comme queued ou failed
          const newTries = job.tries + 1
          const newStatus = newTries >= 5 ? 'failed' : 'queued'
          
          await sb
            .from('address_geocode_jobs')
            .update({ 
              tries: newTries,
              status: newStatus,
              error: newStatus === 'failed' ? 'Max retries exceeded' : null,
              updated_at: new Date().toISOString()
            })
            .eq('id', job.id)

          if (newStatus === 'failed') {
            console.log(`❌ Job ${job.id} failed after ${newTries} tries`)
            failed++
          } else {
            console.log(`⏳ Job ${job.id} queued for retry (tries: ${newTries})`)
          }
        }

        processed++

      } catch (error) {
        console.error(`❌ Error processing job ${job.id}:`, error)
        
        // Marquer le job comme failed
        await sb
          .from('address_geocode_jobs')
          .update({ 
            status: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error',
            updated_at: new Date().toISOString()
          })
          .eq('id', job.id)

        failed++
      }
    }

    console.log(`✅ Cron completed: ${processed} processed, ${successful} successful, ${failed} failed`)
    
    return NextResponse.json({ 
      ok: true, 
      processed,
      successful,
      failed 
    })

  } catch (error) {
    console.error('❌ Cron geocode error:', error)
    return NextResponse.json({ ok: false, error: 'Server error' }, { status: 500 })
  }
}
