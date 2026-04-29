-- ============================================
-- TABLES
-- ============================================

-- Users extended profile (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Teams
CREATE TABLE IF NOT EXISTS public.teams (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  group_name TEXT,
  flag_url TEXT
);

-- Matches
CREATE TABLE IF NOT EXISTS public.matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_id INTEGER,
  match_date TIMESTAMPTZ NOT NULL,
  stage TEXT NOT NULL DEFAULT 'group_stage',
  home_team INTEGER REFERENCES teams(id),
  away_team INTEGER REFERENCES teams(id),
  home_score INTEGER,
  away_score INTEGER,
  extra_time_winner TEXT,
  penalties_winner TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User picks for matches
CREATE TABLE IF NOT EXISTS public.match_picks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  match_id UUID REFERENCES matches(id) NOT NULL,
  home_score INTEGER NOT NULL,
  away_score INTEGER NOT NULL,
  points INTEGER DEFAULT 0,
  extra_time_winner TEXT,
  penalties_winner TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, match_id)
);

-- Special picks (champion, runner-up, top scorer)
CREATE TABLE IF NOT EXISTS public.special_picks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  pick_type TEXT NOT NULL, -- 'champion', 'runner_up', 'top_scorer'
  team_id INTEGER REFERENCES teams(id),
  player_name TEXT,
  points INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, pick_type)
);

