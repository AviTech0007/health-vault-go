-- Create enum for user roles
CREATE TYPE public.user_role AS ENUM ('patient', 'doctor');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role user_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Create medical records table
CREATE TABLE public.medical_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  notes TEXT,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;

-- Medical records policies
CREATE POLICY "Patients can view their own records"
  ON public.medical_records FOR SELECT
  USING (auth.uid() = patient_id);

CREATE POLICY "Doctors can view records they uploaded"
  ON public.medical_records FOR SELECT
  USING (auth.uid() = doctor_id);

CREATE POLICY "Doctors can insert records"
  ON public.medical_records FOR INSERT
  WITH CHECK (
    auth.uid() = doctor_id AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'doctor'
    )
  );

-- Create storage bucket for medical files
INSERT INTO storage.buckets (id, name, public)
VALUES ('medical-files', 'medical-files', false);

-- Storage policies for medical files
CREATE POLICY "Doctors can upload files"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'medical-files' AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'doctor'
    )
  );

CREATE POLICY "Users can view their medical files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'medical-files' AND
    (
      -- Patients can view their own files
      EXISTS (
        SELECT 1 FROM public.medical_records mr
        WHERE mr.file_url LIKE '%' || name || '%'
        AND mr.patient_id = auth.uid()
      ) OR
      -- Doctors can view files they uploaded
      EXISTS (
        SELECT 1 FROM public.medical_records mr
        WHERE mr.file_url LIKE '%' || name || '%'
        AND mr.doctor_id = auth.uid()
      )
    )
  );

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', 'User'),
    COALESCE((new.raw_user_meta_data->>'role')::user_role, 'patient')
  );
  RETURN new;
END;
$$;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();