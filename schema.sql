-- Easy Health Database Schema
-- Based on ERD: USER, INSURANCE_PLAN, INSURANCE_PROVIDER, HEALTHCARE_PROVIDER, APPOINTMENT, ARTICLE, AI_CHATS

-- Users table (public profile, no auth dependency)
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

-- Shared plan definitions (dropdown / catalog)
CREATE TABLE public.insurance_plan_catalog (
  catalog_plan_id SERIAL PRIMARY KEY,
  provider_id INT NOT NULL REFERENCES public.insurance_providers(provider_id) ON DELETE CASCADE,
  plan_name TEXT NOT NULL,
  copay_amount FLOAT NOT NULL DEFAULT 0,
  policy_type TEXT NOT NULL,
  annual_deductible FLOAT NOT NULL DEFAULT 0,
  out_of_pocket_max FLOAT NOT NULL DEFAULT 0
);

-- Per-user enrollment in a catalog plan
CREATE TABLE public.insurance_plans (
  plan_id SERIAL PRIMARY KEY,
  user_id INT NOT NULL UNIQUE REFERENCES public.users(user_id) ON DELETE CASCADE,
  catalog_plan_id INT NOT NULL REFERENCES public.insurance_plan_catalog(catalog_plan_id) ON DELETE RESTRICT,
  remaining_balance FLOAT DEFAULT 0
);

-- Healthcare Providers (Doctors)
CREATE TABLE public.healthcare_providers (
  doctor_id SERIAL PRIMARY KEY,
  full_name TEXT NOT NULL,
  specialty TEXT NOT NULL,
  facility_name TEXT NOT NULL
);

-- In-Network relationship (many-to-many)
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

-- User-Article relationship (views/saves)
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

-- Optional RLS setup for browser-based login/signup in this project
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read on users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Allow public insert on users" ON public.users FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on users" ON public.users FOR UPDATE USING (true) WITH CHECK (true);

ALTER TABLE public.insurance_plan_catalog ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read on insurance_plan_catalog" ON public.insurance_plan_catalog FOR SELECT USING (true);

ALTER TABLE public.insurance_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read on insurance_plans" ON public.insurance_plans FOR SELECT USING (true);
CREATE POLICY "Allow public insert on insurance_plans" ON public.insurance_plans FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on insurance_plans" ON public.insurance_plans FOR UPDATE USING (true) WITH CHECK (true);
