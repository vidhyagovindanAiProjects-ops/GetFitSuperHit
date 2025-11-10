import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "lucide-react";

interface ProgressReminderProps {
  hasLoggedToday: boolean;
  streakCount: number;
}

const ProgressReminder = ({ hasLoggedToday, streakCount }: ProgressReminderProps) => {
  if (hasLoggedToday) return null;

  return (
    <Card className="bg-warning/10 border-2 border-warning/30 animate-pulse">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-warning flex-shrink-0" />
          <div>
            <p className="font-semibold text-foreground">
              💥 Keep your SuperHit streak alive!
            </p>
            <p className="text-sm text-muted-foreground">
              {streakCount > 0 
                ? `You're on a ${streakCount}-day streak — don't break it now! 🔥`
                : "Start your journey today — log your first progress! 🚀"
              }
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProgressReminder;
