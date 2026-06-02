import React, { useState, useEffect } from "react";
import { ArrowLeft, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Navigation } from "@/components/Navigation";
import AuthPopup, { AuthUtils } from "@/components/AuthPopup";
import { quizAPI, apiUtils } from "@/services/api.js";

interface QuizProps {
  selectedCountries?: string[];
  onCountrySelect?: (countries: string[]) => void;
  onQuizComplete?: (
    answers: Record<number, string>,
    userData: { name: string; email: string }
  ) => void;
  showInline?: boolean;
  onBackToUniversities?: () => void;
  onNavigateToUniversities?: (
    answers: Record<number, string>,
    userData: { name: string; email: string }
  ) => void;
}

const Quiz: React.FC<QuizProps> = ({
  selectedCountries = ["germany", "uk"],
  onCountrySelect,
  onQuizComplete,
  showInline = false,
  onBackToUniversities,
  onNavigateToUniversities,
}) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [showAuthPopup, setShowAuthPopup] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authUser, setAuthUser] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Check authentication status on component mount
  useEffect(() => {
    const user = AuthUtils.getCurrentUser();
    const isAuth = AuthUtils.isAuthenticated();
    
    if (isAuth && user) {
      setIsLoggedIn(true);
      setAuthUser(user);
    } else {
      // Not logged in — show auth popup immediately before quiz can start
      setShowAuthPopup(true);
    }

    // Listen for auth changes from Navbar
    const handleStorageChange = (e) => {
      if (e.key === 'authUser') {
        const user = AuthUtils.getCurrentUser();
        const isAuth = AuthUtils.isAuthenticated();
        
        if (isAuth && user) {
          setIsLoggedIn(true);
          setAuthUser(user);
          setShowAuthPopup(false);
        } else {
          setIsLoggedIn(false);
          setAuthUser(null);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Scroll to top effect
  useEffect(() => {
    if (!showInline) {
      window.scrollTo(0, 0);
    }
  }, [showInline]);

  // ─── Quiz question definitions ────────────────────────────────────────────
  const questions = [
    {
      id: 0,
      questionId: "q1_education_level",
      question: "What is your educational level?",
      options: [
        "Bachelor's (Undergraduate)",
        "Master's (Postgraduate)",
        "PhD (Doctorate)",
        "Diploma/Certificate",
      ],
    },
    {
      id: 1,
      questionId: "q2_field_of_study",
      question: "Which field interests you most?",
      options: [
        "Engineering & Technology",
        "Business & Management",
        "Medicine & Healthcare",
        "Arts & Humanities",
        "Natural Sciences",
        "Social Sciences",
      ],
    },
    {
      id: 2,
      questionId: "q3_budget",
      question: "What's your annual budget (USD)?",
      options: [
        "Under $15,000",
        "$15,000 - $25,000",
        "$25,000 - $40,000",
        "$40,000 - $60,000",
        "Above $60,000",
      ],
    },
    {
      id: 3,
      questionId: "q4_work_while_studying",
      question: "Do you want to work while studying?",
      options: [
        "Yes, part-time during studies",
        "Yes, full-time during breaks",
        "No, I want to focus on studies",
        "Not sure yet",
      ],
    },
    {
      id: 4,
      questionId: "q5_post_study_goals",
      question: "What are your post-study goals?",
      options: [
        "Work in the host country",
        "Return to home country",
        "Start my own business",
        "Pursue further studies",
        "Haven't decided yet",
      ],
    },
  ];

  // ─── Build API-formatted answers array ────────────────────────────────────
  const buildAnswersPayload = (answersMap: Record<number, string>) =>
    questions.map((q) => ({
      questionId: q.questionId,
      answer: answersMap[q.id] ?? "",
    }));

  // ─── Calculate a simple match score (0-100) based on answers ─────────────
  const calculateScore = (answersMap: Record<number, string>): number => {
    const totalQuestions = questions.length;
    const answered = Object.keys(answersMap).length;
    // Base: percentage of questions answered × 100, capped at 100
    return Math.round((answered / totalQuestions) * 100);
  };

  // ─── Submit quiz results to the API ───────────────────────────────────────
  const submitQuizToAPI = async (
    answersMap: Record<number, string>,
    user: any,
    token: string,
    matchedUniversities: Array<{ name: string; matchPercentage: number }> = []
  ) => {
    try {
      setIsSubmitting(true);
      setSubmitError(null);

      const payload = {
        studentId: user?.id ?? user?.studentId ?? null,
        score: calculateScore(answersMap),
        matchedUniversities,
        answers: buildAnswersPayload(answersMap),
      };

      console.log("[Quiz] Submitting quiz payload:", payload);
      const result = await quizAPI.submitQuiz(payload, token);
      console.log("[Quiz] Quiz submitted successfully:", result);
      return result;
    } catch (err: any) {
      console.error("[Quiz] Quiz submission failed:", err);
      // Non-blocking – we still navigate to results even if submission fails
      setSubmitError(err?.message ?? "Failed to save quiz results.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Answer handler ───────────────────────────────────────────────────────
  const handleAnswer = async (answer: string) => {
    // Update answers immediately
    const newAnswers = { ...answers, [currentQuestion]: answer };
    setAnswers(newAnswers);

    console.log("Current question:", currentQuestion);
    console.log("Total questions:", questions.length);
    console.log("New answers:", newAnswers);

    setTimeout(async () => {
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
      } else {
        // Quiz completed - check if user is already authenticated
        console.log("Quiz completed!");

        if (isLoggedIn && authUser) {
          // User is already signed in — submit quiz then navigate
          console.log("User already authenticated, submitting quiz and navigating...");

          // Pass the full authUser object so downstream handlers have the numeric id.
          const userData = {
            ...authUser,
            name: authUser.name || authUser.email,
            email: authUser.email,
          };

          if (onNavigateToUniversities) {
            // UniversityQuiz.handleNavigateToUniversities handles submission — don't double-submit here.
            onNavigateToUniversities(newAnswers, userData);
          } else {
            // No upstream handler — submit here then complete.
            const token = apiUtils.getAuthToken();
            if (token) {
              
            }
            if (onQuizComplete) {
              onQuizComplete(newAnswers, userData);
            }
          }
        } else {
          // Fallback: should not reach here since auth is required upfront
          console.log("User not authenticated, showing auth popup...");
          setShowAuthPopup(true);
        }
      }
    }, 300);
  };

  // Handle authentication success from AuthPopup
  const handleAuthSuccess = async (userData: { name: string; email: string; id?: number; token?: string }) => {
    console.log("Auth success:", userData);
    setIsLoggedIn(true);
    setAuthUser(userData);
    setShowAuthPopup(false);
    // Just close popup and let user take the quiz.
    // Navigation/submission happens in handleAnswer when last question is answered.
  };

  const progress = ((currentQuestion + 1) / questions.length) * 100;

  // Quiz Content
  const QuizContent = () => (
    <div className="max-w-2xl mx-auto px-3 xs:px-4 sm:px-6 lg:px-8 py-4 xs:py-6 sm:py-8">

      {/* Submitting overlay */}
      {isSubmitting && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-6 shadow-2xl flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-[#E08D3C]" />
            <p className="text-[#2C3539] font-medium">Saving your results…</p>
          </div>
        </div>
      )}

      {/* Non-blocking submit error banner */}
      {submitError && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-center justify-between">
          <span>⚠️ {submitError}</span>
          <button
            onClick={() => setSubmitError(null)}
            className="ml-3 text-red-500 hover:text-red-700 font-bold"
          >
            ✕
          </button>
        </div>
      )}
      {/* Hero Section */}
      <div className="text-center mb-8 xs:mb-10 sm:mb-12">
        <img src="/Uni360 logo.png" alt="UNI360°" className="h-12 xs:h-14 sm:h-16 w-12 xs:w-14 sm:w-16 object-contain mx-auto mb-4 xs:mb-5 sm:mb-6" />
        <h1 className="text-2xl xs:text-3xl sm:text-4xl font-bold text-[#2C3539] mb-3 xs:mb-4 leading-tight">
          Find Your Perfect University Match
        </h1>
        <p className="text-gray-600 text-sm xs:text-base sm:text-lg leading-relaxed">
          Answer a few questions to get personalized university recommendations
          for Germany and the UK
        </p>
      </div>

      {/* Progress */}
      <div className="mb-6 xs:mb-7 sm:mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs xs:text-sm text-[#2C3539] font-medium">
            Question {currentQuestion + 1} of {questions.length}
          </span>
          <span className="text-xs xs:text-sm text-[#2C3539] font-medium">
            {Math.round(progress)}% Complete
          </span>
        </div>
        <Progress value={progress} className="h-2 xs:h-3 bg-gray-200" />
      </div>

      {/* Question */}
      <Card className="p-4 xs:p-6 sm:p-8 shadow-lg border border-gray-200 bg-white rounded-2xl">
        <h2 className="text-lg xs:text-xl sm:text-2xl font-bold text-center mb-6 xs:mb-7 sm:mb-8 text-[#2C3539] leading-tight">
          {questions[currentQuestion].question}
        </h2>

        <div className="space-y-3 xs:space-y-4">
          {questions[currentQuestion].options.map((option, index) => (
            <Button
              key={index}
              variant="outline"
              className="w-full p-4 xs:p-5 sm:p-6 text-left justify-start hover:bg-gray-50 hover:border-[#E08D3C] hover:text-[#E08D3C] transition-all duration-200 group border-2 border-gray-200 rounded-xl font-medium text-gray-700 text-sm xs:text-base"
              onClick={() => handleAnswer(option)}
            >
              <span className="flex-1 text-left leading-relaxed">{option}</span>
              <ChevronRight className="h-4 xs:h-5 w-4 xs:w-5 ml-2 group-hover:translate-x-1 transition-transform duration-200 flex-shrink-0" />
            </Button>
          ))}
        </div>
      </Card>

      {/* Question Navigation */}
      <div className="flex justify-center mt-6 xs:mt-7 sm:mt-8">
        <div className="flex space-x-2">
          {questions.map((_, index) => (
            <div
              key={index}
              className={`w-2.5 xs:w-3 h-2.5 xs:h-3 rounded-full transition-colors duration-200 ${
                index <= currentQuestion ? "bg-[#E08D3C]" : "bg-gray-300"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Back Button */}
      {onBackToUniversities && (
        <div className="text-center mt-6 xs:mt-7 sm:mt-8">
          {/* Button commented out in original */}
        </div>
      )}

      {/* Auth Status Debug Info */}
      
    </div>
  );

  // If inline mode, return just the quiz content
  if (showInline) {
    return (
      <div className="min-h-screen bg-gray-50">
        <QuizContent />

        {/* Auth Popup - Only show when needed and user is not authenticated */}
        {showAuthPopup && !isLoggedIn && (
          <AuthPopup
            isOpen={showAuthPopup}
            onClose={() => {
              console.log("Closing auth popup");
              setShowAuthPopup(false);
            }}
            onAuthSuccess={handleAuthSuccess}
            googleClientId="your-google-client-id" // Replace with your actual Google Client ID
          />
        )}
      </div>
    );
  }

  // Full page mode with navigation
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation
        selectedCountries={selectedCountries}
        onCountrySelect={onCountrySelect}
      />

      <QuizContent />

      {/* Auth Popup - Only show when needed and user is not authenticated */}
      {showAuthPopup && !isLoggedIn && (
        <AuthPopup
          isOpen={showAuthPopup}
          onClose={() => {
            console.log("Closing auth popup");
            setShowAuthPopup(false);
          }}
          onAuthSuccess={handleAuthSuccess}
          googleClientId="your-google-client-id" // Replace with your actual Google Client ID
        />
      )}
    </div>
  );
};

export default Quiz;