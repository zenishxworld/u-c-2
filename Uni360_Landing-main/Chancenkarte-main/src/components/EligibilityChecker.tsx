import { useState, useEffect, useRef } from "react";
import { Check, X } from "lucide-react";
import { QuestionStep } from "./QuestionStep";
import { ExpertCTA } from "./ExpertCTA";
import { useWindowSize } from "react-use";
import confetti from 'canvas-confetti';
import { saveEligibilityAnswers } from "@/lib/postgres";

const CanvasConfetti = ({ isActive }) => {
  const animationRef = useRef(null);

  useEffect(() => {
    if (!confetti) return;

    if (isActive) {
      const duration = 1000;
      const end = Date.now() + duration;
      const colors = ['#cf1515ff','#06a924ff', '#3B82F6','#ea39c1ff', '#faf742ff'];

      const frame = () => {
        confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 }, colors, gravity: 1, drift: 1 });
        confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 }, colors, gravity: 1, drift: -1 });
        if (Date.now() < end) animationRef.current = requestAnimationFrame(frame);
      };
      frame();
    } else {
      if (animationRef.current) { cancelAnimationFrame(animationRef.current); animationRef.current = null; }
      if (confetti.reset) confetti.reset();
      const canvas = document.querySelector('canvas');
      if (canvas) { const ctx = canvas.getContext('2d'); if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height); }
    }

    return () => { if (animationRef.current) { cancelAnimationFrame(animationRef.current); animationRef.current = null; } };
  }, [isActive]);

  return null;
};

interface EligibilityCheckerProps {
  hasStarted: () => void;
}

interface Question {
  id: string;
  question: string;
  type: "radio" | "dropdown";
  options: string[];
}

