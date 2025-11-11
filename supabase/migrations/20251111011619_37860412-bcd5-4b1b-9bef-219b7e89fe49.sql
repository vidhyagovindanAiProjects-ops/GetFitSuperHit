-- Add days_per_week column to fitness_goals table
ALTER TABLE public.fitness_goals 
ADD COLUMN IF NOT EXISTS days_per_week INTEGER DEFAULT 3 CHECK (days_per_week >= 1 AND days_per_week <= 7);