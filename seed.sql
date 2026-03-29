-- Seed Data for Easy Health
-- Matches the existing UI for persona "Chad"

-- Users
INSERT INTO public.users (user_id, email, password_hash, first_name, last_name, role, health_profile, total_balance_due, total_copay_amounts)
VALUES
(1, 'chad@example.com', '2b915e4cf1f2e1d650abf106931a85c4cd3ec49a381d0acb006db43ef9988063', 'Chad', 'Johnson', 'user', 'No known allergies. Peanut sensitivity.', 67.00, 25.00),
(2, 'admin@example.com', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', 'Admin', 'User', 'admin', NULL, 0, 0);

-- Insurance Providers (4 carriers; 3 catalog plans each in insurance_plan_catalog)
INSERT INTO public.insurance_providers (provider_id, name, network_type) VALUES
(1, 'InterHills Health Network', 'HMO'),
(2, 'City Medical Insurance', 'PPO'),
(3, 'Summit Care Alliance', 'EPO'),
(4, 'River Valley Health', 'HMO');

-- Plan catalog (12 rows)
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

-- Chad's enrollment (catalog plan 1 = InterHills Gold HMO)
INSERT INTO public.insurance_plans (plan_id, user_id, catalog_plan_id, remaining_balance) VALUES
(1, 1, 1, 67.00);

-- Healthcare Providers (Doctors)
INSERT INTO public.healthcare_providers (doctor_id, full_name, specialty, facility_name) VALUES
(1, 'Dr. Carsonian', 'General Practice', 'InterHills Health'),
(2, 'Dr. George', 'Internal Medicine', 'City Medical Center'),
(3, 'Dr. Danger', 'Orthopedics', 'Westside Clinic'),
(4, 'Dr. J.E. Barber-Howell', 'Cardiology', 'InterHills Health');

-- In-Network relationships
INSERT INTO public.provider_network (insurance_provider_id, healthcare_provider_id) VALUES
(1, 1), (1, 4),
(2, 2), (2, 3),
(3, 1), (3, 3),
(4, 2), (4, 4)
ON CONFLICT DO NOTHING;

-- Appointments (matching Dashboard UI)
INSERT INTO public.appointments (appt_id, user_id, doctor_id, date_time, status, user_notes) VALUES
(1, 1, 1, '2026-02-07 10:00:00-05', 'scheduled', 'Annual checkup'),
(2, 1, 2, '2026-03-15 14:30:00-04', 'scheduled', 'Follow-up visit'),
(3, 1, 2, '2025-02-20 09:00:00-05', 'completed', NULL),
(4, 1, 3, '2026-01-05 11:00:00-05', 'completed', NULL),
(5, 1, 4, '2025-12-23 15:00:00-05', 'completed', NULL);

-- Articles
INSERT INTO public.articles (article_id, title, summary, category, source_url) VALUES
(1, 'Understanding Your Copay', 'Learn how copayments work and what to expect at each visit.', 'Insurance', 'https://example.com/copay'),
(2, 'Managing Stress and Anxiety', 'Simple techniques to manage daily stress and improve mental health.', 'Mental Health', 'https://example.com/stress'),
(3, 'What to Do After a Sports Injury', 'Steps to take immediately after sustaining a physical injury during sports.', 'Physical Injuries', 'https://example.com/sports'),
(4, 'Preventive Care: Why It Matters', 'How regular checkups can save you money and keep you healthy.', 'Preventive Care', 'https://example.com/preventive');