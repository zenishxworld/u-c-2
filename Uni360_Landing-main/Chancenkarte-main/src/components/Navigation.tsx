import { useState } from "react";
import { Menu, X } from "lucide-react";

interface NavigationProps {
  onCheckEligibility: () => void;
}

export const Navigation = ({ onCheckEligibility }: NavigationProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const scrollToSection = (sectionId: string) => {
    window.history.pushState(null, "", `#${sectionId}`);
    document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth" });
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-sage-green/20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-4">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo */}
          <button
            onClick={() => (window.location.href = "/")}
            className="text-lg sm:text-xl lg:text-2xl font-satoshi font-bold flex flex-row items-center flex-nowrap text-gunmetal focus:outline-none ml-2 sm:ml-3 lg:ml-0">
            Chancenkarte
            <img
              className="object-contain w-3 sm:w-4 lg:w-5 ml-1 flex-shrink-0 relative top-0.5"
              src="/germanyflag.png"
              alt=""
            />
          </button>

          {/* Desktop Navigation */}
          <div className="hidden lg:block">
            <div className="flex items-baseline space-x-4 xl:space-x-8">
              <button
                onClick={() => scrollToSection("about")}
                className="text-gunmetal hover:text-tigers-eye px-2 xl:px-3 py-2 text-sm font-medium transition-colors">
                About
              </button>
              <a
                href="https://uni360degree.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gunmetal hover:text-tigers-eye px-2 xl:px-3 py-2 text-sm font-medium transition-colors">
                UNI 360°
              </a>
              <button
                onClick={() => scrollToSection("faq")}
                className="text-gunmetal hover:text-tigers-eye px-2 xl:px-3 py-2 text-sm font-medium transition-colors">
                FAQs
              </button>
              <button
                onClick={() => scrollToSection("eligibility-checker")}
                className="bg-tigers-eye hover:bg-tigers-eye/90 text-white px-4 xl:px-6 py-2 rounded-chancenkarte text-sm font-semibold transition-all duration-300 hover:scale-105 whitespace-nowrap">
                Check Eligibility
              </button>
            </div>
          </div>

          {/* UNI 360° Branding (non-clickable) */}
          <div className="hidden xl:flex items-center space-x-4 hover:opacity-90 transition-opacity">
            <div className="text-right">
              <div className="text-lg font-satoshi font-bold text-gunmetal">
                <img
                  src="./Uni360 logo.png"
                  alt="Logo"
                  className="h-11 w-auto object-contain inline mr-[-4px]"
                />
                UNI 360°
              </div>
              <div className="text-xs text-gunmetal/60 -mt-2">
                Study Abroad Companion
              </div>
            </div>
          </div>

          {/* Mobile Menu Toggle - Better positioning */}
          <div className="lg:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gunmetal hover:text-tigers-eye p-2 -m-2 mr-1 sm:mr-2 md:mr-4">
              {isMobileMenuOpen ? (
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              ) : (
                <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer - Improved responsive spacing */}
        {isMobileMenuOpen && (
          <div className="lg:hidden animate-fade-in-up">
            <div className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 space-y-1 sm:space-y-2 bg-white border-t border-sage-green/20 shadow-lg mx-2 sm:mx-4 md:mx-6 mb-2 rounded-b-lg">
              <button
                onClick={() => scrollToSection("about")}
                className="text-gunmetal hover:text-tigers-eye hover:bg-sage-green/10 block px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base font-medium w-full text-left transition-all rounded-lg">
                About
              </button>
              <a
                href="/uni360"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gunmetal hover:text-tigers-eye hover:bg-sage-green/10 block px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base font-medium w-full text-left transition-all rounded-lg">
                UNI 360°
              </a>
              <button
                onClick={() => scrollToSection("faq")}
                className="text-gunmetal hover:text-tigers-eye hover:bg-sage-green/10 block px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base font-medium w-full text-left transition-all rounded-lg">
                FAQs
              </button>
              <button
                onClick={() => scrollToSection("eligibility-checker")}
                className="bg-tigers-eye hover:bg-tigers-eye/90 text-white block px-4 sm:px-6 py-3 sm:py-4 rounded-chancenkarte text-sm sm:text-base font-semibold w-full text-center mt-3 sm:mt-4 transition-all duration-300 touch-manipulation">
                Check Eligibility
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
