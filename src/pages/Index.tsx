import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session, User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import FitnessGoalCard from "@/components/FitnessGoalCard";
import SetGoalForm from "@/components/SetGoalForm";
import DailyAffirmation from "@/components/DailyAffirmation";
import ProgressReminder from "@/components/ProgressReminder";
import ShareStreak from "@/components/ShareStreak";

interface Profile {
  id: string;
  username: string | null;
}

interface FitnessGoal {
  id: string;
  activity: string;
  target_value: number;
  unit: string;
  deadline_days: number;
  created_at: string;
  total_progress?: number;
  streak?: number;
  goal_source?: string;
  goal_progress?: number;
  goal_streak?: number;
}

const Index = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [goals, setGoals] = useState<FitnessGoal[]>([]);
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/");
    }
  }, [user, isLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchGoals();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (data) {
      setProfile(data);
    }
  };

  const fetchGoals = async () => {
    if (!user) return;

    const { data: goalsData } = await supabase
      .from("fitness_goals")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (goalsData) {
      const goalsWithProgress = await Promise.all(
        goalsData.map(async (goal) => {
          const { data: logs } = await supabase
            .from("progress_logs")
            .select("value, logged_at")
            .eq("goal_id", goal.id)
            .order("logged_at", { ascending: false });

          const total_progress = logs?.reduce((sum, log) => sum + Number(log.value), 0) || 0;

          let streak = 0;
          if (logs && logs.length > 0) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            let currentDate = new Date(today);
            for (const log of logs) {
              const logDate = new Date(log.logged_at);
              logDate.setHours(0, 0, 0, 0);
              
              if (logDate.getTime() === currentDate.getTime()) {
                streak++;
                currentDate.setDate(currentDate.getDate() - 1);
              } else {
                break;
              }
            }
          }

          return {
            ...goal,
            total_progress,
            streak,
          };
        })
      );

      setGoals(goalsWithProgress);
    }
  };

  const handleSignOut = async () => {
    toast.success("You crushed it today — see you for your next SuperHit! 💪", {
      duration: 2000,
    });
    setTimeout(async () => {
      await supabase.auth.signOut();
      navigate("/");
    }, 500);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-secondary via-primary to-accent">
        <div className="text-2xl font-bold text-white">Loading...</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary via-primary to-accent">
      <header className="bg-white/10 backdrop-blur-sm border-b border-white/20">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-white">GetFitSuperHit 💥</h1>
          <Button variant="outline" onClick={handleSignOut} className="bg-white/20 text-white border-white/30 hover:bg-white/30">
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <DailyAffirmation />
          
          <ProgressReminder 
            hasLoggedToday={goals.some(g => {
              const today = new Date().toDateString();
              return g.streak && g.streak > 0;
            })}
            streakCount={Math.max(...goals.map(g => g.streak || 0), 0)}
          />
          
          {goals.length > 0 && (
            <ShareStreak streakCount={Math.max(...goals.map(g => g.streak || 0), 0)} />
          )}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-6">
            <div className="p-6 text-center border-b bg-gradient-to-r from-secondary/10 via-primary/10 to-accent/10">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-secondary via-primary to-accent bg-clip-text text-transparent">
                Hi {user.user_metadata?.name || profile?.username || "Champion"}! 👋
              </h2>
              <p className="text-muted-foreground mt-2">Welcome back to GetFitSuperHit 💥!</p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 rounded-none">
                <TabsTrigger value="dashboard">📊 Dashboard</TabsTrigger>
                <TabsTrigger value="goal">🎯 Set Goal</TabsTrigger>
                <TabsTrigger value="progress">✏️ Log Progress</TabsTrigger>
              </TabsList>

              <TabsContent value="dashboard" className="p-6 space-y-4">
                {goals.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-xl text-muted-foreground mb-4">No goals yet!</p>
                    <p className="text-muted-foreground mb-6">Create your first fitness goal to get started 🚀</p>
                    <Button onClick={() => {
                      setShowGoalForm(true);
                      setActiveTab("goal");
                    }} size="lg">
                      Create Your First Goal
                    </Button>
                  </div>
                ) : (
                  goals.map((goal) => (
                    <FitnessGoalCard key={goal.id} goal={goal} userId={user.id} onUpdate={fetchGoals} />
                  ))
                )}
              </TabsContent>

              <TabsContent value="goal" className="p-6">
                {!showGoalForm ? (
                  <div className="text-center py-12">
                    <Button onClick={() => setShowGoalForm(true)} size="lg">
                      Create New Goal 🎯
                    </Button>
                  </div>
                ) : (
                  <SetGoalForm
                    userId={user.id}
                    userName={profile?.username}
                    onGoalCreated={() => {
                      setShowGoalForm(false);
                      fetchGoals();
                    }}
                    onCancel={() => setShowGoalForm(false)}
                  />
                )}
              </TabsContent>

              <TabsContent value="progress" className="p-6">
                {goals.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">Create a goal first to start logging progress!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {goals.map((goal) => (
                      <FitnessGoalCard key={goal.id} goal={goal} userId={user.id} onUpdate={fetchGoals} />
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
