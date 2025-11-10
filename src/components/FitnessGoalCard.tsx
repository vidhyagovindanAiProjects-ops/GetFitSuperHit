import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface FitnessGoal {
  id: string;
  activity: string;
  target_value: number;
  unit: string;
  deadline_days: number;
  created_at: string;
  total_progress?: number;
  streak?: number;
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

  const progress = goal.total_progress || 0;
  const percentage = Math.min((progress / goal.target_value) * 100, 100);
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

      const { error } = await supabase.from("progress_logs").insert({
        user_id: userId,
        goal_id: goal.id,
        value: value,
      });

      if (error) throw error;

      toast.success(`Logged ${value} ${goal.unit}! 🎉`);
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
    <Card className="overflow-hidden">
      <CardContent className="p-6 space-y-4">
        <div>
          <h3 className="text-2xl font-bold capitalize">{goal.activity}</h3>
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

        {goal.streak !== undefined && (
          <div className="bg-warning/10 border border-warning/20 rounded-lg p-3 text-center">
            <p className="text-lg font-semibold">🔥 {goal.streak} day streak</p>
          </div>
        )}

        {percentage < 100 && (
          <p className="text-sm text-muted-foreground text-center">
            {percentage === 0 ? "🚀 Every journey starts with one step!" : "💪 Keep pushing forward!"}
          </p>
        )}

        {percentage >= 100 && (
          <div className="bg-success/10 border border-success/20 rounded-lg p-3 text-center">
            <p className="text-lg font-semibold text-success">🎉 Goal Completed!</p>
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
