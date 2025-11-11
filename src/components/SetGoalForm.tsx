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
  const [isCreating, setIsCreating] = useState(false);

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      const validatedData = goalSchema.parse({
        activity: activity.toLowerCase(),
        target_value: parseFloat(targetValue),
        unit: unit.toLowerCase(),
        deadline_days: parseInt(deadlineDays),
      });

      const { error } = await supabase.from("fitness_goals").insert({
        user_id: userId,
        activity: validatedData.activity,
        target_value: validatedData.target_value,
        unit: validatedData.unit,
        deadline_days: validatedData.deadline_days,
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