-- Leaderboard (materialized view for performance)
CREATE TABLE IF NOT EXISTS public.leaderboard (
  user_id UUID REFERENCES auth.users(id) PRIMARY KEY,
  total_points INTEGER DEFAULT 0,
  group_points INTEGER DEFAULT 0,
  match_points INTEGER DEFAULT 0,
  special_points INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User roles
CREATE TABLE IF NOT EXISTS public.user_roles (
  user_id UUID REFERENCES auth.users(id) PRIMARY KEY,
  role TEXT NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE public.match_picks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.special_picks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboard ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Match picks: users can see their own picks, admins can see all
CREATE POLICY "Users can view own picks"
   ON public.match_picks FOR SELECT
   USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can insert own picks"
  ON public.match_picks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own picks"
  ON public.match_picks FOR UPDATE
  USING (auth.uid() = user_id);

-- Special picks: same policies
CREATE POLICY "Users can view own special picks"
   ON public.special_picks FOR SELECT
   USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can insert own special picks"
  ON public.special_picks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own special picks"
  ON public.special_picks FOR UPDATE
  USING (auth.uid() = user_id);

-- Leaderboard: everyone can view
CREATE POLICY "Anyone can view leaderboard"
  ON public.leaderboard FOR SELECT
  USING (true);

-- User roles: only admins can manage
CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Profiles: users can read all, update own
CREATE POLICY "Anyone can view profiles"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- ============================================
-- SCORING FUNCTIONS
-- ============================================

-- Calculate points for a single pick
CREATE OR REPLACE FUNCTION public.calculate_match_pick_points(
  p_home_score INTEGER,
  p_away_score INTEGER,
  p_actual_home_score INTEGER,
  p_actual_away_score INTEGER,
  p_extra_time_winner TEXT DEFAULT NULL,
  p_penalties_winner TEXT DEFAULT NULL,
  p_actual_extra_time_winner TEXT DEFAULT NULL,
  p_actual_penalties_winner TEXT DEFAULT NULL
) RETURNS INTEGER AS $$
DECLARE
  v_winner TEXT;
  v_actual_winner TEXT;
  v_points INTEGER := 0;
BEGIN
  -- Must have actual scores
  IF p_actual_home_score IS NULL OR p_actual_away_score IS NULL THEN
    RETURN 0;
  END IF;

  -- Determine winner
  IF p_home_score > p_away_score THEN
    v_winner := 'home';
  ELSIF p_away_score > p_home_score THEN
    v_winner := 'away';
  ELSE
    v_winner := 'draw';
  END IF;

  IF p_actual_home_score > p_actual_away_score THEN
    v_actual_winner := 'home';
  ELSIF p_actual_away_score > p_actual_home_score THEN
    v_actual_winner := 'away';
  ELSE
    v_actual_winner := 'draw';
  END IF;

  -- Exact score: 10 points
  IF p_home_score = p_actual_home_score AND p_away_score = p_actual_away_score THEN
    v_points := v_points + 10;
  -- Correct winner: 3 points
  ELSIF v_winner = v_actual_winner THEN
    v_points := v_points + 3;
  END IF;

  -- Extra time winner (knockout): 2 points
  IF p_extra_time_winner IS NOT NULL 
     AND p_actual_extra_time_winner IS NOT NULL 
     AND p_extra_time_winner = p_actual_extra_time_winner THEN
    v_points := v_points + 2;
  END IF;

  -- Penalties winner (knockout): 2 points
  IF p_penalties_winner IS NOT NULL 
     AND p_actual_penalties_winner IS NOT NULL 
     AND p_penalties_winner = p_actual_penalties_winner THEN
    v_points := v_points + 2;
  END IF;

  RETURN v_points;
END;
$$ LANGUAGE plpgsql;

-- Update points for a single pick
CREATE OR REPLACE FUNCTION public.update_pick_points(pick_id UUID)
RETURNS VOID AS $$
DECLARE
  v_pick RECORD;
  v_match RECORD;
  v_points INTEGER;
BEGIN
  SELECT mp.*, m.home_score AS match_home_score, m.away_score AS match_away_score,
         m.extra_time_winner AS match_extra_time, m.penalties_winner AS match_penalties
  INTO v_pick
  FROM public.match_picks mp
  JOIN public.matches m ON m.id = mp.match_id
  WHERE mp.id = pick_id;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  v_points := public.calculate_match_pick_points(
    v_pick.home_score,
    v_pick.away_score,
    v_pick.match_home_score,
    v_pick.match_away_score,
    v_pick.extra_time_winner,
    v_pick.penalties_winner,
    v_pick.match_extra_time,
    v_pick.match_penalties
  );

  UPDATE public.match_picks
  SET points = v_points, updated_at = NOW()
  WHERE id = pick_id;
END;
$$ LANGUAGE plpgsql;

-- Wrapper function for trigger
CREATE OR REPLACE FUNCTION public.trigger_pick_inserted()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM public.update_pick_points(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger: After match result is updated, recalculate all picks for that match
CREATE OR REPLACE FUNCTION public.trigger_update_match_picks()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.home_score IS NOT NULL AND NEW.away_score IS NOT NULL 
     AND (OLD.home_score IS NULL OR OLD.home_score <> NEW.home_score
          OR OLD.away_score IS NULL OR OLD.away_score <> NEW.away_score) THEN
    UPDATE public.match_picks
    SET points = public.calculate_match_pick_points(
      home_score,
      away_score,
      NEW.home_score,
      NEW.away_score,
      extra_time_winner,
      penalties_winner,
      NEW.extra_time_winner,
      NEW.penalties_winner
    ),
    updated_at = NOW()
    WHERE match_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS match_result_updated ON public.matches;
CREATE TRIGGER match_result_updated
  AFTER UPDATE ON public.matches
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_update_match_picks();

DROP TRIGGER IF EXISTS pick_inserted ON public.match_picks;
CREATE TRIGGER pick_inserted
  AFTER INSERT ON public.match_picks
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_pick_inserted();

-- ============================================
-- LEADERBOARD FUNCTIONS
-- ============================================

-- Calculate group points for a user based on group picks
CREATE OR REPLACE FUNCTION public.calculate_group_points(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  v_group_points INTEGER := 0;
  v_group_name TEXT;
  v_picked_1 TEXT;
  v_picked_2 TEXT;
  v_actual_1 INTEGER;
  v_actual_2 INTEGER;
  v_hits INTEGER;
BEGIN
  FOR v_group_name IN SELECT DISTINCT substring(pick_type FROM 7 FOR 1) 
                      FROM public.special_picks 
                      WHERE user_id = user_uuid AND pick_type LIKE 'group_%' LOOP
    SELECT team_id::TEXT INTO v_picked_1 
    FROM public.special_picks 
    WHERE user_id = user_uuid AND pick_type = 'group_' || v_group_name || '_1';
    
    SELECT team_id::TEXT INTO v_picked_2 
    FROM public.special_picks 
    WHERE user_id = user_uuid AND pick_type = 'group_' || v_group_name || '_2';
    
    SELECT MAX(CASE WHEN pos = 1 THEN team_id END),
           MAX(CASE WHEN pos = 2 THEN team_id END)
    INTO v_actual_1, v_actual_2
    FROM (
      SELECT t.id as team_id,
             ROW_NUMBER() OVER (ORDER BY 
               SUM(CASE WHEN m.home_team = t.id THEN m.home_score ELSE m.away_score END) -
               SUM(CASE WHEN m.home_team = t.id THEN m.away_score ELSE m.home_score END) DESC,
               SUM(CASE WHEN m.home_team = t.id THEN m.home_score ELSE m.away_score END) DESC
             ) as pos
      FROM public.matches m
      JOIN public.teams t ON t.id = m.home_team OR t.id = m.away_team
      WHERE m.stage = 'group_stage' AND t.group_name = v_group_name
      GROUP BY t.id
    ) ranked;
    
    IF v_actual_1 IS NOT NULL AND v_actual_2 IS NOT NULL THEN
      v_hits := 0;
      IF v_picked_1 = v_actual_1::TEXT OR v_picked_1 = v_actual_2::TEXT THEN
        v_hits := v_hits + 1;
      END IF;
      IF v_picked_2 = v_actual_1::TEXT OR v_picked_2 = v_actual_2::TEXT THEN
        v_hits := v_hits + 1;
      END IF;
      
      IF v_hits = 2 THEN
        v_group_points := v_group_points + 6;
      ELSIF v_hits = 1 THEN
        v_group_points := v_group_points + 2;
      END IF;
    END IF;
  END LOOP;
  
  RETURN v_group_points;
END;
$$ LANGUAGE plpgsql;

-- Recalculate leaderboard for a user
CREATE OR REPLACE FUNCTION public.recalculate_user_points(user_uuid UUID)
RETURNS VOID AS $$
DECLARE
  v_match_points INTEGER := 0;
  v_special_points INTEGER := 0;
  v_group_points INTEGER := 0;
  v_total_points INTEGER := 0;
BEGIN
  SELECT COALESCE(SUM(points), 0)
  INTO v_match_points
  FROM public.match_picks
  WHERE user_id = user_uuid;

  SELECT COALESCE(SUM(points), 0)
  INTO v_special_points
  FROM public.special_picks
  WHERE user_id = user_uuid;

  v_group_points := public.calculate_group_points(user_uuid);

  v_total_points := v_match_points + v_special_points + v_group_points;

  INSERT INTO public.leaderboard (user_id, total_points, match_points, special_points, group_points, updated_at)
  VALUES (user_uuid, v_total_points, v_match_points, v_special_points, v_group_points, NOW())
  ON CONFLICT (user_id) DO UPDATE SET
    total_points = v_total_points,
    match_points = v_match_points,
    special_points = v_special_points,
    group_points = v_group_points,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Trigger: After pick is updated, recalculate leaderboard
CREATE OR REPLACE FUNCTION public.trigger_update_leaderboard()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM public.recalculate_user_points(COALESCE(NEW.user_id, OLD.user_id));
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS pick_changed ON public.match_picks;
CREATE TRIGGER pick_changed
  AFTER INSERT OR UPDATE ON public.match_picks
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_update_leaderboard();

DROP TRIGGER IF EXISTS special_pick_changed ON public.special_picks;
CREATE TRIGGER special_pick_changed
  AFTER INSERT OR UPDATE ON public.special_picks
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_update_leaderboard();

-- ============================================
-- HELPER: Check if user has role
-- ============================================

CREATE OR REPLACE FUNCTION public.has_role(p_user_uuid UUID, p_role_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS(
    SELECT 1 FROM public.user_roles
    WHERE user_id = p_user_uuid AND role = p_role_name
  );
END;
$$ LANGUAGE plpgsql;