export const EligibilityChecker = ({ hasStarted }: EligibilityCheckerProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showCongratulations, setShowCongratulations] = useState(false);
  const [showExpertCTA, setShowExpertCTA] = useState(false);
  const [isPopupVisible, setIsPopupVisible] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const expertCtaRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (currentStep > 1) hasStarted();
  }, [currentStep]);

  useEffect(() => {
    if (showCongratulations) {
      setIsPopupVisible(true);
      setTimeout(() => setShowConfetti(true), 200);
      setTimeout(() => setShowConfetti(false), 3200);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [showCongratulations]);

  const questions: Question[] = [
    { id: "nationality", question: "What is your nationality?", type: "dropdown", options: [] },
    { id: "residence", question: "Is your country of residence different from your nationality?", type: "radio", options: ["Yes", "No"] },
    { id: "qualification", question: "Do you have a qualification that required at least 2 years to complete?", type: "radio", options: ["Yes, I hold a professional qualification (vocational training)", "Yes, I have a university degree", "Yes, I have an appropriate qualification from a German Chamber of Commerce abroad", "No, I do not have any formal professional qualifications"] },
    { id: "recognition", question: "Did you obtain your qualification in Germany, or is it partially or fully recognized there?", type: "radio", options: ["Yes, I obtained my professional qualification or university degree in Germany", "I don't know", "No, my qualification is not recognized in Germany", "Yes, my qualification is fully recognized in Germany", "Yes, my qualification is partially recognized in Germany"] },
    { id: "german", question: "How well do you speak German?", type: "radio", options: ["Little (A1)", "Adequate (A2)", "Colloquial (B1)", "Fluent or better (B2 and above)", "Not at all"] },
    { id: "english", question: "How well do you speak English?", type: "radio", options: ["Little (A1)", "Adequate (A2)", "Colloquial (B1)", "Fluent or better (B2 and above)", "Not at all"] },
    { id: "age", question: "What is your age?", type: "radio", options: ["Between the age of 18 and 34", "Between the age of 35 and 39", "40 years or older"] },
    { id: "workExperience", question: "Do you possess work experience relevant to your professional qualification or university degree?", type: "radio", options: ["Yes", "No"] },
    { id: "experienceYears", question: "How many years of experience do you have in this field?", type: "radio", options: ["I can provide evidence of at least 5 years of professional experience within the past 7 years", "I can provide evidence of at least 2 years of professional experience within the last 5 years", "I can provide evidence of 2 years or less of professional experience", "No, I do not have any experience"] },
    { id: "bottleneck", question: 'Is your formal qualification in a "bottleneck profession"?', type: "radio", options: ["Natural sciences, mathematics, engineering", "Healthcare", "Educational sector (teacher)", "Information technology", "No"] },
    { id: "residence6months", question: "Have you resided legally in Germany for a continuous period of at least 6 months in the last 5 years?", type: "radio", options: ["Yes, I have resided in Germany for a minimum of 6 months", "No, I have never lived in Germany or have not stayed there for more than 6 months"] },
    { id: "partner", question: "Do you have a partner who also wishes to enter Germany with an opportunity card?", type: "radio", options: ["Yes, I would like to move to Germany with my partner", "No, I will be moving to Germany alone"] },
    { id: "partnerEligible", question: "Is your partner eligible for an opportunity card?", type: "radio", options: ["Yes, my partner's qualifications are fully recognized in Germany", "Yes, my partner has obtained a score of at least 5 points in the points system", "We don't know", "No, my partner does not meet the criteria"] },
    { id: "finances", question: "Do you have sufficient financial resources to secure your livelihood? (At least 13,092 euros per person)", type: "radio", options: ["Yes, I have the financial means", "I do not possess the required amount"] },
    { id: "jobOffer", question: "Do you already have a job offer from an employer in Germany?", type: "radio", options: ["Yes", "No"] },
  ];

  const handleAnswerChange = (answer: string) => {
    setAnswers((prev) => ({ ...prev, [questions[currentStep - 1].id]: answer }));
  };

  const handleNext = async () => {
    if (currentStep < questions.length) {
      const nextStep = currentStep + 1;
      const nextQuestion = questions[nextStep - 1];
      // Skip "partnerEligible" if user said they have no partner
      if (nextQuestion?.id === 'partnerEligible' && answers['partner'] === 'No, I will be moving to Germany alone') {
        setCurrentStep((prev) => prev + 2);
      } else {
        setCurrentStep((prev) => prev + 1);
      }
    } else {
      setIsSubmitting(true);
      // All questions done — save answers to Supabase
      try {
        const id = await saveEligibilityAnswers(answers);
        setSubmissionId(id);
      } catch (err) {
        console.error('Could not save answers, continuing anyway:', err);
      }
      setShowCongratulations(true);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      const prevStep = currentStep - 1;
      const prevQuestion = questions[prevStep - 1];
      // Skip "partnerEligible" when going back if user has no partner
      if (prevQuestion?.id === 'partnerEligible' && answers['partner'] === 'No, I will be moving to Germany alone') {
        setCurrentStep((prev) => prev - 2);
      } else {
        setCurrentStep((prev) => prev - 1);
      }
    }
  };

  const handleCongratulationsClose = () => {
    setShowConfetti(false);
    setIsPopupVisible(false);
    setTimeout(() => {
      setShowCongratulations(false);
      setShowExpertCTA(true);
      setTimeout(() => {
        expertCtaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }, 300);
  };

  const currentQuestion = questions[currentStep - 1];
  const currentAnswer = answers[currentQuestion?.id] || "";
  const canGoNext = currentAnswer !== "";
  const canGoPrevious = currentStep > 1;

  return (
    <>
      <section ref={sectionRef} className="pt-20 pb-12 lg:py-16 bg-gradient-to-br from-cb10 to-pale-mint">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-2xl lg:text-4xl font-satoshi font-bold text-gunmetal mb-4">
              Tell us about you — we'll do the rest.
            </h2>
            <p className="text-mb text-gunmetal/70">
              Answer these questions to check your Chancenkarte eligibility.
            </p>
          </div>

          <QuestionStep
            question={currentQuestion}
            currentAnswer={currentAnswer}
            onAnswerChange={handleAnswerChange}
            onNext={handleNext}
            onPrevious={handlePrevious}
            canGoNext={canGoNext}
            canGoPrevious={canGoPrevious}
            currentStep={currentStep}
            totalSteps={questions.length}
            isSubmitting={isSubmitting}
          />
        </div>
      </section>

      {showExpertCTA && (
        <div ref={expertCtaRef}>
          {/* Pass submissionId so BookingForm can update the same row */}
          <ExpertCTA submissionId={submissionId} />
        </div>
      )}

      <CanvasConfetti isActive={showConfetti} />

      {showCongratulations && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${isPopupVisible ? 'opacity-100' : 'opacity-0'}`}
            onClick={handleCongratulationsClose}
          />
          <div
            className={`relative bg-white rounded-chancenkarte max-w-lg w-full mx-4 shadow-2xl border border-sage-green/20 transition-all duration-300 ${isPopupVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}
          >
            <button
              onClick={handleCongratulationsClose}
              className="absolute right-4 top-4 p-2 hover:bg-gray-100 rounded-full transition-colors duration-200 z-10"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
            <div className="p-8 text-center">
              <div className="mx-auto w-16 h-16 bg-sage-green/10 rounded-full flex items-center justify-center mb-6">
                <Check className="w-8 h-8 text-sage-green/80" />
              </div>
              <h2 className="text-2xl font-satoshi font-bold text-gunmetal mb-4">
                Congratulations! You're likely eligible for the Chancenkarte!
              </h2>
            </div>
          </div>
        </div>
      )}
    </>
  );
};