import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";
import { Target } from "lucide-react";
import confetti from "canvas-confetti";

const goalSchema = z.object({
  activity: z.string().trim().min(1, { message: "Activity name is required" }).max(100),
  target_value: z.number().positive({ message: "Target must be a positive number" }),
  unit: z.string().trim().min(1, { message: "Unit is required" }).max(50),
  deadline_days: z.number().int().positive({ message: "Days must be a positive number" }).max(365),
  days_per_week: z.number().int().min(1, { message: "At least 1 day per week" }).max(7, { message: "Maximum 7 days per week" }),
});

interface SetGoalFormProps {
  userId: string;
  userName?: string;
  onGoalCreated: () => void;
  onCancel: () => void;
}

const SetGoalForm = ({ userId, onGoalCreated, onCancel }: SetGoalFormProps) => {
  const [activity, setActivity] = useState("");
  const [targetValue, setTargetValue] = useState("");
  const [unit, setUnit] = useState("");
  const [deadlineDays, setDeadlineDays] = useState("");
  const [daysPerWeek, setDaysPerWeek] = useState("3");
  const [isCreating, setIsCreating] = useState(false);

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isCreating) return; // Prevent duplicate submissions
    
    setIsCreating(true);

    try {
      const validatedData = goalSchema.parse({
        activity: activity.toLowerCase(),
        target_value: parseFloat(targetValue),
        unit: unit.toLowerCase(),
        deadline_days: parseInt(deadlineDays),
        days_per_week: parseInt(daysPerWeek),
      });

      // Prevent duplicates: check if a goal with same activity + unit already exists for this user
      const { data: existing, error: existingError } = await supabase
        .from("fitness_goals")
        .select("id")
        .eq("user_id", userId)
        .eq("activity", validatedData.activity)
        .eq("unit", validatedData.unit)
        .limit(1);

      if (existingError) throw existingError;
      if (existing && existing.length > 0) {
        toast.error("You already have a goal for this activity and unit. Please log progress on it or use a different name.");
        return;
      }

      const { error } = await supabase.from("fitness_goals").insert({
        user_id: userId,
        activity: validatedData.activity,
        target_value: validatedData.target_value,
        unit: validatedData.unit,
        deadline_days: validatedData.deadline_days,
        days_per_week: validatedData.days_per_week,
        goal_source: 'Manual',
        goal_progress: 0,
        goal_streak: 0,
      });

      if (error) throw error;

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });

      toast.success("🎯 Goal created successfully!");
      
      // Clear form fields
      setActivity("");
      setTargetValue("");
      setUnit("");
      setDeadlineDays("");
      setDaysPerWeek("3");
      
      onGoalCreated();
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error("Failed to create goal");
      }
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="w-6 h-6 text-primary" />
          Create Your Fitness Goal 🎯
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleManualSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="activity">Activity</Label>
            <Input
              id="activity"
              placeholder="e.g., running, cycling, swimming"
              value={activity}
              onChange={(e) => setActivity(e.target.value)}
              required
              disabled={isCreating}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="target">Target</Label>
              <Input
                id="target"
                type="number"
                step="0.01"
                placeholder="10"
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                required
                disabled={isCreating}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit">Unit</Label>
              <Input
                id="unit"
                placeholder="miles, km, hours"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                required
                disabled={isCreating}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="deadline">Deadline (days)</Label>
            <Input
              id="deadline"
              type="number"
              placeholder="30"
              value={deadlineDays}
              onChange={(e) => setDeadlineDays(e.target.value)}
              required
              disabled={isCreating}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="daysPerWeek">Days per Week 📅</Label>
            <Input
              id="daysPerWeek"
              type="number"
              min="1"
              max="7"
              placeholder="3"
              value={daysPerWeek}
              onChange={(e) => setDaysPerWeek(e.target.value)}
              required
              disabled={isCreating}
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit" className="flex-1" disabled={isCreating}>
              {isCreating ? "Creating..." : "Create Goal"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isCreating}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default SetGoalForm;
