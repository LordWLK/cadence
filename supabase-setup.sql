-- Cadence - Supabase Database Setup
-- Execute this SQL in your Supabase SQL Editor (Dashboard > SQL Editor)

-- 1. Check-ins table
CREATE TABLE IF NOT EXISTS checkins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT CHECK (type IN ('morning', 'evening')) NOT NULL,
  mood INTEGER CHECK (mood BETWEEN 1 AND 5) NOT NULL,
  energy INTEGER CHECK (energy BETWEEN 1 AND 10) NOT NULL,
  note TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own checkins"
  ON checkins FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 2. Weekly activities table
CREATE TABLE IF NOT EXISTS weekly_activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  category TEXT CHECK (category IN ('sport_play', 'sport_watch', 'social', 'personal_project', 'relax', 'other')) NOT NULL,
  planned_date DATE NOT NULL,
  week_start DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE weekly_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own activities"
  ON weekly_activities FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 3. Sport preferences table
CREATE TABLE IF NOT EXISTS sport_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  sport TEXT CHECK (sport IN ('football', 'basketball', 'mma')) NOT NULL,
  entity_type TEXT CHECK (entity_type IN ('club', 'national_team', 'franchise', 'fighter', 'competition')) NOT NULL,
  entity_id TEXT NOT NULL,
  entity_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, sport, entity_type, entity_id)
);

ALTER TABLE sport_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own sport prefs"
  ON sport_preferences FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 4. Selected events table
CREATE TABLE IF NOT EXISTS selected_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  sport TEXT CHECK (sport IN ('football', 'basketball', 'mma')) NOT NULL,
  event_title TEXT NOT NULL,
  event_date TIMESTAMPTZ NOT NULL,
  competition TEXT,
  is_big_match BOOLEAN DEFAULT FALSE,
  source_api_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE selected_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own selected events"
  ON selected_events FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_checkins_user_date ON checkins(user_id, date);
CREATE INDEX IF NOT EXISTS idx_activities_user_week ON weekly_activities(user_id, week_start);
CREATE INDEX IF NOT EXISTS idx_sport_prefs_user ON sport_preferences(user_id, sport);
CREATE INDEX IF NOT EXISTS idx_selected_events_user_date ON selected_events(user_id, event_date);
