-- =====================================================
-- Planning Dashboard - Full Database Schema
-- =====================================================

-- Profiles (extends auth.users)
CREATE TABLE public.profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT NOT NULL,
  full_name     TEXT,
  avatar_url    TEXT,
  timezone      TEXT DEFAULT 'UTC',
  preferences   JSONB DEFAULT '{}'::jsonb,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- Categories
CREATE TABLE public.categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  color       TEXT NOT NULL DEFAULT '#8B5CF6',
  icon        TEXT,
  sort_order  INT DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, name)
);

-- Goals
CREATE TABLE public.goals (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  description     TEXT,
  target_date     DATE,
  status          TEXT NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active','completed','archived')),
  progress        INT DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- Tasks (core entity)
CREATE TABLE public.tasks (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category_id       UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  goal_id           UUID REFERENCES public.goals(id) ON DELETE SET NULL,
  title             TEXT NOT NULL,
  description       TEXT,
  priority          TEXT NOT NULL DEFAULT 'medium'
                      CHECK (priority IN ('low','medium','high','urgent')),
  status            TEXT NOT NULL DEFAULT 'unscheduled'
                      CHECK (status IN (
                        'unscheduled','pending','in_progress',
                        'completed','overdue'
                      )),
  estimated_minutes INT,
  actual_minutes    INT,
  scheduled_start   TIMESTAMPTZ,
  scheduled_end     TIMESTAMPTZ,
  completed_at      TIMESTAMPTZ,
  is_recurring      BOOLEAN DEFAULT false,
  recurrence_rule   JSONB,
  sort_order        INT DEFAULT 0,
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

-- Recurring task instances
CREATE TABLE public.recurring_task_instances (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_task_id    UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id           UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  occurrence_date   DATE NOT NULL,
  status            TEXT NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending','in_progress','completed','overdue','skipped')),
  scheduled_start   TIMESTAMPTZ,
  scheduled_end     TIMESTAMPTZ,
  actual_minutes    INT,
  completed_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT now(),
  UNIQUE(parent_task_id, occurrence_date)
);

-- Time entries
CREATE TABLE public.time_entries (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id     UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  started_at  TIMESTAMPTZ NOT NULL,
  ended_at    TIMESTAMPTZ,
  duration    INT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Daily summaries (pre-aggregated)
CREATE TABLE public.daily_summaries (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date              DATE NOT NULL,
  total_tasks       INT DEFAULT 0,
  completed_tasks   INT DEFAULT 0,
  overdue_tasks     INT DEFAULT 0,
  total_planned_min INT DEFAULT 0,
  total_actual_min  INT DEFAULT 0,
  productivity_score DECIMAL(5,2),
  created_at        TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, date)
);

-- =====================================================
-- Indexes
-- =====================================================
CREATE INDEX idx_tasks_user_status ON public.tasks(user_id, status);
CREATE INDEX idx_tasks_user_scheduled ON public.tasks(user_id, scheduled_start);
CREATE INDEX idx_tasks_user_category ON public.tasks(user_id, category_id);
CREATE INDEX idx_categories_user ON public.categories(user_id);
CREATE INDEX idx_goals_user ON public.goals(user_id);
CREATE INDEX idx_time_entries_task ON public.time_entries(task_id);
CREATE INDEX idx_time_entries_user ON public.time_entries(user_id);
CREATE INDEX idx_daily_summaries_user_date ON public.daily_summaries(user_id, date);
CREATE INDEX idx_recurring_instances_parent ON public.recurring_task_instances(parent_task_id);

-- =====================================================
-- Functions & Triggers
-- =====================================================

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.goals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- =====================================================
-- Row Level Security
-- =====================================================

-- Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Categories
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own categories" ON public.categories FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own categories" ON public.categories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own categories" ON public.categories FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own categories" ON public.categories FOR DELETE USING (auth.uid() = user_id);

-- Goals
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own goals" ON public.goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own goals" ON public.goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own goals" ON public.goals FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own goals" ON public.goals FOR DELETE USING (auth.uid() = user_id);

-- Tasks
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own tasks" ON public.tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own tasks" ON public.tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tasks" ON public.tasks FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own tasks" ON public.tasks FOR DELETE USING (auth.uid() = user_id);

-- Recurring task instances
ALTER TABLE public.recurring_task_instances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own recurring instances" ON public.recurring_task_instances FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own recurring instances" ON public.recurring_task_instances FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own recurring instances" ON public.recurring_task_instances FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own recurring instances" ON public.recurring_task_instances FOR DELETE USING (auth.uid() = user_id);

-- Time entries
ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own time entries" ON public.time_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own time entries" ON public.time_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own time entries" ON public.time_entries FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own time entries" ON public.time_entries FOR DELETE USING (auth.uid() = user_id);

-- Daily summaries
ALTER TABLE public.daily_summaries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own summaries" ON public.daily_summaries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own summaries" ON public.daily_summaries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own summaries" ON public.daily_summaries FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- RPC Functions for Dashboard
-- =====================================================

CREATE OR REPLACE FUNCTION get_task_metrics(
  p_user_id UUID,
  p_start_date DATE,
  p_end_date DATE
) RETURNS JSON AS $$
  SELECT json_build_object(
    'total', COUNT(*),
    'completed', COUNT(*) FILTER (WHERE status = 'completed'),
    'overdue', COUNT(*) FILTER (WHERE status = 'overdue'),
    'incomplete', COUNT(*) FILTER (WHERE status IN ('pending', 'in_progress', 'unscheduled')),
    'completion_rate', ROUND(
      COUNT(*) FILTER (WHERE status = 'completed')::NUMERIC /
      NULLIF(COUNT(*), 0) * 100, 1
    )
  )
  FROM public.tasks
  WHERE user_id = p_user_id
    AND created_at::date >= p_start_date
    AND created_at::date <= p_end_date;
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_tasks_by_category(
  p_user_id UUID,
  p_start_date DATE,
  p_end_date DATE
) RETURNS JSON AS $$
  SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
  FROM (
    SELECT
      c.name as category_name,
      c.color as category_color,
      COUNT(*) as task_count,
      COALESCE(SUM(t.actual_minutes), 0) as total_minutes
    FROM public.tasks t
    LEFT JOIN public.categories c ON t.category_id = c.id
    WHERE t.user_id = p_user_id
      AND t.created_at::date >= p_start_date
      AND t.created_at::date <= p_end_date
    GROUP BY c.name, c.color
    ORDER BY task_count DESC
  ) t;
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_daily_completion(
  p_user_id UUID,
  p_start_date DATE,
  p_end_date DATE
) RETURNS JSON AS $$
  SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
  FROM (
    SELECT
      d.date,
      COUNT(tk.id) FILTER (WHERE tk.status = 'completed') as completed,
      COUNT(tk.id) as total
    FROM generate_series(p_start_date, p_end_date, '1 day'::interval) d(date)
    LEFT JOIN public.tasks tk
      ON tk.user_id = p_user_id
      AND tk.completed_at::date = d.date::date
    GROUP BY d.date
    ORDER BY d.date
  ) t;
$$ LANGUAGE sql SECURITY DEFINER;
