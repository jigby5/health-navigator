-- Insurance plan catalog + enrollment refactor
-- See docs/INSURANCE_PLAN_CATALOG_CHANGES.md

-- 1. Catalog of selectable plans (shared across users)
CREATE TABLE public.insurance_plan_catalog (
  catalog_plan_id SERIAL PRIMARY KEY,
  provider_id INT NOT NULL REFERENCES public.insurance_providers(provider_id) ON DELETE CASCADE,
  plan_name TEXT NOT NULL,
  copay_amount FLOAT NOT NULL DEFAULT 0,
  policy_type TEXT NOT NULL,
  annual_deductible FLOAT NOT NULL DEFAULT 0,
  out_of_pocket_max FLOAT NOT NULL DEFAULT 0
);

CREATE INDEX insurance_plan_catalog_provider_id_idx ON public.insurance_plan_catalog (provider_id);

-- 2. Ensure all four carriers exist (migration may run before seed data)
INSERT INTO public.insurance_providers (provider_id, name, network_type) VALUES
  (1, 'InterHills Health Network', 'HMO'),
  (2, 'City Medical Insurance', 'PPO'),
  (3, 'Summit Care Alliance', 'EPO'),
  (4, 'River Valley Health', 'HMO')
ON CONFLICT (provider_id) DO NOTHING;

-- Fix sequence if providers already had rows (no-op on fresh DB)
SELECT setval(
  pg_get_serial_sequence('public.insurance_providers', 'provider_id'),
  (SELECT COALESCE(MAX(provider_id), 1) FROM public.insurance_providers)
);

-- 3. Twelve catalog plans (3 per provider)
INSERT INTO public.insurance_plan_catalog
  (catalog_plan_id, provider_id, plan_name, copay_amount, policy_type, annual_deductible, out_of_pocket_max)
VALUES
  (1, 1, 'InterHills Gold HMO', 25, 'Individual', 67, 3000),
  (2, 1, 'InterHills Silver HMO', 35, 'Individual', 500, 4000),
  (3, 1, 'InterHills Bronze HMO', 45, 'Family', 1500, 6000),
  (4, 2, 'City Flex PPO', 30, 'Individual', 400, 3500),
  (5, 2, 'City Select PPO', 40, 'Individual', 800, 4500),
  (6, 2, 'City Family PPO', 30, 'Family', 1200, 5500),
  (7, 3, 'Summit EPO Essential', 20, 'Individual', 150, 2500),
  (8, 3, 'Summit EPO Plus', 35, 'Individual', 600, 4000),
  (9, 3, 'Summit EPO Family', 25, 'Family', 2000, 7000),
  (10, 4, 'River HMO Basic', 40, 'Individual', 300, 3200),
  (11, 4, 'River HMO Standard', 25, 'Individual', 550, 3800),
  (12, 4, 'River HMO Family', 35, 'Family', 1100, 5200);

SELECT setval(
  pg_get_serial_sequence('public.insurance_plan_catalog', 'catalog_plan_id'),
  (SELECT COALESCE(MAX(catalog_plan_id), 1) FROM public.insurance_plan_catalog)
);

-- 4. Link existing enrollments to catalog rows before dropping columns
ALTER TABLE public.insurance_plans ADD COLUMN catalog_plan_id INT REFERENCES public.insurance_plan_catalog(catalog_plan_id);

UPDATE public.insurance_plans AS ip
SET catalog_plan_id = ipc.catalog_plan_id
FROM public.insurance_plan_catalog AS ipc
WHERE ip.provider_id = ipc.provider_id
  AND ip.copay_amount = ipc.copay_amount
  AND ip.policy_type = ipc.policy_type;

UPDATE public.insurance_plans SET catalog_plan_id = 1 WHERE catalog_plan_id IS NULL;

ALTER TABLE public.insurance_plans ALTER COLUMN catalog_plan_id SET NOT NULL;

ALTER TABLE public.insurance_plans DROP COLUMN provider_id;
ALTER TABLE public.insurance_plans DROP COLUMN copay_amount;
ALTER TABLE public.insurance_plans DROP COLUMN policy_type;

ALTER TABLE public.insurance_plans
  ADD CONSTRAINT insurance_plans_user_id_key UNIQUE (user_id);

-- 5. In-network rows for new carriers (only if seeded doctors exist)
INSERT INTO public.provider_network (insurance_provider_id, healthcare_provider_id)
SELECT 3, 1 WHERE EXISTS (SELECT 1 FROM public.healthcare_providers WHERE doctor_id = 1);
INSERT INTO public.provider_network (insurance_provider_id, healthcare_provider_id)
SELECT 3, 3 WHERE EXISTS (SELECT 1 FROM public.healthcare_providers WHERE doctor_id = 3);
INSERT INTO public.provider_network (insurance_provider_id, healthcare_provider_id)
SELECT 4, 2 WHERE EXISTS (SELECT 1 FROM public.healthcare_providers WHERE doctor_id = 2);
INSERT INTO public.provider_network (insurance_provider_id, healthcare_provider_id)
SELECT 4, 4 WHERE EXISTS (SELECT 1 FROM public.healthcare_providers WHERE doctor_id = 4);

-- 6. RLS
ALTER TABLE public.insurance_plan_catalog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on insurance_plan_catalog"
  ON public.insurance_plan_catalog FOR SELECT USING (true);

CREATE POLICY "Allow public insert on insurance_plans"
  ON public.insurance_plans FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update on insurance_plans"
  ON public.insurance_plans FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow public update on users"
  ON public.users FOR UPDATE USING (true) WITH CHECK (true);
