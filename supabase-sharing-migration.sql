-- ============================================================================
-- Cadence - Migration : partage d'activités entre utilisateurs
-- À exécuter dans le SQL Editor Supabase après supabase-setup.sql
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Table `profiles` — nom d'affichage + avatar pour chaque utilisateur
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Tout utilisateur authentifié peut LIRE les profils (pour la recherche par email)
CREATE POLICY "Authenticated users can read profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

-- Chaque utilisateur ne peut modifier QUE son propre profil
CREATE POLICY "Users update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Trigger : créer automatiquement un profile à la création d'un user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Remplir les profils pour les users déjà existants
INSERT INTO public.profiles (user_id, email)
SELECT id, email FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 2. Table `user_contacts` — gestion des amis/contacts
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_contacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,       -- celui qui a envoyé la demande
  contact_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL, -- le destinataire
  status TEXT CHECK (status IN ('pending', 'accepted', 'blocked')) NOT NULL DEFAULT 'pending',
  nickname TEXT,  -- surnom personnel (optionnel) que `user_id` donne à `contact_user_id`
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, contact_user_id),
  CHECK (user_id <> contact_user_id)  -- on ne peut pas être son propre contact
);

ALTER TABLE user_contacts ENABLE ROW LEVEL SECURITY;

-- Un user peut voir les lignes où il est soit l'émetteur, soit le destinataire
CREATE POLICY "Users see their contacts"
  ON user_contacts FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = contact_user_id);

-- Un user peut créer une demande (en tant qu'émetteur)
CREATE POLICY "Users create contact request"
  ON user_contacts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Un user peut modifier une ligne où il est émetteur OU destinataire
-- (l'émetteur peut supprimer/modifier, le destinataire peut accepter/refuser)
CREATE POLICY "Users update their contacts"
  ON user_contacts FOR UPDATE
  USING (auth.uid() = user_id OR auth.uid() = contact_user_id);

CREATE POLICY "Users delete their contacts"
  ON user_contacts FOR DELETE
  USING (auth.uid() = user_id OR auth.uid() = contact_user_id);

CREATE INDEX IF NOT EXISTS idx_user_contacts_user ON user_contacts(user_id, status);
CREATE INDEX IF NOT EXISTS idx_user_contacts_contact ON user_contacts(contact_user_id, status);

-- ----------------------------------------------------------------------------
-- 3. Table `activity_shares` — partage d'une activité avec un contact
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS activity_shares (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  activity_id UUID REFERENCES weekly_activities(id) ON DELETE CASCADE NOT NULL,
  shared_by_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL, -- le créateur de l'activité
  shared_with_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL, -- le destinataire
  can_edit BOOLEAN DEFAULT FALSE,   -- si true, le destinataire peut modifier l'activité
  hidden BOOLEAN DEFAULT FALSE,     -- le destinataire a choisi de masquer l'activité
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(activity_id, shared_with_user_id)
);

ALTER TABLE activity_shares ENABLE ROW LEVEL SECURITY;

-- Lecture : émetteur OU destinataire peut voir la ligne
CREATE POLICY "Users see their shares"
  ON activity_shares FOR SELECT
  USING (auth.uid() = shared_by_user_id OR auth.uid() = shared_with_user_id);

-- Création : seul le créateur de l'activité peut la partager
CREATE POLICY "Owner creates share"
  ON activity_shares FOR INSERT
  WITH CHECK (
    auth.uid() = shared_by_user_id
    AND EXISTS (
      SELECT 1 FROM weekly_activities wa
      WHERE wa.id = activity_id AND wa.user_id = auth.uid()
    )
  );

-- Update : émetteur peut tout modifier (can_edit), destinataire peut seulement changer `hidden`
-- Simplification : on autorise les deux à UPDATE et on vérifie côté client. La colonne hidden est la seule que le destinataire doit toucher.
CREATE POLICY "Users update their shares"
  ON activity_shares FOR UPDATE
  USING (auth.uid() = shared_by_user_id OR auth.uid() = shared_with_user_id);

-- Delete : émetteur peut retirer le partage
CREATE POLICY "Sharer deletes share"
  ON activity_shares FOR DELETE
  USING (auth.uid() = shared_by_user_id);

CREATE INDEX IF NOT EXISTS idx_activity_shares_activity ON activity_shares(activity_id);
CREATE INDEX IF NOT EXISTS idx_activity_shares_with_user ON activity_shares(shared_with_user_id, hidden);
CREATE INDEX IF NOT EXISTS idx_activity_shares_by_user ON activity_shares(shared_by_user_id);

-- ----------------------------------------------------------------------------
-- 4. Policies élargies sur `weekly_activities` pour permettre la lecture partagée
-- ----------------------------------------------------------------------------
-- On supprime l'ancienne policy "FOR ALL" et on la remplace par des policies granulaires
-- qui autorisent aussi la lecture/edit d'activités partagées.

DROP POLICY IF EXISTS "Users manage own activities" ON weekly_activities;

-- SELECT : le propriétaire OU un destinataire de partage peut lire
CREATE POLICY "Users read own or shared activities"
  ON weekly_activities FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM activity_shares s
      WHERE s.activity_id = weekly_activities.id
        AND s.shared_with_user_id = auth.uid()
    )
  );

-- INSERT : uniquement pour soi-même
CREATE POLICY "Users insert own activities"
  ON weekly_activities FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE : propriétaire OU destinataire avec can_edit=true
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
  );

-- DELETE : uniquement le propriétaire
CREATE POLICY "Users delete own activities"
  ON weekly_activities FOR DELETE
  USING (auth.uid() = user_id);
