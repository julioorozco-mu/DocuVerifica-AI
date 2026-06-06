-- Drop the legacy hashed_password column since we are fully using Supabase Auth
ALTER TABLE public.profiles DROP COLUMN IF EXISTS hashed_password;
