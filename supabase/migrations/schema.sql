-- SecureCampus Supabase Schema Setup
-- 1. Create Custom Types
CREATE TYPE user_role AS ENUM ('student', 'faculty', 'admin');

-- 2. Create Profiles Table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL,
    full_name TEXT,
    role user_role DEFAULT 'student'::user_role NOT NULL,
    enrollment_no TEXT UNIQUE,
    department TEXT,
    phone TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS) on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Create Audit Logs Table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    actor_email TEXT,
    action TEXT NOT NULL, -- e.g., 'LOGIN_SUCCESS', 'PROFILE_UPDATE', 'STUDENT_SEARCH'
    ip_address TEXT,
    status TEXT NOT NULL, -- 'SUCCESS', 'FAILED'
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 4. Helper Functions for RLS Policies
-- Security definer function to avoid recursion in RLS
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS user_role AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

-- 5. RLS Policies for Profiles Table
-- Policy: Users can read all profiles (required for search and display)
CREATE POLICY "Allow authenticated users to view profiles" 
ON public.profiles FOR SELECT 
TO authenticated
USING (true);

-- Policy: Users can update their own profile
CREATE POLICY "Allow users to update own profile" 
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id AND (
    -- Prevent students/faculty from changing their own role
    CASE 
        WHEN public.get_current_user_role() = 'admin'::user_role THEN true
        ELSE role = (SELECT role FROM public.profiles WHERE id = auth.uid())
    END
));

-- Policy: Admins can do anything
CREATE POLICY "Allow admins full access to profiles"
ON public.profiles FOR ALL
TO authenticated
USING (public.get_current_user_role() = 'admin'::user_role)
WITH CHECK (public.get_current_user_role() = 'admin'::user_role);

-- 6. RLS Policies for Audit Logs Table
-- Policy: Only admins can view audit logs
CREATE POLICY "Allow admins to view audit logs"
ON public.audit_logs FOR SELECT
TO authenticated
USING (public.get_current_user_role() = 'admin'::user_role);

-- Policy: Authenticated users can insert audit logs (via application actions)
CREATE POLICY "Allow authenticated users to insert audit logs"
ON public.audit_logs FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy: Service role or system can insert log for logins (handled on server side)
CREATE POLICY "Allow server actions to insert audit logs"
ON public.audit_logs FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- 7. Automated Trigger: Create a profile profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, enrollment_no, department, phone)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    COALESCE((new.raw_user_meta_data->>'role')::user_role, 'student'::user_role),
    new.raw_user_meta_data->>'enrollment_no',
    new.raw_user_meta_data->>'department',
    new.raw_user_meta_data->>'phone'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 8. Automated Trigger: Maintain updated_at timestamp on profile updates
CREATE OR REPLACE FUNCTION public.handle_update_timestamp()
RETURNS trigger AS $$
BEGIN
  new.updated_at = timezone('utc'::text, now());
  RETURN new;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER on_profile_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_update_timestamp();

-- 9. Storage Buckets configuration
-- Note: Execute in Supabase SQL editor to create the storage bucket 'avatars'
-- and RLS policies for storage objects.
--
-- INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
--
-- CREATE POLICY "Avatar images are publicly accessible"
-- ON storage.objects FOR SELECT TO public USING (bucket_id = 'avatars');
--
-- CREATE POLICY "Authenticated users can upload avatars"
-- ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
