-- ============================================================================
-- Cadence — Migration corrective (audit)
-- À exécuter dans le SQL Editor Supabase APRÈS les migrations précédentes.
--
-- Cette migration est IDEMPOTENTE (sûre à ré-exécuter). Elle corrige des écarts
-- entre le schéma et le code client, et durcit la sécurité (RLS).
--
-- Correctifs :
--   1. checkins.photo_url manquante                              (crash insert)
--   2. weekly_activities : CHECK category sans 'work'            (auto-populate KO)
--   3. backlog_activities : recurrence (noms de jours) + recurrence_freq
--   4. selected_events : CHECK sport sans 'cinema'               (insert cinéma KO)
--   5. cinema_preferences : table + RLS manquantes
--   6. weekly_activities UPDATE : vol de propriété (WITH CHECK / trigger)
--   7. activity_shares UPDATE : le destinataire s'auto-accorde can_edit
--   8. activity_shares INSERT : exiger une relation de contact acceptée
--   9. user_contacts : forge de statut 'accepted' / auto-acceptation
--  10. profiles : verrouiller l'email (usurpation)
--  11. index sur weekly_activities.planned_date
--  12. (OPTIONNEL) durcissement anti-moissonnage d'emails sur profiles
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. checkins.photo_url (le client l'envoie toujours à l'insert)
-- ----------------------------------------------------------------------------
ALTER TABLE checkins ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- ----------------------------------------------------------------------------
-- 2. weekly_activities.category : aligner sur les catégories réelles du client
--    (sport_play, work, social, personal_project, relax, other)
-- ----------------------------------------------------------------------------
ALTER TABLE weekly_activities DROP CONSTRAINT IF EXISTS weekly_activities_category_check;
ALTER TABLE weekly_activities
  ADD CONSTRAINT weekly_activities_category_check
  CHECK (category IN ('sport_play', 'work', 'social', 'personal_project', 'relax', 'other'));

-- ----------------------------------------------------------------------------
-- 3. backlog_activities : le client stocke un NOM DE JOUR dans `recurrence`
--    ('none' ou lundi..dimanche) + une fréquence dans `recurrence_freq`.
-- ----------------------------------------------------------------------------
ALTER TABLE backlog_activities
  ADD COLUMN IF NOT EXISTS recurrence_freq TEXT NOT NULL DEFAULT 'weekly';

ALTER TABLE backlog_activities DROP CONSTRAINT IF EXISTS backlog_activities_recurrence_check;
ALTER TABLE backlog_activities
  ADD CONSTRAINT backlog_activities_recurrence_check
  CHECK (recurrence IN ('none', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'));

ALTER TABLE backlog_activities DROP CONSTRAINT IF EXISTS backlog_activities_recurrence_freq_check;
ALTER TABLE backlog_activities
  ADD CONSTRAINT backlog_activities_recurrence_freq_check
  CHECK (recurrence_freq IN ('weekly', 'biweekly', 'monthly'));

-- Table des dates "skippées" (référencée par le client mais parfois absente du repo)
CREATE TABLE IF NOT EXISTS backlog_skip_dates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  backlog_id UUID REFERENCES backlog_activities(id) ON DELETE CASCADE NOT NULL,
  skipped_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, backlog_id, skipped_date)
);
ALTER TABLE backlog_skip_dates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own skip dates" ON backlog_skip_dates;
CREATE POLICY "Users manage own skip dates"
  ON backlog_skip_dates FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 4. selected_events.sport : autoriser 'cinema' (inséré par CinemaFeed)
-- ----------------------------------------------------------------------------
ALTER TABLE selected_events DROP CONSTRAINT IF EXISTS selected_events_sport_check;
ALTER TABLE selected_events
  ADD CONSTRAINT selected_events_sport_check
  CHECK (sport IN ('football', 'basketball', 'mma', 'cinema'));

-- ----------------------------------------------------------------------------
-- 5. cinema_preferences : table utilisée par le client mais absente du repo
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cinema_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  cinema_id TEXT NOT NULL,
  cinema_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, cinema_id)
);
ALTER TABLE cinema_preferences ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own cinema prefs" ON cinema_preferences;
CREATE POLICY "Users manage own cinema prefs"
  ON cinema_preferences FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 6. weekly_activities UPDATE : empêcher le vol de propriété.
--    La policy UPDATE autorise un éditeur partagé (can_edit) à modifier la ligne ;
--    sans garde, il peut réécrire user_id vers lui-même. Un trigger interdit tout
--    changement de user_id par quelqu'un qui n'est pas le propriétaire actuel.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.prevent_activity_owner_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_id <> OLD.user_id AND auth.uid() <> OLD.user_id THEN
    RAISE EXCEPTION 'Seul le propriétaire peut transférer une activité';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_prevent_activity_owner_change ON weekly_activities;
CREATE TRIGGER trg_prevent_activity_owner_change
  BEFORE UPDATE ON weekly_activities
  FOR EACH ROW EXECUTE FUNCTION public.prevent_activity_owner_change();

-- Ajoute un WITH CHECK à la policy UPDATE (protection en profondeur)
DROP POLICY IF EXISTS "Users update own or editable shared activities" ON weekly_activities;
CREATE POLICY "Users update own or editable shared activities"
  ON weekly_activities FOR UPDATE
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM activity_shares s
      WHERE s.activity_id = weekly_activities.id
        AND s.shared_with_user_id = auth.uid()
        AND s.can_edit = true
    )
  )
  WITH CHECK (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM activity_shares s
      WHERE s.activity_id = weekly_activities.id
        AND s.shared_with_user_id = auth.uid()
        AND s.can_edit = true
    )
  );

