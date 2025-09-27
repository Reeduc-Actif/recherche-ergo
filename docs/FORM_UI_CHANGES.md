# Modifications UI des formulaires

## Résumé des changements

### Cabinet - Remplacement de l'autocomplétion par 4 champs séparés

**Avant :**
- Un seul champ `AddressAutocomplete` avec géocodage Mapbox
- Adresse complète saisie via autocomplétion

**Après :**
- 4 champs séparés : Rue, Numéro, Code postal, Ville
- Construction automatique de `address = "Rue + Numéro"`
- Aperçu en temps réel de l'adresse complète

### À domicile - Sélecteur multiple de communes NIS

**Avant :**
- Utilisation de `CityPicker` avec ancien système

**Après :**
- `CityPicker` connecté à `/api/best/municipalities`
- Sélection multiple de communes par code NIS
- Affichage des noms de communes (FR par défaut)

## Fichiers modifiés

### `src/components/ui/edit-therapist-all.tsx`
- ✅ Remplacement de `AddressAutocomplete` par 4 champs séparés
- ✅ Mise à jour de la validation (rue, numéro, ville, CP requis)
- ✅ Construction automatique de l'adresse
- ✅ Aperçu de l'adresse complète
- ✅ Chargement des données existantes avec parsing de l'adresse

### `src/components/ui/onboard-form.tsx`
- ✅ Remplacement de `AddressAutocomplete` par 4 champs séparés
- ✅ Mise à jour de la validation (rue, numéro, ville, CP requis)
- ✅ Construction automatique de l'adresse
- ✅ Aperçu de l'adresse complète
- ✅ Initialisation des nouveaux champs

### `src/components/ui/CityPicker.tsx`
- ✅ Déjà configuré pour utiliser `/api/best/municipalities`
- ✅ Gestion des codes NIS (number | string)[]
- ✅ Debounce de 250ms
- ✅ Affichage des noms de communes

## Types mis à jour

```typescript
type CabinetDraft = {
  // ... autres champs
  address: string        // Construit automatiquement
  street: string         // Nouveau champ
  house_number: string   // Nouveau champ
  postal_code: string    // Existant
  city: string          // Existant
}

type DomicileDraft = {
  // ... autres champs
  cities: (number | string)[]  // Codes NIS
}
```

## Validation mise à jour

**Cabinet :**
- ✅ Rue requise
- ✅ Numéro requis
- ✅ Code postal requis
- ✅ Ville requise

**À domicile :**
- ✅ Au moins une commune sélectionnée

## Fonctionnalités conservées

- ✅ Tous les autres champs du formulaire (nom, bio, langues, spécialités, etc.)
- ✅ Logique de soumission vers `/api/pro/onboard`
- ✅ Gestion des erreurs et messages de succès
- ✅ Interface responsive

## Tests d'acceptation

### Cabinet
- [ ] Saisir rue + numéro → adresse se construit automatiquement
- [ ] Aperçu "Adresse complète" se met à jour en temps réel
- [ ] Validation : tous les champs requis
- [ ] Soumission : envoie `address`, `street`, `house_number`, `postal_code`, `city`

### À domicile
- [ ] Recherche de commune fonctionne (debounce 250ms)
- [ ] Sélection multiple de communes (NIS)
- [ ] Suppression de communes sélectionnées
- [ ] Validation : au moins 1 commune requise
- [ ] Soumission : envoie tableau de NIS

### Général
- [ ] Aucun autre comportement modifié
- [ ] Interface responsive
- [ ] Messages d'erreur appropriés
- [ ] Sauvegarde et chargement des données existantes
