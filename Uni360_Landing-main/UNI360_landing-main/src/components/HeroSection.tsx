import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import heroCampusGermany from "@/assets/hero-image.webp";
import heroStudentsUK from "@/assets/hero-image1.webp";
import heroVisaSuccess from "@/assets/image7-modified.webp";
// import Quiz from "@/components/Quiz";
// import { HowItWorks } from "@/components/HowItWorks";

interface HeroSectionProps {
  selectedCountries: string[];
  onNavigateToQuiz?: () => void;
  onCountrySelect?: (countries: string[]) => void;
}

// Individual digit slot component for slot machine animation
const DigitSlot = ({ 
  finalDigit, 
  delay = 0, 
  duration = 1200,
  className = "",
  isVisible = false 
}) => {
  const [currentDigit, setCurrentDigit] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isVisible) return;

    const startAnimation = () => {
      setIsAnimating(true);
      let iterations = 0;
      const totalSpins = 8 + Math.floor(Math.random() * 4); // 8-12 spins total

      intervalRef.current = setInterval(() => {
        if (iterations < totalSpins - 1) {
          setCurrentDigit(Math.floor(Math.random() * 10));
        } else {
          setCurrentDigit(parseInt(finalDigit));
          if (intervalRef.current) clearInterval(intervalRef.current);
          setIsAnimating(false);
        }
        iterations++;
      }, duration / totalSpins); // Evenly distribute spins over duration
    };

    timeoutRef.current = setTimeout(startAnimation, delay);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [finalDigit, delay, duration, isVisible]);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div className="transition-all duration-100 ease-in-out">
        {currentDigit}
      </div>
    </div>
  );
};

// Slot machine number component
const SlotMachineNumber = ({ 
  finalNumber,
  delay = 0,
  duration = 1200,
  className = "text-3xl md:text-4xl font-bold text-accent",
  isVisible = false,
  prefix = "",
  suffix = ""
}) => {
  const digits = finalNumber.toString().split('');

  return (
    <div className="flex justify-center items-center">
      {prefix && (
        <span className={className}>{prefix}</span>
      )}
      {digits.map((digit, index) => (
        <DigitSlot
          key={index}
          finalDigit={digit}
          delay={delay + (index * 50)} // Shorter stagger - 50ms between digits
          duration={duration}
          className={className}
          isVisible={isVisible}
        />
      ))}
      {suffix && (
        <span className={className}>{suffix}</span>
      )}
    </div>
  );
};

// Intersection Observer hook
const useInView = (threshold = 0.1) => {
  const [isInView, setIsInView] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
        }
      },
      { threshold }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [threshold]);

  return [ref, isInView];
};

export const HeroSection = ({
  selectedCountries,
  onNavigateToQuiz,
  onCountrySelect,
}: HeroSectionProps) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, string>>({});
  const [userData, setUserData] = useState({ name: "", email: "" });
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Use intersection observer for stats visibility
  const [statsRef, statsVisible] = useInView(0.3);

  const slides = [
    {
      image: heroCampusGermany,
      title: "Your Gateway to World-Class Education",
      subtitle: "Transform your academic dreams into reality",
    },
    {
      image: heroStudentsUK,
      title: "Join Thousands of Successful Students",
      subtitle: "Expert guidance every step of the way",
    },
    {
      image: heroVisaSuccess,
      title: "From Application to Graduation",
      subtitle: "Complete support for your study abroad journey",
    },
  ];

  const stats = [
    { number: 7000, label: "Students Helped", suffix: "+" },
    { number: 100, label: "Partner Universities", suffix: "+" },
    { number: 98, label: "Visa Success Rate", suffix: "%" },
    { number: 12, label: "Years of Experience", prefix: "", suffix: "+" }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const getCountryText = () => {
    if (selectedCountries.length === 2) return "Germany & UK";
    if (selectedCountries.includes("germany")) return "Germany";
    if (selectedCountries.includes("uk")) return "UK";
    return "Germany & UK";
  };

  const handleGetPersonalizedPlan = () => {
    // Navigate to UniversityQuiz page with a flag to auto-open quiz
    window.location.href = "/universities?openQuiz=true";
  };

  const handleStartJourney = () => {
    window.open("https://students.uni360degree.com/", "_blank");
  };

  const handleScrollToHowItWorks = () => {
    const howItWorksSection = document.getElementById("how-it-works");
    if (howItWorksSection) {
      howItWorksSection.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  return (
    <div className="px-4 mt-16 sm:px-6 lg:px-8 pt-8 bg-gray-50 overflow-hidden">
      <section id="home" className="relative min-h-[85vh] flex items-center justify-center overflow-hidden rounded-3xl shadow-2xl">

        {/* Background Carousel */}
        <div className="absolute inset-0 z-0 rounded-3xl overflow-hidden">
          {slides.map((slide, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-opacity duration-1000 ${
                index === currentSlide ? "opacity-100" : "opacity-0"
              }`}
            >
              <img
                src={slide.image}
                alt={`Hero slide ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/45"></div>
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="animate-fade-in-up">
            <h1 className="text-3xl sm:text-hero mt-2 font-bold text-white mb-6 leading-tight">
              Study in {getCountryText()}
              <span className="block text-accent">with UNI 360°</span>
            </h1>

            <p className="text-sm sm:text-xl md:text-2xl lg:text-xl text-white/90 mb-6 max-w-3xl mx-auto leading-relaxed">
              {slides[currentSlide].subtitle} - Your trusted partner for
              studying abroad with end-to-end support from application to
              graduation.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-4">
              
              <Button
                className="btn-hero text-sm md:text-lg px-8 py-6 mb-4 lg:mb-0"
                onClick={handleStartJourney} // ADD THIS LINE
              >
                Start Your Journey
              </Button>
            </div>

            {/* Animated Casino Slot Machine Stats */}
            <div ref={statsRef} className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto mb-4">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="mb-1">
                    <SlotMachineNumber
                      finalNumber={stat.number}
                      delay={index * 100}
                      duration={1500}
                      className="text-2xl md:text-4xl font-bold text-accent"
                      isVisible={statsVisible}
                      prefix={stat.prefix || ""}
                      suffix={stat.suffix || ""}
                    />
                  </div>
                  <div 
                    className={`text-white/80 transition-opacity text-sm lg:text-lg duration-700 delay-[1200ms] ${
                      statsVisible ? 'opacity-100' : 'opacity-0'
                    }`}
                  >
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Slide Indicators */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10 flex space-x-3">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-2 h-2 md:w-3 md:h-3 rounded-full transition-all duration-300 ${
                index === currentSlide
                  ? "bg-accent scale-125"
                  : "bg-white/50 hover:bg-white/75"
              }`}
            />
          ))}
        </div>
      </section>
    </div>
  );
};