-- ----------------------------------------------------------------------------
-- 7. activity_shares UPDATE : le destinataire ne doit modifier QUE `hidden`,
--    jamais can_edit / les identités. Un trigger bloque toute escalade.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.prevent_share_escalation()
RETURNS TRIGGER AS $$
BEGIN
  -- Si l'appelant n'est PAS l'émetteur du partage, il ne peut changer que `hidden`.
  IF auth.uid() <> OLD.shared_by_user_id THEN
    IF NEW.can_edit             <> OLD.can_edit
       OR NEW.shared_by_user_id <> OLD.shared_by_user_id
       OR NEW.shared_with_user_id <> OLD.shared_with_user_id
       OR NEW.activity_id       <> OLD.activity_id THEN
      RAISE EXCEPTION 'Seul l''émetteur du partage peut modifier ces champs';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_prevent_share_escalation ON activity_shares;
CREATE TRIGGER trg_prevent_share_escalation
  BEFORE UPDATE ON activity_shares
  FOR EACH ROW EXECUTE FUNCTION public.prevent_share_escalation();

-- WITH CHECK sur la policy UPDATE d'activity_shares
DROP POLICY IF EXISTS "Users update their shares" ON activity_shares;
CREATE POLICY "Users update their shares"
  ON activity_shares FOR UPDATE
  USING (auth.uid() = shared_by_user_id OR auth.uid() = shared_with_user_id)
  WITH CHECK (auth.uid() = shared_by_user_id OR auth.uid() = shared_with_user_id);

-- ----------------------------------------------------------------------------
-- 8. activity_shares INSERT : exiger une relation de contact ACCEPTÉE entre
--    l'émetteur et le destinataire (empêche d'injecter des activités chez autrui).
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Owner creates share" ON activity_shares;
CREATE POLICY "Owner creates share"
  ON activity_shares FOR INSERT
  WITH CHECK (
    auth.uid() = shared_by_user_id
    AND EXISTS (
      SELECT 1 FROM weekly_activities wa
      WHERE wa.id = activity_id AND wa.user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM user_contacts uc
      WHERE uc.status = 'accepted'
        AND (
          (uc.user_id = auth.uid() AND uc.contact_user_id = shared_with_user_id)
          OR (uc.contact_user_id = auth.uid() AND uc.user_id = shared_with_user_id)
        )
    )
  );

-- ----------------------------------------------------------------------------
-- 9. user_contacts : empêcher la forge de statut et l'auto-acceptation.
--    - INSERT : le statut initial doit être 'pending'.
--    - UPDATE : seul le DESTINATAIRE (contact_user_id) peut passer à 'accepted'.
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users create contact request" ON user_contacts;
CREATE POLICY "Users create contact request"
  ON user_contacts FOR INSERT
  WITH CHECK (auth.uid() = user_id AND status = 'pending');

CREATE OR REPLACE FUNCTION public.prevent_contact_self_accept()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'accepted' AND OLD.status <> 'accepted'
     AND auth.uid() <> OLD.contact_user_id THEN
    RAISE EXCEPTION 'Seul le destinataire peut accepter une demande de contact';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_prevent_contact_self_accept ON user_contacts;
CREATE TRIGGER trg_prevent_contact_self_accept
  BEFORE UPDATE ON user_contacts
  FOR EACH ROW EXECUTE FUNCTION public.prevent_contact_self_accept();

-- ----------------------------------------------------------------------------
-- 10. profiles : verrouiller l'email (empêcher l'usurpation via changement d'email).
--     L'email doit rester celui du compte auth.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.prevent_profile_email_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.email IS DISTINCT FROM OLD.email THEN
    RAISE EXCEPTION 'L''email du profil ne peut pas être modifié';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_prevent_profile_email_change ON profiles;
CREATE TRIGGER trg_prevent_profile_email_change
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_profile_email_change();

-- ----------------------------------------------------------------------------
-- 11. Index sur weekly_activities.planned_date (la vue semaine filtre dessus)
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_activities_planned_date ON weekly_activities(planned_date);

-- ----------------------------------------------------------------------------
-- 12. (OPTIONNEL) Anti-moissonnage d'emails.
--     Aujourd'hui, tout utilisateur authentifié peut lire TOUS les profils
--     (policy "Authenticated users can read profiles" USING (true)), donc aspirer
--     tous les emails. La recherche par email en a besoin AVANT qu'un contact existe.
--
--     Pour fermer proprement : utiliser la fonction RPC ci-dessous pour la recherche,
--     puis RESTREINDRE la lecture directe des profils aux contacts + soi-même.
--
--     Le client (useProfile.searchByEmail) tente déjà cette RPC en priorité et
--     retombe sur la lecture directe si elle n'existe pas — donc créer la fonction
--     est sans risque. N'activez le bloc RESTREINT (commenté) qu'ENSUITE.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.search_profile_by_email(p_email TEXT)
RETURNS SETOF profiles AS $$
  SELECT * FROM public.profiles WHERE lower(email) = lower(trim(p_email)) LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

GRANT EXECUTE ON FUNCTION public.search_profile_by_email(TEXT) TO authenticated;

-- --- Bloc RESTREINT (à décommenter une fois la RPC en place et le client déployé) ---
-- DROP POLICY IF EXISTS "Authenticated users can read profiles" ON profiles;
-- CREATE POLICY "Users read self and contacts profiles"
--   ON profiles FOR SELECT TO authenticated
--   USING (
--     auth.uid() = user_id
--     OR EXISTS (
--       SELECT 1 FROM user_contacts uc
--       WHERE (uc.user_id = auth.uid() AND uc.contact_user_id = profiles.user_id)
--          OR (uc.contact_user_id = auth.uid() AND uc.user_id = profiles.user_id)
--     )
--   );
