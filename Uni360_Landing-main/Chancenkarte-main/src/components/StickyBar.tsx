import { useState, useEffect } from "react";
import { ArrowUp } from "lucide-react";

interface StickyBarProps {
  onCheckEligibility: () => void;
  isQuizStarted?: boolean;
}

export const StickyBar = ({
  onCheckEligibility,
  isQuizStarted,
}: StickyBarProps) => {
  const [isVisible, setIsVisible] = useState(false);
  let handleScroll: () => void;

  useEffect(() => {
    if (isQuizStarted) {
      setIsVisible(false);
    }

    if (isQuizStarted === false) {
      handleScroll = () => {
        // Show sticky bar after scrolling past hero section
        const scrollPosition = window.scrollY;
        const triggerHeight = window.innerHeight * 0.8;
        setIsVisible(scrollPosition > triggerHeight);
      };

      window.addEventListener("scroll", handleScroll);
    }
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isQuizStarted]);

  // Don't show sticky bar if quiz is active or not visible
  if (!isVisible) return null;

  return (
  <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-t border-sage-green/20 shadow-xl animate-fade-in-up">
    <div className="container mx-auto px-4 sm:px-6 lg:px-4 py-3 sm:py-4">
      <div className="flex items-center justify-between gap-3 sm:gap-4">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gunmetal text-sm sm:text-base">
            Ready? Check your eligibility now
          </p>
          <p className="text-xs sm:text-sm text-gunmetal/60">
            Takes less than 2 minutes
          </p>
        </div>

        <button
          onClick={() => {
            window.history.pushState(null, '', '#eligibility-checker');
            onCheckEligibility();
          }}
          className="bg-tigers-eye hover:bg-tigers-eye/90 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-chancenkarte font-semibold transition-all duration-300 hover:scale-105 flex items-center gap-2 whitespace-nowrap text-sm sm:text-base flex-shrink-0">
          <ArrowUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span className="hidden xs:inline">Start Eligibility Quiz</span>
          <span className="xs:hidden">Start Eligibility Quiz</span>
        </button>
      </div>
    </div>
  </div>
);
};