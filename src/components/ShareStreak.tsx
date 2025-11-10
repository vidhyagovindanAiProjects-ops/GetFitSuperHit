import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";
import { toast } from "sonner";

interface ShareStreakProps {
  streakCount: number;
}

const ShareStreak = ({ streakCount }: ShareStreakProps) => {
  const handleShare = () => {
    const shareMessage = `💪 I'm on a ${streakCount}-day streak with GetFitSuperHit 💥! Join me on this amazing fitness journey! 🚀 ${window.location.origin}`;
    
    navigator.clipboard.writeText(shareMessage).then(() => {
      toast.success("🎉 Share message copied to clipboard!");
    }).catch(() => {
      toast.error("Failed to copy message");
    });
  };

  if (streakCount < 1) return null;

  return (
    <Button
      onClick={handleShare}
      variant="outline"
      className="w-full bg-gradient-to-r from-secondary/10 to-primary/10 border-primary/30 hover:border-primary/50 hover:bg-gradient-to-r hover:from-secondary/20 hover:to-primary/20"
    >
      <Share2 className="w-4 h-4 mr-2" />
      Share My {streakCount}-Day Streak! 🔥
    </Button>
  );
};

export default ShareStreak;
