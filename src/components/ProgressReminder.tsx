import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "lucide-react";

interface ProgressReminderProps {
  hasLoggedToday: boolean;
  streakCount: number;
}

const ProgressReminder = ({ hasLoggedToday, streakCount }: ProgressReminderProps) => {
  if (hasLoggedToday) return null;

  return (
    <Card className="bg-white border-2 border-orange-400 shadow-lg animate-scale-in">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <Calendar className="w-6 h-6 text-orange-500 flex-shrink-0" />
          <div>
            <p className="font-bold text-gray-900 text-lg">
              💥 Keep your SuperHit streak alive!
            </p>
            <p className="text-sm text-gray-700 mt-1">
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
