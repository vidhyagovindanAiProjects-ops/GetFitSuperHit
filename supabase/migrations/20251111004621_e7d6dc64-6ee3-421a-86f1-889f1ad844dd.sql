-- Add new columns to fitness_goals table for unified tracking
ALTER TABLE public.fitness_goals 
ADD COLUMN IF NOT EXISTS goal_source text DEFAULT 'Manual',
ADD COLUMN IF NOT EXISTS goal_progress numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS goal_streak integer DEFAULT 0;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_fitness_goals_user_source ON public.fitness_goals(user_id, goal_source);

-- Update existing rows to have default values
UPDATE public.fitness_goals 
SET goal_source = 'Manual', 
    goal_progress = 0, 
    goal_streak = 0 
WHERE goal_source IS NULL;