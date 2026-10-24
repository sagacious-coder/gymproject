-- ==============================================================================
-- GYMPROJECT: SUPABASE POSTGRESQL SCHEMA
-- Polymorphic Fitness, Running, Nutrition & Document Intelligence Engine
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ENUMS & DOMAINS
DO $$ BEGIN
    CREATE TYPE session_type AS ENUM ('strength', 'cardio', 'hybrid', 'mobility', 'yoga', 'recovery');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE document_category AS ENUM ('bloodwork', 'diet_plan', 'workout_routine', 'dexa_scan', 'other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE meal_type AS ENUM ('breakfast', 'lunch', 'dinner', 'snack', 'supplement', 'pre_workout', 'post_workout');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. HELPER FUNCTIONS: Automatic Updated At Timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==============================================================================
-- TABLE: USERS (Public Profile Linked to auth.users)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT,
    avatar_url TEXT,
    preferred_unit_system TEXT DEFAULT 'metric' CHECK (preferred_unit_system IN ('metric', 'imperial')),
    -- Goals: JSONB holds flexible targets like weekly mileage, 1RM targets, daily macros, target weight
    goals JSONB DEFAULT '{
        "target_weight_kg": null,
        "daily_calories": 2500,
        "daily_protein_g": 180,
        "daily_carbs_g": 250,
        "daily_fats_g": 70,
        "weekly_run_km": 20,
        "focus_areas": ["hypertrophy", "aerobic_base"]
    }'::jsonb NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==============================================================================
-- TABLE: SESSIONS (Workout containers: Gym day, long run, track workout)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT,
    type session_type NOT NULL DEFAULT 'strength',
    date TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    duration_min INTEGER CHECK (duration_min >= 0),
    perceived_exertion_rpe NUMERIC(3, 1) CHECK (perceived_exertion_rpe BETWEEN 1 AND 10),
    ai_summary TEXT, -- LLM synthesized executive summary of the workout
    raw_voice_input TEXT, -- Original transcribed transcript for auditing/re-parsing
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TRIGGER update_sessions_updated_at
    BEFORE UPDATE ON public.sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==============================================================================
-- TABLE: ACTIVITIES (Specific exercise/routine within a session)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
    name TEXT NOT NULL, -- e.g., 'Bench Press', '5km Outdoor Run', 'Barbell Squat', 'Incline Treadmill'
    category TEXT, -- e.g., 'chest', 'quadriceps', 'aerobic_endurance', 'core'
    order_index INTEGER DEFAULT 0 NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ==============================================================================
-- TABLE: METRICS (Polymorphic data payload via JSONB)
-- Stores sets/reps/weight for lifting OR distance/pace/elevation/HR for running
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    activity_id UUID NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
    set_number INTEGER, -- NULL for continuous cardio activities
    -- PAYLOAD EXAMPLES:
    -- Strength: {"reps": 10, "weight_kg": 100, "rpe": 8, "tempo": "3-0-1", "is_warmup": false, "one_rep_max_est": 133.3}
    -- Cardio:   {"distance_km": 5.0, "time_seconds": 1475, "pace_min_km": 4.92, "heart_rate_avg": 162, "heart_rate_max": 178, "cadence": 172, "elevation_gain_m": 45}
    -- Yoga/Mob: {"duration_min": 20, "poses_completed": 12, "flow_type": "vinyasa"}
    payload JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ==============================================================================
