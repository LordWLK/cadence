-- ============================================================================
-- Cadence - Migration : fix des bugs de récurrence (doublons + résurrections)
-- À exécuter dans le SQL Editor Supabase
-- ============================================================================

-- 1. Nettoyer les doublons existants : garder la plus ancienne pour chaque
--    (user, backlog, date), supprimer les autres
WITH ranked AS (
  SELECT id,
    ROW_NUMBER() OVER (
      PARTITION BY user_id, backlog_id, planned_date
      ORDER BY created_at ASC
    ) as rn
  FROM weekly_activities
  WHERE backlog_id IS NOT NULL
)
DELETE FROM weekly_activities
WHERE id IN (SELECT id FROM ranked WHERE rn > 1);

-- 2. Empêcher les futurs doublons via index unique partiel
--    (seulement quand backlog_id est défini ; les activités manuelles ne sont pas concernées)
CREATE UNIQUE INDEX IF NOT EXISTS uniq_weekly_activities_backlog_date
  ON weekly_activities (user_id, backlog_id, planned_date)
  WHERE backlog_id IS NOT NULL;

-- 3. Table backlog_skip_dates : mémorise les occurrences volontairement supprimées
--    Permet à autoPopulateRecurring de ne pas ressusciter une récurrence
--    que l'utilisateur a supprimée à un jour précis.
CREATE TABLE IF NOT EXISTS backlog_skip_dates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  backlog_id UUID REFERENCES backlog_activities(id) ON DELETE CASCADE NOT NULL,
  skipped_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, backlog_id, skipped_date)
);

ALTER TABLE backlog_skip_dates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own skip dates"
  ON backlog_skip_dates FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_backlog_skip_user_date
  ON backlog_skip_dates(user_id, skipped_date);
