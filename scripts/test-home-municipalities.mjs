#!/usr/bin/env node

/**
 * Script de test pour vérifier l'intégration des zones à domicile
 * via therapist_home_municipalities
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement manquantes')
  console.error('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl)
  console.error('SUPABASE_SERVICE_ROLE_KEY ou NEXT_PUBLIC_SUPABASE_ANON_KEY:', !!supabaseKey)
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testHomeMunicipalities() {
  console.log('🧪 Test de l\'intégration therapist_home_municipalities...\n')

  try {
    // 1. Vérifier que la table existe
    console.log('1️⃣ Vérification de l\'existence de la table...')
    const { data: tableInfo, error: tableError } = await supabase
      .from('therapist_home_municipalities')
      .select('*')
      .limit(1)

    if (tableError) {
      console.error('❌ Table therapist_home_municipalities non trouvée:', tableError.message)
      console.log('💡 Exécutez le script SQL: scripts/create-therapist-home-municipalities.sql')
      return
    }
    console.log('✅ Table therapist_home_municipalities existe')

    // 2. Vérifier les données de test
    console.log('\n2️⃣ Vérification des données existantes...')
    const { data: existing, error: existingError } = await supabase
      .from('therapist_home_municipalities')
      .select(`
        therapist_id,
        nis_code,
        belgian_municipalities!inner (
          nis_code,
          name_fr,
          name_nl
        )
      `)
      .limit(5)

    if (existingError) {
      console.error('❌ Erreur lors de la lecture:', existingError.message)
      return
    }

    if (existing && existing.length > 0) {
      console.log('✅ Données trouvées:')
      existing.forEach(row => {
        console.log(`  - Therapist ${row.therapist_id}: ${row.belgian_municipalities.name_fr} (NIS: ${row.nis_code})`)
      })
    } else {
      console.log('ℹ️ Aucune donnée trouvée (normal si pas encore de profils)')
    }

    // 3. Test de l'API BeSt
    console.log('\n3️⃣ Test de l\'API BeSt...')
    const testQuery = 'Waterloo'
    const response = await fetch(`http://localhost:3000/api/best/municipalities?q=${encodeURIComponent(testQuery)}&page=1`)
    
    if (response.ok) {
      const data = await response.json()
      console.log(`✅ API BeSt fonctionne: ${data.items?.length || 0} communes trouvées pour "${testQuery}"`)
      if (data.items && data.items.length > 0) {
        console.log(`  Exemple: ${data.items[0].name_fr} (NIS: ${data.items[0].nis_code})`)
      }
    } else {
      console.log('⚠️ API BeSt non accessible (serveur de dev non démarré?)')
    }

    console.log('\n✅ Tests terminés avec succès!')
    console.log('\n📋 Checklist d\'acceptation:')
    console.log('  □ Créer un profil avec 1 cabinet + 2 communes')
    console.log('  □ Vérifier therapist_locations (1 ligne modes=[\'cabinet\'])')
    console.log('  □ Vérifier therapist_home_municipalities (2 lignes NIS)')
    console.log('  □ Éditer le profil: retirer 1 commune, ajouter 1 autre')
    console.log('  □ Vérifier la synchronisation en base')

  } catch (error) {
    console.error('❌ Erreur lors des tests:', error.message)
  }
}

testHomeMunicipalities()
