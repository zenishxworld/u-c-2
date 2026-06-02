import { useOutletContext, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { StatCard } from "@/components/ui/stat-card";
import { ProgressRing } from "@/components/ui/progress-ring";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Send,
  GraduationCap,
  Trophy,
  Target,
  Bot,
  AlertCircle,
  RefreshCw,
  TrendingUp,
  FileText,
  Check,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getProfileProgress, getStudentApplications, getProfileBuilderConfig } from "@/services/studentProfile";
import { useState, useEffect } from "react";

type Country = "DE" | "UK";

interface ContextType {
  selectedCountry: Country;
}

interface Application {
  id?: string;
  status?: string;
  universityName?: string;
  programName?: string;
  targetCourseName?: string;
  submittedAt?: string;
  createdAt?: string;
}

interface RecentApplicationItem {
  type: string;
  title: string;
  subtitle: string;
  time: string;
  status: string;
  priority?: number;
}

interface DashboardData {
  applications: Application[];
}

const getFirstName = (user: Record<string, string> | null): string => {
  if (!user) return "Student";
  if (user.firstName) return user.firstName;
  if (user.fullName) return user.fullName.split(" ")[0];
  if (user.name) return user.name.split(" ")[0];
  if (user.email) return user.email.split("@")[0];
  return "Student";
};

const getApplicationStatusVariant = (status: string): string => {
  const map: Record<string, string> = {
    draft: "warning",
    submitted: "info",
    under_review: "info",
    accepted: "success",
    rejected: "error",
    waitlisted: "warning",
  };
  return map[status] ?? "info";
};

const parseApplications = (response: unknown): Application[] => {
  if (!response || typeof response !== "object") return [];
  const r = response as Record<string, unknown>;
  if (Array.isArray(r?.data?.applications)) return r.data.applications as Application[];
  if (Array.isArray(r?.data)) return r.data as Application[];
  if (Array.isArray(response)) return response as Application[];
  if (Array.isArray(r?.applications)) return r.applications as Application[];
  return [];
};

