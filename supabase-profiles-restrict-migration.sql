-- ============================================================================
-- Cadence — Durcissement : anti-moissonnage d'emails sur `profiles`
-- À exécuter APRÈS supabase-audit-fixes-migration.sql (qui crée la RPC
-- search_profile_by_email utilisée par la recherche).
--
-- PRÉREQUIS (déjà en place) :
--   • Fonction public.search_profile_by_email (SECURITY DEFINER) — la recherche
--     par email passe par elle, donc elle continue de fonctionner après restriction.
--   • Client déployé : useProfile.searchByEmail appelle la RPC en priorité.
--
-- EFFET : un utilisateur authentifié ne peut plus lire TOUS les profils (et donc
-- aspirer tous les emails). Il ne voit que : son propre profil + celui des personnes
-- avec qui il a une relation de contact (dans un sens ou l'autre, tout statut).
-- Idempotent (sûr à ré-exécuter).
-- ============================================================================

-- Remplace la policy permissive USING (true)
DROP POLICY IF EXISTS "Authenticated users can read profiles" ON profiles;
DROP POLICY IF EXISTS "Users read self and contacts profiles" ON profiles;

CREATE POLICY "Users read self and contacts profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM user_contacts uc
      WHERE (uc.user_id = auth.uid() AND uc.contact_user_id = profiles.user_id)
         OR (uc.contact_user_id = auth.uid() AND uc.user_id = profiles.user_id)
    )
  );

-- Vérif rapide (optionnelle) : la recherche par email doit toujours renvoyer un profil.
--   SELECT * FROM public.search_profile_by_email('un.email@exemple.com');
