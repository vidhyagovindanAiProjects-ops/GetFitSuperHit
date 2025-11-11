import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";
import { Sparkles, Zap, CheckCircle } from "lucide-react";
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

interface GoalSuggestion {
  title: string;
  activity: string;
  target_value: number;
  unit: string;
  deadline_days: number;
  frequency: string;
  motivation: string;
}

const SetGoalForm = ({ userId, userName, onGoalCreated, onCancel }: SetGoalFormProps) => {
  // AI Assistant States
  const [goalDescription, setGoalDescription] = useState("");
  const [fitnessLevel, setFitnessLevel] = useState<string>("beginner");
  const [daysPerWeek, setDaysPerWeek] = useState<string>("3");
  const [isGenerating, setIsGenerating] = useState(false);
  const [suggestions, setSuggestions] = useState<GoalSuggestion[]>([]);
  const [aiSummary, setAiSummary] = useState("");
  const [selectedSuggestion, setSelectedSuggestion] = useState<number | null>(null);
  
  // Manual Entry States
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [activity, setActivity] = useState("");
  const [targetValue, setTargetValue] = useState("");
  const [unit, setUnit] = useState("");
  const [deadlineDays, setDeadlineDays] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const generateSuggestions = async () => {
    if (!goalDescription.trim()) {
      toast.error("Please describe your fitness goal");
      return;
    }

    setIsGenerating(true);
    setSuggestions([]);
    setAiSummary("");

    try {
      const { data, error } = await supabase.functions.invoke("generate-fitness-goal", {
        body: {
          goalDescription,
          fitnessLevel,
          daysPerWeek,
          userName: userName || "Friend",
        },
      });

      if (error) throw error;

      if (data.error) {
        toast.error(data.error);
        return;
      }

      setSuggestions(data.suggestions || []);
      setAiSummary(data.summary || "");
      toast.success("AI suggestions ready! 🌟");
    } catch (error) {
      console.error("Error generating suggestions:", error);
      toast.error("Failed to generate suggestions");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveSuggestion = async (suggestion: GoalSuggestion) => {
    setIsCreating(true);

    try {
      const { error } = await supabase.from("fitness_goals").insert({
        user_id: userId,
        activity: suggestion.activity,
        target_value: suggestion.target_value,
        unit: suggestion.unit,
        deadline_days: suggestion.deadline_days,
      });

      if (error) throw error;

      // Confetti animation
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });

      toast.success("You're investing in the best version of yourself 🌸");
      setTimeout(() => {
        toast.info("Tip 💡: Doing 10 minutes is better than waiting for the perfect hour.");
      }, 1500);
      
      onGoalCreated();
    } catch (error) {
      console.error("Error saving goal:", error);
      toast.error("Failed to save goal");
    } finally {
      setIsCreating(false);
    }
  };

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
      });

      if (error) throw error;

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });

      toast.success("Goal created successfully! 🎯");
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
          <Sparkles className="w-6 h-6 text-primary" />
          AI-Powered Goal Creator 💥
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {!showManualEntry ? (
          <>
            {/* AI Assistant Section */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="goal-description">What's your fitness goal? ✨</Label>
                <Textarea
                  id="goal-description"
                  placeholder="e.g., I want to lose weight, run faster, build strength..."
                  value={goalDescription}
                  onChange={(e) => setGoalDescription(e.target.value)}
                  disabled={isGenerating || suggestions.length > 0}
                  className="min-h-[80px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fitness-level">Fitness Level 💪</Label>
                  <Select value={fitnessLevel} onValueChange={setFitnessLevel} disabled={isGenerating || suggestions.length > 0}>
                    <SelectTrigger id="fitness-level">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="days-per-week">Days per Week 📅</Label>
                  <Select value={daysPerWeek} onValueChange={setDaysPerWeek} disabled={isGenerating || suggestions.length > 0}>
                    <SelectTrigger id="days-per-week">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 day</SelectItem>
                      <SelectItem value="2">2 days</SelectItem>
                      <SelectItem value="3">3 days</SelectItem>
                      <SelectItem value="4">4 days</SelectItem>
                      <SelectItem value="5">5 days</SelectItem>
                      <SelectItem value="6">6 days</SelectItem>
                      <SelectItem value="7">7 days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {isGenerating && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Zap className="w-4 h-4 animate-pulse text-primary" />
                    <span>AI is crafting your perfect fitness plan...</span>
                  </div>
                  <Progress value={66} className="h-2" />
                </div>
              )}

              {suggestions.length === 0 && !isGenerating && (
                <Button
                  onClick={generateSuggestions}
                  disabled={isGenerating}
                  className="w-full bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate SMART Goals with AI
                </Button>
              )}
            </div>

            {/* AI Suggestions */}
            {suggestions.length > 0 && (
              <div className="space-y-4 animate-fade-in">
                {aiSummary && (
                  <div className="p-4 bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg border-2 border-primary/20">
                    <p className="text-lg font-semibold text-foreground">{aiSummary}</p>
                  </div>
                )}

                <div className="space-y-3">
                  {suggestions.map((suggestion, index) => (
                    <Card
                      key={index}
                      className={`cursor-pointer transition-all hover:shadow-lg ${
                        selectedSuggestion === index ? "border-2 border-primary bg-primary/5" : "border"
                      }`}
                      onClick={() => setSelectedSuggestion(index)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 space-y-2">
                            <h4 className="font-bold text-lg">{suggestion.title}</h4>
                            <div className="text-sm text-muted-foreground space-y-1">
                              <p className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                Target: {suggestion.target_value} {suggestion.unit} in {suggestion.deadline_days} days
                              </p>
                              <p className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                Frequency: {suggestion.frequency}
                              </p>
                            </div>
                            <p className="text-sm font-medium text-primary italic">{suggestion.motivation}</p>
                          </div>
                          {selectedSuggestion === index && (
                            <div className="flex-shrink-0">
                              <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                                <CheckCircle className="w-4 h-4 text-primary-foreground" />
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      if (selectedSuggestion !== null) {
                        handleSaveSuggestion(suggestions[selectedSuggestion]);
                      } else {
                        toast.error("Please select a goal first");
                      }
                    }}
                    disabled={isCreating || selectedSuggestion === null}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600"
                  >
                    {isCreating ? "Saving..." : "Save Goal 🎉"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSuggestions([]);
                      setAiSummary("");
                      setSelectedSuggestion(null);
                    }}
                    disabled={isCreating}
                  >
                    Try Again
                  </Button>
                </div>
              </div>
            )}

            {/* Manual Entry Toggle */}
            <div className="text-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowManualEntry(true)}
                className="text-muted-foreground hover:text-foreground"
              >
                Or create goal manually →
              </Button>
            </div>
          </>
        ) : (
          <>
            {/* Manual Entry Form */}
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
                  onClick={() => setShowManualEntry(false)}
                  disabled={isCreating}
                >
                  ← Back to AI
                </Button>
              </div>
            </form>
          </>
        )}

        <Button variant="outline" onClick={onCancel} className="w-full" disabled={isCreating || isGenerating}>
          Cancel
        </Button>
      </CardContent>
    </Card>
  );
};

export default SetGoalForm;
