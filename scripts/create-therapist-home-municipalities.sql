-- Création de la table therapist_home_municipalities
-- pour gérer les zones à domicile des ergothérapeutes

create table if not exists public.therapist_home_municipalities (
  therapist_id uuid references public.therapists(id) on delete cascade,
  nis_code     int  references public.belgian_municipalities(nis_code) on delete cascade,
  primary key (therapist_id, nis_code)
);

-- Index pour optimiser les requêtes
create index if not exists thm_therapist_idx on public.therapist_home_municipalities(therapist_id);
create index if not exists thm_nis_idx       on public.therapist_home_municipalities(nis_code);

-- Commentaires pour la documentation
comment on table public.therapist_home_municipalities is 'Zones à domicile des ergothérapeutes par NIS de commune';
comment on column public.therapist_home_municipalities.therapist_id is 'ID de l''ergothérapeute';
comment on column public.therapist_home_municipalities.nis_code is 'Code NIS de la commune belge';
