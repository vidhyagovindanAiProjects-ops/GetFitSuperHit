import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Target, TrendingUp, Award, Users } from "lucide-react";

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary via-primary to-accent">
      <header className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">FitTrack Pro 💪</h1>
          <Button 
            variant="outline" 
            onClick={() => navigate("/auth")}
            className="bg-white/20 text-white border-white/30 hover:bg-white/30"
          >
            Sign In
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Your Fitness Journey<br />Starts Today 🚀
          </h2>
          <p className="text-xl md:text-2xl text-white/90 mb-12 max-w-2xl mx-auto">
            Track your goals, build streaks, and transform your fitness habits. 
            Every rep counts. Every mile matters. Every day is progress.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-20">
            <Button 
              size="lg" 
              onClick={() => navigate("/auth")}
              className="bg-white text-primary hover:bg-white/90 text-lg px-8 py-6 h-auto"
            >
              Get Started Free
              <ArrowRight className="ml-2" />
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => navigate("/auth")}
              className="bg-white/20 text-white border-white/30 hover:bg-white/30 text-lg px-8 py-6 h-auto"
            >
              Learn More
            </Button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <Target className="w-12 h-12 text-white mb-4 mx-auto" />
              <h3 className="text-xl font-bold text-white mb-2">Set Goals</h3>
              <p className="text-white/80">Define your fitness targets and track progress in real-time</p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <TrendingUp className="w-12 h-12 text-white mb-4 mx-auto" />
              <h3 className="text-xl font-bold text-white mb-2">Track Progress</h3>
              <p className="text-white/80">Log workouts and watch your achievements grow daily</p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <Award className="w-12 h-12 text-white mb-4 mx-auto" />
              <h3 className="text-xl font-bold text-white mb-2">Build Streaks</h3>
              <p className="text-white/80">Stay consistent and build unstoppable momentum</p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <Users className="w-12 h-12 text-white mb-4 mx-auto" />
              <h3 className="text-xl font-bold text-white mb-2">Your Journey</h3>
              <p className="text-white/80">Personal dashboard tracking only your progress</p>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 max-w-2xl mx-auto">
            <h3 className="text-3xl font-bold text-white mb-4">💡 Daily Motivation</h3>
            <p className="text-xl text-white/90 mb-6 italic">
              "The only bad workout is the one that didn't happen. Start small, stay consistent, and watch yourself become unstoppable."
            </p>
            <p className="text-lg text-white/80 mb-6">
              Don't wait for the perfect moment. The perfect moment is now. 
              Your future self will thank you for the decision you make today.
            </p>
            <Button 
              size="lg"
              onClick={() => navigate("/auth")}
              className="bg-success text-success-foreground hover:bg-success/90 text-lg px-8 py-6 h-auto"
            >
              Start Your Transformation 🔥
            </Button>
          </div>
        </div>
      </main>

      <footer className="container mx-auto px-4 py-8 text-center text-white/70">
        <p>&copy; 2025 FitTrack Pro. Your fitness, your data, your success.</p>
      </footer>
    </div>
  );
};

export default Landing;
