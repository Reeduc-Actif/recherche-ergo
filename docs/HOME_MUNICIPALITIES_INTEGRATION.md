# Intégration des zones à domicile via NIS

## Vue d'ensemble

Cette intégration remplace l'ancien système de zones à domicile basé sur `cities_be` et `therapist_location_cities` par un système utilisant les codes NIS officiels belges via l'API BeSt.

## Changements apportés

### 1. Nouvelle table `therapist_home_municipalities`

```sql
create table if not exists public.therapist_home_municipalities (
  therapist_id uuid references public.therapists(id) on delete cascade,
  nis_code     int  references public.belgian_municipalities(nis_code) on delete cascade,
  primary key (therapist_id, nis_code)
);
```

### 2. Composant CityPicker mis à jour

- Utilise `/api/best/municipalities` pour l'autocomplete
- Gère les codes NIS (number | string)[]
- Debounce de 250ms pour optimiser les appels API

### 3. Types TypeScript mis à jour

```typescript
type DomicileDraft = {
  id?: number
  mode: 'domicile'
  country: 'BE'
  cities: (number | string)[] // NIS codes
}
```

### 4. API `/api/pro/onboard` synchronisée

- Supprime les anciennes entrées `therapist_locations` pour les zones domicile
- Synchronise `therapist_home_municipalities` (insert/delete diff)
- Conserve les cabinets dans `therapist_locations` avec géolocalisation

## Flux de données

### Création/Édition de profil

1. **Cabinet** : `AddressAutocomplete` → `therapist_locations` (modes=['cabinet'])
2. **Domicile** : `CityPicker` → `therapist_home_municipalities` (NIS codes)

### Recherche

- **Cabinet** : Filtre sur `therapist_locations.postal_code`
- **Domicile** : Jointure `postalinfos` → `postalinfo_municipality` → `therapist_home_municipalities`

## Tests d'acceptation

### 1. Création de profil
- [ ] Ajouter 1 cabinet avec adresse complète
- [ ] Ajouter 2 communes (ex: Waterloo, Nivelles)
- [ ] Vérifier `therapist_locations` (1 ligne, modes=['cabinet'], coords non null)
- [ ] Vérifier `therapist_home_municipalities` (2 lignes avec NIS correspondants)

### 2. Édition de profil
- [ ] Retirer 1 commune
- [ ] Ajouter 1 autre commune
- [ ] Vérifier la synchronisation (diff insert/delete correct)

### 3. Recherche
- [ ] Recherche par CP cabinet → résultats corrects
- [ ] Recherche par CP domicile → résultats via jointure NIS

## Scripts utilitaires

- `scripts/create-therapist-home-municipalities.sql` : Création de la table
- `scripts/test-home-municipalities.mjs` : Tests d'intégration

## Migration depuis l'ancien système

L'ancien système utilisait :
- `cities_be` (table de communes)
- `therapist_location_cities` (liaison therapist ↔ commune)

Le nouveau système utilise :
- `belgian_municipalities` (référentiel officiel NIS)
- `therapist_home_municipalities` (liaison therapist ↔ NIS)

**Note** : Les anciennes tables peuvent être supprimées après migration complète.
