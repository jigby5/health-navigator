
-- Users table
CREATE TABLE public.users (
  user_id SERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  health_profile TEXT,
  total_balance_due FLOAT DEFAULT 0,
  total_copay_amounts FLOAT DEFAULT 0
);

-- Insurance Providers
CREATE TABLE public.insurance_providers (
  provider_id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  network_type TEXT NOT NULL
);

-- Insurance Plans
CREATE TABLE public.insurance_plans (
  plan_id SERIAL PRIMARY KEY,
  user_id INT REFERENCES public.users(user_id) ON DELETE CASCADE,
  provider_id INT REFERENCES public.insurance_providers(provider_id) ON DELETE CASCADE,
  copay_amount FLOAT DEFAULT 0,
  remaining_balance FLOAT DEFAULT 0,
  policy_type TEXT NOT NULL
);

-- Healthcare Providers
CREATE TABLE public.healthcare_providers (
  doctor_id SERIAL PRIMARY KEY,
  full_name TEXT NOT NULL,
  specialty TEXT NOT NULL,
  facility_name TEXT NOT NULL
);

-- Provider Network (many-to-many)
CREATE TABLE public.provider_network (
  insurance_provider_id INT REFERENCES public.insurance_providers(provider_id) ON DELETE CASCADE,
  healthcare_provider_id INT REFERENCES public.healthcare_providers(doctor_id) ON DELETE CASCADE,
  PRIMARY KEY (insurance_provider_id, healthcare_provider_id)
);

-- Appointments
CREATE TABLE public.appointments (
  appt_id SERIAL PRIMARY KEY,
  user_id INT REFERENCES public.users(user_id) ON DELETE CASCADE,
  doctor_id INT REFERENCES public.healthcare_providers(doctor_id) ON DELETE CASCADE,
  date_time TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled',
  user_notes TEXT
);

-- Articles
CREATE TABLE public.articles (
  article_id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  summary TEXT,
  category TEXT NOT NULL,
  source_url TEXT
);

-- User-Article relationship
CREATE TABLE public.user_articles (
  user_id INT REFERENCES public.users(user_id) ON DELETE CASCADE,
  article_id INT REFERENCES public.articles(article_id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, article_id)
);

-- AI Chats
CREATE TABLE public.ai_chats (
  chat_id SERIAL PRIMARY KEY,
  time_chat_started TIMESTAMPTZ NOT NULL DEFAULT now(),
  chat_content TEXT,
  user_id INT REFERENCES public.users(user_id) ON DELETE CASCADE
);

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insurance_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insurance_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.healthcare_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_network ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_chats ENABLE ROW LEVEL SECURITY;

-- Since NO authentication is used, allow public read/write access for the vertical slice
-- In production, these would be scoped to authenticated users
CREATE POLICY "Allow public read on users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Allow public read on insurance_providers" ON public.insurance_providers FOR SELECT USING (true);
CREATE POLICY "Allow public read on insurance_plans" ON public.insurance_plans FOR SELECT USING (true);
CREATE POLICY "Allow public read on healthcare_providers" ON public.healthcare_providers FOR SELECT USING (true);
CREATE POLICY "Allow public read on provider_network" ON public.provider_network FOR SELECT USING (true);
CREATE POLICY "Allow public read on appointments" ON public.appointments FOR SELECT USING (true);
CREATE POLICY "Allow public update on appointments" ON public.appointments FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read on articles" ON public.articles FOR SELECT USING (true);
CREATE POLICY "Allow public read on user_articles" ON public.user_articles FOR SELECT USING (true);
CREATE POLICY "Allow public read on ai_chats" ON public.ai_chats FOR SELECT USING (true);
