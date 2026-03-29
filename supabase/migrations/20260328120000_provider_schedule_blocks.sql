-- Provider unavailability blocks (full-day or partial) for scheduling conflict checks
-- See schema.sql and seed.sql for greenfield parity

CREATE TABLE public.provider_schedule_blocks (
  block_id SERIAL PRIMARY KEY,
  doctor_id INT NOT NULL REFERENCES public.healthcare_providers (doctor_id) ON DELETE CASCADE,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  is_full_day BOOLEAN NOT NULL DEFAULT false,
  reason TEXT,
  CONSTRAINT provider_schedule_blocks_end_after_start CHECK (end_at > start_at)
);

CREATE INDEX provider_schedule_blocks_doctor_id_idx ON public.provider_schedule_blocks (doctor_id);
CREATE INDEX provider_schedule_blocks_range_idx ON public.provider_schedule_blocks (doctor_id, start_at, end_at);

ALTER TABLE public.provider_schedule_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on provider_schedule_blocks"
  ON public.provider_schedule_blocks FOR SELECT USING (true);

-- Dr. Carsonian: first and second Friday of May 2026 (full days, America/New_York-style offset used in seed data)
INSERT INTO public.provider_schedule_blocks (doctor_id, start_at, end_at, is_full_day, reason) VALUES
  (1, '2026-05-01 00:00:00-05', '2026-05-02 00:00:00-05', true, 'Out of office'),
  (1, '2026-05-08 00:00:00-05', '2026-05-09 00:00:00-05', true, 'Out of office');

SELECT setval(
  pg_get_serial_sequence('public.provider_schedule_blocks', 'block_id'),
  (SELECT COALESCE(MAX(block_id), 1) FROM public.provider_schedule_blocks)
);
