-- Seed Data for Easy Health
-- Matches the existing UI for persona "Chad"

-- User: Chad
INSERT INTO public.users (user_id, email, password_hash, first_name, last_name, health_profile, total_balance_due, total_copay_amounts)
VALUES (1, 'chad@example.com', 'hashed_placeholder', 'Chad', 'Johnson', 'No known allergies. Peanut sensitivity.', 67.00, 25.00);

-- Insurance Providers
INSERT INTO public.insurance_providers (provider_id, name, network_type) VALUES
(1, 'InterHills Health Network', 'HMO'),
(2, 'City Medical Insurance', 'PPO');

-- Insurance Plan for Chad
INSERT INTO public.insurance_plans (plan_id, user_id, provider_id, copay_amount, remaining_balance, policy_type) VALUES
(1, 1, 1, 25.00, 67.00, 'Individual');

-- Healthcare Providers (Doctors)
INSERT INTO public.healthcare_providers (doctor_id, full_name, specialty, facility_name) VALUES
(1, 'Dr. Carsonian', 'General Practice', 'InterHills Health'),
(2, 'Dr. George', 'Internal Medicine', 'City Medical Center'),
(3, 'Dr. Danger', 'Orthopedics', 'Westside Clinic'),
(4, 'Dr. J.E. Barber-Howell', 'Cardiology', 'InterHills Health');

-- In-Network relationships
INSERT INTO public.provider_network (insurance_provider_id, healthcare_provider_id) VALUES
(1, 1), (1, 4),  -- InterHills covers Dr. Carsonian and Dr. Barber-Howell
(2, 2), (2, 3);  -- City Medical covers Dr. George and Dr. Danger

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
