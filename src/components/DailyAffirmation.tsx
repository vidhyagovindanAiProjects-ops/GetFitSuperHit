import { Card, CardContent } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

const affirmations = [
  "💥 Every rep brings you closer to your SuperHit!",
  "🌟 You're building something incredible today",
  "🔥 Your dedication is your superpower",
  "💪 Champions are made in moments like these",
  "✨ Progress over perfection, always",
  "🚀 You're stronger than you think",
  "⚡ Small wins create massive transformations",
  "🎯 Focus on the journey, not just the destination",
  "💎 You're investing in the best version of yourself",
  "🌈 Every day is a fresh start for greatness",
];

const DailyAffirmation = () => {
  const [affirmation, setAffirmation] = useState("");

  useEffect(() => {
    // Get daily affirmation based on date
    const today = new Date().toDateString();
    const savedDate = localStorage.getItem("affirmationDate");
    const savedAffirmation = localStorage.getItem("dailyAffirmation");

    if (savedDate === today && savedAffirmation) {
      setAffirmation(savedAffirmation);
    } else {
      const randomIndex = Math.floor(Math.random() * affirmations.length);
      const newAffirmation = affirmations[randomIndex];
      setAffirmation(newAffirmation);
      localStorage.setItem("affirmationDate", today);
      localStorage.setItem("dailyAffirmation", newAffirmation);
    }
  }, []);

  return (
    <Card className="bg-gradient-to-r from-secondary/20 via-primary/20 to-accent/20 border-2 border-primary/30 overflow-hidden relative">
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl"></div>
      <CardContent className="p-6 relative">
        <div className="flex items-start gap-3">
          <Sparkles className="w-6 h-6 text-primary mt-1 flex-shrink-0 animate-pulse" />
          <div>
            <h3 className="text-lg font-bold text-foreground mb-2">Today's SuperHit Affirmation</h3>
            <p className="text-xl font-semibold bg-gradient-to-r from-secondary via-primary to-accent bg-clip-text text-transparent">
              {affirmation}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DailyAffirmation;
