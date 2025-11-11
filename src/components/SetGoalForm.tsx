import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";
import { Target, Sparkles, Edit3, Loader2 } from "lucide-react";
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

interface AISuggestion {
  activity: string;
  target_value: number;
  unit: string;
  deadline_days: number;
  days_per_week: number;
  title: string;
  motivation: string;
}

const SetGoalForm = ({ userId, userName, onGoalCreated, onCancel }: SetGoalFormProps) => {
  // Mode state
  const [mode, setMode] = useState<'ai' | 'manual'>('ai');
  
  // Manual form states
  const [activity, setActivity] = useState("");
  const [targetValue, setTargetValue] = useState("");
  const [unit, setUnit] = useState("");
  const [deadlineDays, setDeadlineDays] = useState("");
  const [daysPerWeek, setDaysPerWeek] = useState("3");
  const [isCreating, setIsCreating] = useState(false);

  // AI form states
  const [goalDescription, setGoalDescription] = useState("");
  const [fitnessLevel, setFitnessLevel] = useState("intermediate");
  const [aiDaysPerWeek, setAiDaysPerWeek] = useState("3");
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestion[]>([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState<number | null>(null);

  const handleGenerateAI = async () => {
    if (!goalDescription.trim()) {
      toast.error("Please describe your fitness goal");
      return;
    }

    setIsGenerating(true);
    setAiSuggestions([]);
    setSelectedSuggestion(null);

    try {
      const { data, error } = await supabase.functions.invoke('generate-fitness-goal', {
        body: {
          goalDescription: goalDescription.trim(),
          fitnessLevel,
          daysPerWeek: parseInt(aiDaysPerWeek),
          userName: userName || 'there'
        }
      });

      if (error) {
        if (error.message.includes('429')) {
          toast.error("⏱️ Too many requests. Please wait a moment and try again, or use manual mode.");
        } else if (error.message.includes('402')) {
          toast.error("💳 AI credits needed. Please use manual mode for now.");
        } else {
          throw error;
        }
        return;
      }

      if (data?.suggestions && Array.isArray(data.suggestions) && data.suggestions.length > 0) {
        setAiSuggestions(data.suggestions);
        toast.success("🎯 AI generated 3 goal suggestions for you!");
      } else {
        toast.error("AI returned invalid suggestions. Please try manual mode.");
      }
    } catch (error) {
      console.error('AI generation error:', error);
      toast.error("Failed to generate AI suggestions. Please try manual mode.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectSuggestion = (index: number) => {
    setSelectedSuggestion(index);
    const suggestion = aiSuggestions[index];
    // Populate manual form fields with AI suggestion
    setActivity(suggestion.activity);
    setTargetValue(suggestion.target_value.toString());
    setUnit(suggestion.unit);
    setDeadlineDays(suggestion.deadline_days.toString());
    setDaysPerWeek(suggestion.days_per_week.toString());
  };

  const handleCreateAIGoal = async () => {
    if (selectedSuggestion === null) {
      toast.error("Please select a goal suggestion");
      return;
    }

    const suggestion = aiSuggestions[selectedSuggestion];
    
    if (isCreating) return;
    setIsCreating(true);

    try {
      const validatedData = goalSchema.parse({
        activity: suggestion.activity.toLowerCase(),
        target_value: suggestion.target_value,
        unit: suggestion.unit.toLowerCase(),
        deadline_days: suggestion.deadline_days,
        days_per_week: suggestion.days_per_week,
      });

      // Check for duplicates
      const { data: existing, error: existingError } = await supabase
        .from("fitness_goals")
        .select("id")
        .eq("user_id", userId)
        .eq("activity", validatedData.activity)
        .eq("unit", validatedData.unit)
        .limit(1);

      if (existingError) throw existingError;
      if (existing && existing.length > 0) {
        toast.error(`⚠️ You already have a ${validatedData.activity} goal in ${validatedData.unit}. Please log progress on your existing goal or delete it first.`);
        return;
      }

      const { error } = await supabase.from("fitness_goals").insert({
        user_id: userId,
        activity: validatedData.activity,
        target_value: validatedData.target_value,
        unit: validatedData.unit,
        deadline_days: validatedData.deadline_days,
        days_per_week: validatedData.days_per_week,
        goal_source: 'AI',
        goal_progress: 0,
        goal_streak: 0,
      });

      if (error) throw error;

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });

      toast.success("🎯 AI goal created successfully!");
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
        toast.error(`⚠️ You already have a ${validatedData.activity} goal in ${validatedData.unit}. Please log progress on your existing goal or delete it first.`);
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
      <CardContent className="space-y-6">
        {/* Mode Toggle */}
        <div className="flex gap-2 p-1 bg-muted rounded-lg">
          <Button
            type="button"
            variant={mode === 'ai' ? 'default' : 'ghost'}
            className="flex-1"
            onClick={() => setMode('ai')}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            AI Assistant
          </Button>
          <Button
            type="button"
            variant={mode === 'manual' ? 'default' : 'ghost'}
            className="flex-1"
            onClick={() => setMode('manual')}
          >
            <Edit3 className="w-4 h-4 mr-2" />
            Manual Entry
          </Button>
        </div>

        {/* AI Mode */}
        {mode === 'ai' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="goalDescription">Describe Your Fitness Goal</Label>
              <Textarea
                id="goalDescription"
                placeholder="e.g., I want to start running and build up my endurance, or I want to lose weight by cycling regularly"
                value={goalDescription}
                onChange={(e) => setGoalDescription(e.target.value)}
                disabled={isGenerating}
                className="min-h-[100px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fitnessLevel">Fitness Level</Label>
                <select
                  id="fitnessLevel"
                  value={fitnessLevel}
                  onChange={(e) => setFitnessLevel(e.target.value)}
                  disabled={isGenerating}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="aiDaysPerWeek">Days per Week</Label>
                <Input
                  id="aiDaysPerWeek"
                  type="number"
                  min="1"
                  max="7"
                  value={aiDaysPerWeek}
                  onChange={(e) => setAiDaysPerWeek(e.target.value)}
                  disabled={isGenerating}
                />
              </div>
            </div>

            <Button
              type="button"
              onClick={handleGenerateAI}
              disabled={isGenerating || !goalDescription.trim()}
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating Ideas...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Goal Ideas
                </>
              )}
            </Button>

            {/* AI Suggestions */}
            {aiSuggestions.length > 0 && (
              <div className="space-y-4">
                <Label>Choose a Goal Suggestion:</Label>
                <div className="grid gap-4 md:grid-cols-3">
                  {aiSuggestions.map((suggestion, index) => (
                    <Card
                      key={index}
                      className={`cursor-pointer transition-all hover:shadow-lg ${
                        selectedSuggestion === index
                          ? 'ring-2 ring-primary shadow-lg shadow-primary/20'
                          : 'hover:ring-1 hover:ring-primary/50'
                      }`}
                      onClick={() => handleSelectSuggestion(index)}
                    >
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">{suggestion.title}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        <p className="font-medium text-primary">
                          {suggestion.target_value} {suggestion.unit}
                        </p>
                        <p className="text-muted-foreground">
                          📅 {suggestion.deadline_days} days ({suggestion.days_per_week}x/week)
                        </p>
                        <p className="text-xs italic text-muted-foreground">
                          "{suggestion.motivation}"
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <Button
                  type="button"
                  onClick={handleCreateAIGoal}
                  disabled={selectedSuggestion === null || isCreating}
                  className="w-full"
                >
                  {isCreating ? "Creating..." : "Create This Goal ✨"}
                </Button>
              </div>
            )}

            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isGenerating || isCreating}
              className="w-full"
            >
              Cancel
            </Button>
          </div>
        )}

        {/* Manual Mode */}
        {mode === 'manual' && (
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
        )}
      </CardContent>
    </Card>
  );
};

export default SetGoalForm;