export default function Dashboard() {
  const { selectedCountry } = useOutletContext<ContextType>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [profileCompletion, setProfileCompletion] = useState(0);
  const [completedStepsCount, setCompletedStepsCount] = useState(0);
  const [totalStepsCount, setTotalStepsCount] = useState(9);
  const [completedStepsList, setCompletedStepsList] = useState<number[]>([]);
  const [stepNames, setStepNames] = useState<string[]>([]);

  const [activeApplications, setActiveApplications] = useState(0);
  const [offersReceived, setOffersReceived] = useState(0);
  const [successRate, setSuccessRate] = useState(0);

  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  useEffect(() => {
    setShowWelcomeModal(true);
  }, []);

  const isProfileComplete = profileCompletion === 100;

  const computeStats = (apps: Application[]) => {
    const active = apps.filter((a) => {
      const s = (a.status ?? "draft").toLowerCase();
      return s !== "rejected" && s !== "withdrawn";
    }).length;

    const offers = apps.filter((a) => {
      const s = (a.status ?? "").toLowerCase();
      return s === "offer" || s === "accepted";
    }).length;

    const submitted = apps.filter(
      (a) => (a.status ?? "draft").toLowerCase() !== "draft"
    ).length;

    const accepted = apps.filter((a) => {
      const s = (a.status ?? "").toLowerCase();
      return s === "accepted" || s === "offer";
    }).length;

    const rate = submitted > 0 ? Math.round((accepted / submitted) * 100) : 0;

    return { active, offers, rate };
  };

  const loadApplications = async () => {
    try {
      const response = await getStudentApplications();
      const apps = parseApplications(response);
      const { active, offers, rate } = computeStats(apps);
      setActiveApplications(active);
      setOffersReceived(offers);
      setSuccessRate(rate);
      setDashboardData({ applications: apps });
    } catch {
      setActiveApplications(0);
      setOffersReceived(0);
      setSuccessRate(0);
    }
  };

  const loadProfileProgress = async () => {
    try {
      const response = await getProfileProgress();
      const data = (response as Record<string, unknown>)?.data ?? response;
      const d = data as Record<string, unknown>;
      const percentage = (d?.percentage as number) ?? 0;
      const completedSteps = (d?.completedSteps as unknown[]) ?? [];
      const total = (d?.total as number) ?? 9;
      setProfileCompletion(percentage);
      setCompletedStepsCount(completedSteps.length);
      setTotalStepsCount(total);
      // Build a list of completed step indices (1-based)
      const completedIndices: number[] = [];
      for (let i = 0; i < completedSteps.length; i++) {
        completedIndices.push(i + 1);
      }
      setCompletedStepsList(completedIndices);

      // Fetch step names from config
      try {
        const configData = await getProfileBuilderConfig();
        const configSteps = configData?.data?.configData?.steps || [];
        const names = configSteps.map((s: { title?: string }) => s.title || 'Step');
        setStepNames(names);
      } catch {
        setStepNames([]);
      }
    } catch {
      setProfileCompletion(0);
      setCompletedStepsCount(0);
      setTotalStepsCount(9);
      setCompletedStepsList([]);
      setStepNames([]);
    }
  };

  useEffect(() => {
    if (!user) return;

    const fetchAll = async () => {
      try {
        setLoading(true);
        setError(null);
        await Promise.all([loadApplications(), loadProfileProgress()]);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to load dashboard data";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const retryFetch = async () => {
    try {
      setLoading(true);
      setError(null);
      await Promise.all([loadApplications(), loadProfileProgress()]);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load dashboard data";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const countryData = {
    DE: {
      greeting: "Guten Tag! Ready for Germany?",
      visaInfo: "Student visa processing: 4–8 weeks",
    },
    UK: {
      greeting: "Hello! Ready for the UK?",
      visaInfo: "Student visa processing: 3–6 weeks",
    },
  };

  const currentData = countryData[selectedCountry];

  const formatRecentApplications = (data: DashboardData | null): RecentApplicationItem[] => {
    const apps = data?.applications ?? [];

    if (apps.length === 0) {
      return [
        {
          type: "info",
          title: "No recent applications",
          subtitle: "Start your first application to see activity here",
          time: "Just now",
          status: "info",
        },
      ];
    }

    const sorted = [...apps].sort((a, b) => {
      const dateA = new Date(a.submittedAt ?? a.createdAt ?? 0).getTime();
      const dateB = new Date(b.submittedAt ?? b.createdAt ?? 0).getTime();
      return dateB - dateA;
    });

    return sorted.slice(0, 3).map((app) => ({
      type: "application",
      title: `Application to ${app.universityName ?? "University"}`,
      subtitle: app.programName ?? app.targetCourseName ?? "Course",
      time: app.submittedAt ? "Recently submitted" : "Draft",
      status: getApplicationStatusVariant((app.status ?? "draft").toLowerCase()),
      priority: 1,
    }));
  };

  const recentApplications = formatRecentApplications(dashboardData);

  return (
    <motion.div
      className="space-y-6 sm:space-y-8 px-3 sm:px-4 md:px-0"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* Welcome Banner */}
      <motion.section
        className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-primary p-4 sm:p-6 md:p-8 lg:p-12 text-white"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div className="absolute inset-0 opacity-20">
          <img
            src="/assets/hero-image.jpg"
            alt="Students studying"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="relative z-10 max-w-2xl">
          <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4">
            Welcome back, {getFirstName(user as Record<string, string> | null)}!
          </h1>
          <p className="text-base sm:text-lg md:text-xl opacity-90 mb-4 sm:mb-6">
            {currentData.greeting}
          </p>
          <span className="text-xs sm:text-sm">Continue your journey to studying abroad</span>
        </div>

        {/* Decorative floating circles */}
        <div className="absolute top-4 sm:top-8 right-4 sm:right-8 w-16 sm:w-24 h-16 sm:h-24 bg-white/10 rounded-full animate-float" />
        <div
          className="absolute bottom-4 sm:bottom-8 right-8 sm:right-16 w-12 sm:w-16 h-12 sm:h-16 bg-white/5 rounded-full animate-float"
          style={{ animationDelay: "1s" }}
        />
      </motion.section>

      {/* Overview Cards */}
      <section
        className={cn(
          "grid gap-3 sm:gap-4 md:gap-6",
          isProfileComplete
            ? "grid-cols-1 sm:grid-cols-3"
            : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
        )}
      >
        {/* Profile Completion Card — hidden once profile is complete */}
        {!isProfileComplete && (
          <motion.div
            className="order-first lg:order-none"
            initial={{ opacity: 1, scale: 1 }}
            animate={{
              opacity: isProfileComplete ? 0 : 1,
              scale: isProfileComplete ? 0.8 : 1,
            }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
          >
            <Card className="p-3 sm:p-4 h-full flex flex-col items-center justify-center text-center min-h-[100px] sm:min-h-[120px] bg-white/70 backdrop-blur-sm border-2 border-gray-200/80 shadow-md hover:shadow-[0_20px_50px_-12px_rgba(224,141,60,0.2)] hover:border-[#E08D3C]/50 transition-all duration-500" style={{ background: "linear-gradient(160deg, #fff7f0 0%, #ffffff 60%, #fae6d1 100%)" }}>
              <ProgressRing progress={profileCompletion} size="md" className="mb-2 sm:mb-3" />
              <h3 className="font-semibold text-xs sm:text-sm mb-1 sm:mb-2">
                Profile {profileCompletion}% Complete
              </h3>
              <p className="text-[10px] sm:text-xs text-muted-foreground mb-2 sm:mb-3 px-1">
                {profileCompletion >= 80
                  ? "Almost there! Complete your profile."
                  : "Complete for better recommendations."}
              </p>
              <Button
                size="sm"
                className="rounded-pill text-[10px] sm:text-xs px-3 py-1.5 sm:px-4 sm:py-2"
                onClick={() => navigate("/profilebuilder")}
              >
                Complete Profile
              </Button>
            </Card>
          </motion.div>
        )}

        {/* Stats Cards */}
        <motion.div
          className={cn(
            "grid gap-3 sm:gap-4 md:gap-6",
            isProfileComplete
              ? "grid-cols-1 sm:grid-cols-3 col-span-full"
              : "grid-cols-1 sm:grid-cols-1 lg:grid-cols-3 col-span-1 sm:col-span-1 lg:col-span-3"
          )}
          layout
          transition={{ duration: 0.6, ease: "easeInOut" }}
        >
          <div className="col-span-1">
            <StatCard
              title="Active Applications"
              value={activeApplications}
              description={`${activeApplications} application${activeApplications !== 1 ? "s" : ""} in progress`}
              icon={Send}
              variant="primary"
              className="animate-slide-in-right h-[140px] sm:h-[160px]"
              onClick={() => navigate("/applications")}
            />
          </div>

          <div className="col-span-1">
            <StatCard
              title="Offers Received"
              value={offersReceived}
              description={offersReceived > 0 ? "Congratulations!" : "Applications under review"}
              icon={Trophy}
              variant="accent"
              className="animate-slide-in-left h-[140px] sm:h-[160px]"
            />
          </div>

          <div className="col-span-1">
            <StatCard
              title="Success Rate"
              value={`${successRate}%`}
              description="Based on your submitted applications"
              icon={Target}
              variant="primary"
              className="animate-slide-in-right h-[140px] sm:h-[160px]"
            />
          </div>
        </motion.div>
      </section>

      {/* Journey Progress */}
      <section>
        <div className="mb-4 sm:mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">
            Your Journey Progress
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            {completedStepsCount} of {totalStepsCount} steps completed — You&apos;re{" "}
            {profileCompletion}% through your profile!
          </p>
        </div>

        <Card className="p-4 sm:p-6 bg-white/70 backdrop-blur-sm border-2 border-gray-200/80 shadow-md hover:shadow-[0_20px_50px_-12px_rgba(224,141,60,0.2)] hover:border-[#E08D3C]/50 transition-all duration-500" style={{ background: "linear-gradient(160deg, #e0f0fa 0%, #ffffff 60%, #f0f7fd 100%)" }}>
          <div className="space-y-5">
            {/* Percentage header */}
            <div className="flex justify-between items-center text-sm">
              <span className="font-semibold text-[#2C3539]">Profile Progress</span>
              <span className="text-sm font-bold text-[#E08D3C]">{profileCompletion}%</span>
            </div>

            {/* Step-based stepper */}
            <div className="relative">
              {/* Steps row */}
              <div className="flex items-center justify-between">
                {Array.from({ length: totalStepsCount }, (_, i) => {
                  const stepNum = i + 1;
                  const isCompleted = stepNum <= completedStepsCount;
                  const isActive = stepNum === completedStepsCount + 1 && !isProfileComplete;
                  return (
                    <div key={stepNum} className="flex items-center flex-1 last:flex-none">
                      {/* Step circle */}
                      <div className="flex flex-col items-center z-10 relative">
                        <div
                          className={cn(
                            "w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold transition-all duration-300 border-2 shadow-sm",
                            isCompleted
                              ? "bg-gradient-to-br from-[#E08D3C] to-[#d07a2a] text-white border-[#E08D3C]/30 shadow-[#E08D3C]/20"
                              : isActive
                              ? "bg-white text-[#E08D3C] border-[#E08D3C] shadow-[#E08D3C]/10 ring-4 ring-[#E08D3C]/10"
                              : "bg-white/80 text-gray-400 border-gray-200 shadow-none"
                          )}
                        >
                          {isCompleted ? (
                            <Check className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={2.5} />
                          ) : (
                            stepNum
                          )}
                        </div>
                        <span
                          className={cn(
                            "text-[8px] sm:text-[10px] mt-1.5 font-medium text-center max-w-[50px] sm:max-w-[70px] leading-tight",
                            isCompleted
                              ? "text-[#E08D3C]"
                              : isActive
                              ? "text-[#2C3539] font-semibold"
                              : "text-gray-400"
                          )}
                        >
                          {stepNames[i] || `Step ${stepNum}`}
                        </span>
                      </div>
                      {/* Connector line */}
                      {stepNum < totalStepsCount && (
                        <div className="flex-1 h-[2px] mx-1 sm:mx-1.5 relative -mt-4">
                          <div className="absolute inset-0 bg-gray-200 rounded-full" />
                          <div
                            className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#E08D3C] to-[#E08D3C]/70 rounded-full transition-all duration-500"
                            style={{ width: isCompleted ? '100%' : '0%' }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {!isProfileComplete && (
              <div className="mt-2 p-3 bg-white/60 backdrop-blur-sm rounded-xl border border-gray-200/60 flex items-center justify-between gap-3">
                <p className="text-xs sm:text-sm text-muted-foreground">
                  <strong className="text-[#2C3539]">{totalStepsCount - completedStepsCount} steps remaining</strong> to complete your profile
                </p>
                <Button
                  size="sm"
                  className="flex-shrink-0 bg-[#2C3539] hover:bg-[#E08D3C] text-white text-xs px-4 transition-colors"
                  onClick={() => navigate("/profilebuilder")}
                >
                  Continue
                </Button>
              </div>
            )}

            {isProfileComplete && (
              <div className="mt-2 p-3 bg-gradient-to-r from-[#E08D3C]/5 to-[#C4DFF0]/10 rounded-xl border border-[#E08D3C]/20 flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#E08D3C] to-[#d07a2a] flex items-center justify-center flex-shrink-0">
                  <Check className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
                </div>
                <p className="text-xs sm:text-sm text-[#2C3539] font-medium">
                  Profile Complete! You can now apply to universities.
                </p>
              </div>
            )}
          </div>
        </Card>
      </section>

      {/* Quick Actions & Recent Applications */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Quick Actions */}
        <Card className="p-4 sm:p-6 bg-white/70 backdrop-blur-sm border-2 border-gray-200/80 shadow-md hover:shadow-[0_20px_50px_-12px_rgba(224,141,60,0.2)] hover:border-[#E08D3C]/50 transition-all duration-500" style={{ background: "linear-gradient(160deg, #e0f0fa 0%, #ffffff 45%, #fae6d1 100%)" }}>
          <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Quick Actions</h3>
          <div className="space-y-2 sm:space-y-3">
            <Button
              className="w-full justify-start rounded-xl h-10 sm:h-12 text-sm sm:text-base"
              variant="outline"
              onClick={() => navigate("/ai-tools")}
            >
              <Bot className="w-4 sm:w-5 h-4 sm:h-5 mr-2 sm:mr-3" />
              AI Tools
            </Button>
            <Button
              className="w-full justify-start rounded-xl h-10 sm:h-12 text-sm sm:text-base"
              variant="outline"
              onClick={() => navigate("/universities")}
            >
              <GraduationCap className="w-4 sm:w-5 h-4 sm:h-5 mr-2 sm:mr-3" />
              Browse Universities
            </Button>
            <Button
              className="w-full justify-start rounded-xl h-10 sm:h-12 text-sm sm:text-base"
              variant="outline"
              onClick={() => navigate("/documents")}
            >
              <FileText className="w-4 sm:w-5 h-4 sm:h-5 mr-2 sm:mr-3" />
              Upload Documents
            </Button>
          </div>

          <div className="mt-6 p-4 rounded-xl bg-white/50 backdrop-blur-md border border-gray-200/60 shadow-sm relative overflow-hidden group hover:border-[#C4DFF0]/60 transition-colors">
            <div className="absolute -right-4 -top-4 w-16 h-16 bg-gradient-to-br from-[#C4DFF0]/20 to-transparent rounded-full" />
            <div className="flex items-start gap-3 relative z-10">
              <div className="p-2 bg-gradient-to-br from-[#C4DFF0]/20 to-[#C4DFF0]/10 rounded-lg shadow-sm border border-[#C4DFF0]/20">
                <TrendingUp className="w-5 h-5 text-[#2C3539]" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-[#2C3539]">Need guidance?</h4>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">Check out our resources to improve your chances of admission.</p>
                <Button variant="link" className="px-0 py-0 h-auto text-xs text-[#E08D3C] mt-2 font-semibold hover:text-[#2C3539]" onClick={() => navigate("/resources")}>
                  Explore Resources →
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Recent Applications */}
        <Card className="p-4 sm:p-6 bg-white/70 backdrop-blur-sm border-2 border-gray-200/80 shadow-md hover:shadow-[0_20px_50px_-12px_rgba(224,141,60,0.2)] hover:border-[#E08D3C]/50 transition-all duration-500" style={{ background: "linear-gradient(160deg, #e0f0fa 0%, #ffffff 60%, #f0f7fd 100%)" }}>
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h3 className="text-lg sm:text-xl font-semibold">Recent Applications</h3>
            {error && (
              <Button
                size="sm"
                variant="outline"
                onClick={retryFetch}
                disabled={loading}
                className="flex items-center gap-2"
              >
                <RefreshCw className={cn("w-3 sm:w-4 h-3 sm:h-4", loading && "animate-spin")} />
                Retry
              </Button>
            )}
          </div>

          {error ? (
            <div className="flex flex-col items-center justify-center py-6 sm:py-8 text-center">
              <AlertCircle className="w-8 sm:w-12 h-8 sm:h-12 text-muted-foreground mb-3 sm:mb-4" />
              <p className="text-xs sm:text-sm text-muted-foreground mb-2">
                Failed to load applications
              </p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">{error}</p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {recentApplications.map((application, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-xl bg-white/80 border border-gray-200/60 shadow-sm hover:shadow-md hover:border-[#C4DFF0]/50 transition-all"
                >
                  <div
                    className={cn(
                      "w-2 h-2 rounded-full mt-2 flex-shrink-0",
                      application.status === "success"
                        ? "bg-green-500"
                        : application.status === "warning"
                        ? "bg-yellow-500"
                        : application.status === "error"
                        ? "bg-red-500"
                        : "bg-blue-500"
                    )}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-xs sm:text-sm">{application.title}</p>
                        {application.subtitle && (
                          <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                            {application.subtitle}
                          </p>
                        )}
                      </div>
                      {application.priority && (
                        <Badge
                          variant={application.priority === 1 ? "default" : "secondary"}
                          className="text-[10px] sm:text-xs flex-shrink-0"
                        >
                          Priority {application.priority}
                        </Badge>
                      )}
                    </div>
                    <p className="text-[10px] sm:text-xs text-muted-foreground mt-2">
                      {application.time}
                    </p>
                  </div>
                </div>
              ))}

              {dashboardData?.applications && dashboardData.applications.length > 3 && (
                <div className="flex justify-end mt-3 sm:mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs px-4"
                  onClick={() => navigate("/applications")}
                >
                  View All Applications
                </Button>
                </div>
              )}
            </div>
          )}
        </Card>
      </section>

      {/* Support Welcome Modal */}
      <Dialog open={showWelcomeModal} onOpenChange={setShowWelcomeModal}>
        <DialogContent className="sm:max-w-md text-center border-orange-200">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center text-[#2C3539]">Welcome to UNI360°!</DialogTitle>
            <DialogDescription className="text-center text-base mt-2">
              We're thrilled to have you here. Our team is dedicated to making your study abroad journey seamless.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-4">
            <div className="w-16 h-16 bg-[#25D366]/10 rounded-full flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" className="w-8 h-8 fill-[#25D366]">
                <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157.1zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7 .9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z" />
              </svg>
            </div>
            <p className="text-sm text-gray-600 mb-4 px-4 leading-relaxed">
              For any support, questions, or guidance, our admin team is always here to help you via WhatsApp!
            </p>
            <Button className="w-auto px-6 py-2.5 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-full shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-2 font-medium" asChild>
              <a href="https://wa.me/918799142717" target="_blank" rel="noopener noreferrer">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" className="w-4 h-4 fill-current mr-2">
                  <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157.1zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7 .9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z" />
                </svg>
                Chat with Support Team
              </a>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Floating WhatsApp Button */}
      <a
        href="https://wa.me/918799142717"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 bg-[#25D366] hover:bg-[#128C7E] text-white p-3 sm:p-4 rounded-full shadow-[0_4px_12px_rgba(37,211,102,0.4)] hover:shadow-[0_6px_16px_rgba(37,211,102,0.6)] hover:-translate-y-1 transition-all duration-300 flex items-center justify-center group"
        aria-label="Contact us on WhatsApp"
        title="Contact Support"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 448 512"
          className="w-7 h-7 sm:w-8 sm:h-8 fill-current"
        >
          <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157.1zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7 .9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z" />
        </svg>
      </a>
    </motion.div>
  );
}