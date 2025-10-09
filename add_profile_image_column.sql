-- Add profile_image_url column to users table if it doesn't exist
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS profile_image_url TEXT;

-- Add profile_image_url column to lawyers table if it doesn't exist  
ALTER TABLE public.lawyers 
ADD COLUMN IF NOT EXISTS profile_image_url TEXT;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_users_profile_image_url ON public.users(profile_image_url);
CREATE INDEX IF NOT EXISTS idx_lawyers_profile_image_url ON public.lawyers(profile_image_url);
