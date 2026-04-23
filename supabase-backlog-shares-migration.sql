-- ============================================================================
-- Cadence - Migration : partage des items de backlog
-- À exécuter dans le SQL Editor Supabase après supabase-sharing-migration.sql
-- ============================================================================

-- Table `backlog_shares` — partage par défaut d'un item de backlog.
-- Quand l'item est tiré dans une semaine (manuellement ou auto-populate),
-- ces partages sont recopiés en tant que `activity_shares` sur l'activité créée.
CREATE TABLE IF NOT EXISTS backlog_shares (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  backlog_id UUID REFERENCES backlog_activities(id) ON DELETE CASCADE NOT NULL,
  shared_by_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  shared_with_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  can_edit BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(backlog_id, shared_with_user_id)
);

ALTER TABLE backlog_shares ENABLE ROW LEVEL SECURITY;

-- Seul le propriétaire du backlog peut voir / gérer ses partages
CREATE POLICY "Owner reads backlog shares"
  ON backlog_shares FOR SELECT
  USING (auth.uid() = shared_by_user_id);

CREATE POLICY "Owner creates backlog shares"
  ON backlog_shares FOR INSERT
  WITH CHECK (
    auth.uid() = shared_by_user_id
    AND EXISTS (
      SELECT 1 FROM backlog_activities ba
      WHERE ba.id = backlog_id AND ba.user_id = auth.uid()
    )
  );

CREATE POLICY "Owner updates backlog shares"
  ON backlog_shares FOR UPDATE
  USING (auth.uid() = shared_by_user_id);

CREATE POLICY "Owner deletes backlog shares"
  ON backlog_shares FOR DELETE
  USING (auth.uid() = shared_by_user_id);

CREATE INDEX IF NOT EXISTS idx_backlog_shares_backlog ON backlog_shares(backlog_id);
CREATE INDEX IF NOT EXISTS idx_backlog_shares_by_user ON backlog_shares(shared_by_user_id);
