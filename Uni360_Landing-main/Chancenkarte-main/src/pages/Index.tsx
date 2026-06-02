import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { Hero } from "@/components/Hero";
import { Advantages } from "@/components/Advantages";
import About from "@/components/About";
import { EligibilityChecker } from "@/components/EligibilityChecker";
import { ExpertCTA } from "@/components/ExpertCTA";
import { Testimonials } from "@/components/Testimonials";
import FAQ from "@/components/FAQ";
import { Footer } from "@/components/Footer";
import { StickyBar } from "@/components/StickyBar";
import { Uni360Popup } from "@/components/Uni360Popup";

const Index = () => {
  const [eligibilityScore, setEligibilityScore] = useState(0);
  const [isEligible, setIsEligible] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    // User is eligible if they meet at least 4 out of 5 criteria
    const eligible = eligibilityScore >= 4;
    setIsEligible(eligible);
  }, [eligibilityScore]);

  // Global scroll spy observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.id;
            if (id && window.location.hash !== `#${id}`) {
              window.history.replaceState(null, '', `#${id}`);
            }
          }
        });
      },
      { threshold: 0.3 } // 30% visibility
    );

    const ids = ['home', 'advantages', 'about', 'eligibility-checker', 'expert-cta', 'testimonials', 'faq'];
    
    const timeoutId = setTimeout(() => {
      ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) observer.observe(el);
      });
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, [isEligible]);

  const scrollToEligibility = () => {
    window.history.pushState(null, '', '#eligibility-checker');
    document.getElementById("eligibility-checker")?.scrollIntoView({
      behavior: "smooth",
    });
  };

  const handleQiuzStarted = () => {
    setHasStarted(true);
  };

  return (
    <div className="min-h-screen bg-off-white">
      {/* UNI 360° Popup */}
      <Uni360Popup />

      {/* Navigation */}
      <Navigation onCheckEligibility={scrollToEligibility} />

      {/* Hero Section */}
      <div id="home">
        <Hero onCheckEligibility={scrollToEligibility} />
      </div>

      {/* Advantages Section */}
      <div id="advantages">
        <Advantages />
      </div>

      {/* About Section */}
      <About />

      {/* Eligibility Checker */}
      <div id="eligibility-checker">
        <EligibilityChecker
          hasStarted={handleQiuzStarted}
        />
      </div>

      {/* Expert CTA - Only show when eligible */}
      {isEligible && (
        <div id="expert-cta">
          <ExpertCTA />
        </div>
      )}

      {/* Testimonials Section */}
      <div id="testimonials">
        <Testimonials />
      </div>

      {/* FAQ Section */}
      <FAQ />

      {/* Footer */}
      <Footer />

      {/* Sticky CTA Bar */}
      <StickyBar
        onCheckEligibility={scrollToEligibility}
        isQuizStarted={hasStarted}
      />
    </div>
  );
};

export default Index;