-- TABLE: MEALS (Nutritional intake, food logging, macro breakdown)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.meals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    description TEXT NOT NULL, -- e.g., '3 scrambled eggs, 2 slices sourdough toast, half avocado'
    meal_type meal_type DEFAULT 'lunch' NOT NULL,
    calories NUMERIC(6, 1) NOT NULL CHECK (calories >= 0),
    protein NUMERIC(5, 1) NOT NULL DEFAULT 0 CHECK (protein >= 0),
    carbs NUMERIC(5, 1) NOT NULL DEFAULT 0 CHECK (carbs >= 0),
    fats NUMERIC(5, 1) NOT NULL DEFAULT 0 CHECK (fats >= 0),
    fiber NUMERIC(5, 1) DEFAULT 0,
    photo_url TEXT,
    ingredients JSONB DEFAULT '[]'::jsonb, -- Itemized breakdown: [{"item": "egg", "qty": "3 large", "calories": 210, "protein": 18}]
    timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TRIGGER update_meals_updated_at
    BEFORE UPDATE ON public.meals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==============================================================================
-- TABLE: DOCUMENTS (PDF scans, Trainer routines, Bloodwork labs)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    file_name TEXT,
    type document_category NOT NULL DEFAULT 'other',
    raw_extracted_text TEXT,
    ai_analysis_summary TEXT NOT NULL, -- Human-friendly breakdown ("Ferritin is low; focus on iron-rich foods")
    extracted_data JSONB DEFAULT '{}'::jsonb, -- Structured markers or scheduled calendar events
    is_processed BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TRIGGER update_documents_updated_at
    BEFORE UPDATE ON public.documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==============================================================================
-- PERFORMANCE INDEXES (Optimized for Aggregation, Timeline & Polymorphic JSONB)
-- ==============================================================================
-- Sessions & activities search
CREATE INDEX IF NOT EXISTS idx_sessions_user_date ON public.sessions (user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_type ON public.sessions (type);
CREATE INDEX IF NOT EXISTS idx_activities_session_order ON public.activities (session_id, order_index ASC);
CREATE INDEX IF NOT EXISTS idx_activities_name ON public.activities (name);

-- Polymorphic metrics GIN Index: Enables high-speed JSON queries (e.g., payload @> '{"reps": 10}')
CREATE INDEX IF NOT EXISTS idx_metrics_activity_id ON public.metrics (activity_id);
CREATE INDEX IF NOT EXISTS idx_metrics_payload_gin ON public.metrics USING GIN (payload jsonb_path_ops);

-- Nutrition search
CREATE INDEX IF NOT EXISTS idx_meals_user_timestamp ON public.meals (user_id, timestamp DESC);

-- Documents search
CREATE INDEX IF NOT EXISTS idx_documents_user_type ON public.documents (user_id, type);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- 1. USERS POLICIES
CREATE POLICY "Users can view their own profile"
    ON public.users FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON public.users FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
    ON public.users FOR INSERT
    WITH CHECK (auth.uid() = id);

-- 2. SESSIONS POLICIES
CREATE POLICY "Users can manage their own sessions"
    ON public.sessions FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 3. ACTIVITIES POLICIES (Joined via sessions)
CREATE POLICY "Users can manage activities for their sessions"
    ON public.activities FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.sessions
            WHERE sessions.id = activities.session_id
            AND sessions.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.sessions
            WHERE sessions.id = activities.session_id
            AND sessions.user_id = auth.uid()
        )
    );

-- 4. METRICS POLICIES (Joined via activities -> sessions)
CREATE POLICY "Users can manage metrics for their activities"
    ON public.metrics FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.activities
            JOIN public.sessions ON sessions.id = activities.session_id
            WHERE activities.id = metrics.activity_id
            AND sessions.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.activities
            JOIN public.sessions ON sessions.id = activities.session_id
            WHERE activities.id = metrics.activity_id
            AND sessions.user_id = auth.uid()
        )
    );

-- 5. MEALS POLICIES
CREATE POLICY "Users can manage their own meals"
    ON public.meals FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 6. DOCUMENTS POLICIES
CREATE POLICY "Users can manage their own documents"
    ON public.documents FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ==============================================================================
-- AUTOMATIC NEW USER INITIALIZATION (Supabase Auth Hook)
-- Automatically inserts a corresponding public.users row whenever a new signup happens.
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, name, email, avatar_url)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'Athlete'),
        NEW.email,
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to hook into auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
