-- Allow deleting user rows (needed for admin dashboard: remove admin accounts)
DROP POLICY IF EXISTS "Allow public delete on users" ON public.users;
CREATE POLICY "Allow public delete on users" ON public.users FOR DELETE USING (true);
