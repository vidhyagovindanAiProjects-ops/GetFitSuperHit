import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, Zap } from "lucide-react";

const affirmations = [
  "🔥 You're unstoppable!",
  "Each rep brings your next SuperHit closer 💥",
  "Consistency creates champions 🏆",
  "Proud of your focus and grind 💪",
  "Small steps lead to SuperHits 🌟",
  "You're crushing it! Keep going! 💥",
  "That's the spirit! Unstoppable energy! ⚡",
  "Building momentum one rep at a time 🚀",
  "Champions show up every single day 🌟",
  "Your future self is cheering for you! 💪",
];

interface FitnessGoal {
  id: string;
  activity: string;
  target_value: number;
  unit: string;
  deadline_days: number;
  created_at: string;
  goal_source?: string;
  goal_progress: number;
  goal_streak: number;
}

interface FitnessGoalCardProps {
  goal: FitnessGoal;
  userId: string;
  onUpdate: () => void;
}

const FitnessGoalCard = ({ goal, userId, onUpdate }: FitnessGoalCardProps) => {
  const [showLogForm, setShowLogForm] = useState(false);
  const [logValue, setLogValue] = useState("");
  const [isLogging, setIsLogging] = useState(false);
  const [showAffirmation, setShowAffirmation] = useState(false);
  const [currentAffirmation, setCurrentAffirmation] = useState("");
  const [showConfetti, setShowConfetti] = useState(false);

  const progress = goal.goal_progress;
  const percentage = Math.min((progress / goal.target_value) * 100, 100);
  const streak = goal.goal_streak;
  const daysElapsed = Math.floor(
    (new Date().getTime() - new Date(goal.created_at).getTime()) / (1000 * 60 * 60 * 24)
  );
  const daysLeft = Math.max(goal.deadline_days - daysElapsed, 0);

  const handleLogProgress = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLogging(true);

    try {
      const value = parseFloat(logValue);
      if (isNaN(value) || value <= 0) {
        toast.error("Please enter a valid positive number");
        return;
      }

      // Insert progress log
      const { error } = await supabase.from("progress_logs").insert({
        user_id: userId,
        goal_id: goal.id,
        value: value,
      });

      if (error) throw error;

      // Fetch all logs to recalculate total progress
      const { data: allLogs } = await supabase
        .from("progress_logs")
        .select("value, logged_at")
        .eq("goal_id", goal.id)
        .order("logged_at", { ascending: false });

      const totalLogged = allLogs?.reduce((sum, log) => sum + Number(log.value), 0) || 0;
      
      // Calculate streak based on consecutive days
      let newStreak = 0;
      if (allLogs && allLogs.length > 0) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        let currentDate = new Date(today);
        for (const log of allLogs) {
          const logDate = new Date(log.logged_at);
          logDate.setHours(0, 0, 0, 0);
          
          if (logDate.getTime() === currentDate.getTime()) {
            newStreak++;
            currentDate.setDate(currentDate.getDate() - 1);
          } else {
            break;
          }
        }
      }
      
      // Update goal progress and streak in fitness_goals table
      const { error: updateError } = await supabase
        .from("fitness_goals")
        .update({
          goal_progress: totalLogged,
          goal_streak: newStreak,
        })
        .eq("id", goal.id);

      if (updateError) throw updateError;

      // Show random affirmation
      const randomAffirmation = affirmations[Math.floor(Math.random() * affirmations.length)];
      setCurrentAffirmation(randomAffirmation);
      setShowAffirmation(true);
      
      toast.success(`Logged ${value} ${goal.unit}! 🎉`);
      
      // Check if goal completed
      if (totalLogged >= goal.target_value && progress < goal.target_value) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);
      }
      
      setTimeout(() => setShowAffirmation(false), 5000);
      
      setLogValue("");
      setShowLogForm(false);
      onUpdate();
    } catch (error) {
      toast.error("Failed to log progress");
    } finally {
      setIsLogging(false);
    }
  };

  return (
    <Card className="overflow-hidden relative transition-all duration-300 hover:shadow-lg">
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 text-6xl animate-bounce">🎉</div>
          <div className="absolute top-10 left-1/4 text-4xl animate-ping">✨</div>
          <div className="absolute top-10 right-1/4 text-4xl animate-ping" style={{ animationDelay: '0.2s' }}>⭐</div>
        </div>
      )}
      <CardContent className="p-6 space-y-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-2xl font-bold capitalize">{goal.activity}</h3>
            {goal.goal_source === 'AI' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-blue-500/20 to-green-500/20 border border-blue-500/30">
                <Zap className="w-3 h-3 text-blue-600" />
                <span className="text-xs font-semibold text-blue-600">AI</span>
              </span>
            )}
          </div>
          <p className="text-muted-foreground">
            Progress: <span className="font-semibold text-primary">{progress}</span> / {goal.target_value} {goal.unit}
          </p>
        </div>

        <div>
          <div className="flex justify-between mb-2">
            <span className="text-2xl font-bold text-primary">{percentage.toFixed(0)}% Complete</span>
            <span className="text-muted-foreground">{daysLeft} days left</span>
          </div>
          <Progress value={percentage} className="h-3" />
        </div>

        {showAffirmation && (
          <div className="bg-gradient-to-r from-secondary/20 via-primary/20 to-accent/20 border-2 border-primary/40 rounded-lg p-4 animate-scale-in">
            <div className="flex items-center gap-2 justify-center">
              <Sparkles className="w-5 h-5 text-primary animate-pulse" />
              <p className="text-lg font-bold bg-gradient-to-r from-secondary via-primary to-accent bg-clip-text text-transparent">
                {currentAffirmation}
              </p>
            </div>
          </div>
        )}

        {streak > 0 && (
          <div className="bg-gradient-to-r from-warning/20 to-warning/10 border-2 border-warning/30 rounded-lg p-3 text-center">
            <p className="text-lg font-semibold">🔥 {streak} day SuperHit streak!</p>
          </div>
        )}

        {percentage < 100 && (
          <p className="text-sm text-muted-foreground text-center">
            {percentage === 0 ? "🚀 Every journey starts with one step!" : "💪 Keep pushing forward!"}
          </p>
        )}

        {percentage >= 100 && (
          <div className="bg-gradient-to-r from-success/20 to-success/10 border-2 border-success/30 rounded-lg p-4 text-center animate-scale-in">
            <p className="text-2xl font-bold text-success mb-1">🎉 SuperHit Achieved! 🎉</p>
            <p className="text-sm text-muted-foreground">You crushed this goal! 💥</p>
          </div>
        )}

        {!showLogForm ? (
          <Button onClick={() => setShowLogForm(true)} className="w-full" size="lg">
            Log Today's Progress 📝
          </Button>
        ) : (
          <form onSubmit={handleLogProgress} className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="progress-value">Enter {goal.unit}</Label>
              <Input
                id="progress-value"
                type="number"
                step="0.01"
                placeholder={`Enter ${goal.unit}`}
                value={logValue}
                onChange={(e) => setLogValue(e.target.value)}
                required
                disabled={isLogging}
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={isLogging} className="flex-1">
                {isLogging ? "Logging..." : "Log"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowLogForm(false);
                  setLogValue("");
                }}
                disabled={isLogging}
              >
                Cancel
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
};

export default FitnessGoalCard;
