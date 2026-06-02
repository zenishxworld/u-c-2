import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import AuthPopup from "@/components/AuthPopup";

interface NavigationProps {
  selectedCountries: string[];
  onCountrySelect: (countries: string[]) => void;
}

export const Navigation = ({
  selectedCountries = [],
  onCountrySelect = () => {},
}: Partial<NavigationProps>) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isInHeroSection, setIsInHeroSection] = useState(false);
  const [showAuthPopup, setShowAuthPopup] = useState(false);
  
  // Initialize user state from sessionStorage immediately to avoid flash
  const [user, setUser] = useState<{ name: string; email: string } | null>(() => {
    if (typeof window !== "undefined" && window.sessionStorage) {
      try {
        const storedUser = sessionStorage.getItem("authUser");
        return storedUser ? JSON.parse(storedUser) : null;
      } catch (error) {
        console.error("Error loading user data from sessionStorage:", error);
        return null;
      }
    }
    return null;
  });
  const location = useLocation();

  // Load user data from localStorage on component mount
  useEffect(() => {
    const loadUserData = () => {
      if (typeof window !== "undefined" && window.sessionStorage) {
        try {
          const storedUser = sessionStorage.getItem("authUser");
          if (storedUser) {
            const userData = JSON.parse(storedUser);
            setUser(userData);
             console.log("Loaded user from sessionStorage:", userData);
          }
        } catch (error) {
          console.error("Error loading user data from sessionStorage:", error);
          // Clear corrupted data
          sessionStorage.removeItem("authUser");
          sessionStorage.removeItem("authToken");
        }
      }
    };

    loadUserData();

    // Listen for storage changes (in case user logs in/out from another tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "authUser") {
        if (e.newValue) {
          try {
            const userData = JSON.parse(e.newValue);
            setUser(userData);
          } catch (error) {
            console.error("Error parsing user data from storage event:", error);
            setUser(null);
          }
        } else {
          setUser(null);
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Enhanced scroll tracking for navbar effects
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      const isHomePage =
        location.pathname === "/" || location.pathname === "/home";
      const heroSection = document.getElementById("home");

      if (isHomePage && heroSection) {
        const heroBottom = heroSection.offsetTop + heroSection.offsetHeight;
        setIsInHeroSection(scrollPosition > 64 && scrollPosition < heroBottom);
      } else {
        setIsInHeroSection(false);
      }

      setIsScrolled(scrollPosition > 50);
    };

    // Set initial state based on current route
    const isHomePage =
      location.pathname === "/" || location.pathname === "/home";
    setIsInHeroSection(isHomePage);

    // Handle scroll events
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, [location.pathname]);

  const navItems = [
    { name: "Services", href: "/services", external: false },
    {
      name: "Work in Germany",
      href: "https://chancenkarte.uni360degree.com/",
      external: true,
    },
    { name: "About", href: "/about", external: false },
    { name: "Contact", href: "/contact", external: false },
  ];

  const countries = [
    { code: "germany", name: "Germany", flag: "/germany-logo.png" },
    { code: "uk", name: "United Kingdom", flag: "/uk-logo.png" },
  ];

  const handleExternalLink = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
    setIsMenuOpen(false);
  };

  const handleCountryToggle = (countryCode: string) => {
    if (selectedCountries.includes(countryCode)) {
      onCountrySelect(selectedCountries.filter((c) => c !== countryCode));
      localStorage.setItem(
        "selectedCountries",
        JSON.stringify(selectedCountries.filter((c) => c !== countryCode))
      );
      // console.log(selectedCountries.filter((c) => c !== countryCode));
    } else {
      onCountrySelect([...selectedCountries, countryCode]);
      localStorage.setItem(
        "selectedCountries",
        JSON.stringify([...selectedCountries, countryCode])
      );
      // console.log([...selectedCountries, countryCode]);
    }
  };

  const handleSmoothScroll = (href: string, e?: React.MouseEvent) => {
    if (e) e.preventDefault();

    if (href.startsWith("#")) {
      // If we're not on the home page, navigate there first
      if (window.location.pathname !== "/") {
        window.location.href = "/" + href;
        return;
      }

      const element = document.querySelector(href);
      if (element) {
        const navHeight = 64; // Height of the navigation bar
        const elementPosition = (element as HTMLElement).offsetTop - navHeight;

        window.scrollTo({
          top: elementPosition,
          behavior: "smooth",
        });
      }
    }
    setIsMenuOpen(false);
  };

  const handleAuthClick = () => {
    if (user) {
      // User is signed in, so sign them out
      handleSignOut();
    } else {
      // User is not signed in, show auth popup
      setShowAuthPopup(true);
    }
    setIsMenuOpen(false); // Close mobile menu if open
  };

  const handleAuthSuccess = (userData: { name: string; email: string }) => {
    setUser(userData);
    setShowAuthPopup(false);
    console.log("User signed in successfully:", userData);
    // User is now signed in and stays on the same page
  };

  const handleAuthClose = () => {
    setShowAuthPopup(false);
  };

  const handleSignOut = () => {
    // Explicitly close auth popup and reset all UI state first
    setShowAuthPopup(false);
    setIsMenuOpen(false);
    // Clear user from React state
    setUser(null);

    // Clear ALL auth data from both sessionStorage and localStorage
    if (typeof window !== "undefined") {
      try {
        sessionStorage.removeItem("authUser");
        sessionStorage.removeItem("authToken");
        localStorage.removeItem("authUser");
        localStorage.removeItem("authToken");
        // Also clear any leftover Google OAuth tokens to prevent
        // the AuthPopup useEffect from auto-redirecting on remount
        localStorage.removeItem("google_auth_token");
        localStorage.removeItem("google_auth_user");
        console.log("User signed out successfully");
      } catch (error) {
        console.error("Error clearing storage on sign out:", error);
      }
    }
  };

  // Get user's first name for display
  const getDisplayName = () => {
    if (!user) return "";
    if (user.name) {
      // Get first name from full name
      return user.name.split(" ")[0];
    }
    return user.email.split("@")[0]; // Fallback to email username
  };

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-50 p-2 md:p-4 px-4 md:px-10 mx-auto bg-transparent">
        <nav
          className={`${
            isScrolled ? "bg-[#ffcd9a99] shadow-xl" : "bg-[#FFCC9A] "
          } backdrop-blur-md border border-white/20 rounded-2xl transition-all duration-300`}>
          <div className="mx-auto pl-0 pr-2 md:px-4 sm:px-4 lg:pl-0 lg:pr-2">
            <div className="flex justify-between items-center h-16 md:h-16">
              {/* Original Logo Section */}
              <div className="flex-shrink-0 flex items-center">
                <Link to="/" className="flex items-center">
                  <img
                    src={"/Uni360 logo.png"}
                    alt="UNI 360° Logo"
                    className="h-16 w-16 ml-1 mt-1 mr-0 drop-shadow-lg hover:scale-105 transition-transform duration-300 cursor-pointer"
                  />
                </Link>
                <Link
                  to="/"
                  className={`text-2xl -ml-2 font-bold hover:scale-105 transition-transform duration-300 drop-shadow-md ${
                    isInHeroSection ? "text-black" : "text-black"
                  }`}>
                  UNI360°
                </Link>
              </div>
              {/* Desktop Navigation */}
              <div className="hidden md:block">
                <div className="ml-10 flex items-baseline space-x-4">
                  {/* Countries Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        className={`flex items-center gap-2 ${
                          isInHeroSection
                            ? "text-foreground"
                            : "text-foreground"
                        }   `}>
                        Countries
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-48 bg-background border border-border shadow-lg z-50">
                      {countries.map((country) => (
                        <DropdownMenuItem
                          key={country.code}
                          onClick={() => handleCountryToggle(country.code)}
                          className="flex items-center gap-3 cursor-pointer">
                          <img
                            src={country.flag}
                            alt={`${country.name} flag`}
                            className="w-6 h-4 object-cover rounded"
                          />
                          <span>{country.name}</span>
                          {selectedCountries.includes(country.code) && (
                            <span className="ml-auto text-primary">✓</span>
                          )}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <Link
                    to="/universities"
                    className={`${
                      isInHeroSection ? "text-foreground" : "text-foreground "
                    } hover:scale-105 px-3 py-2 rounded-md text-sm font-medium transition-all duration-300 `}>
                    Universities
                  </Link>

                  {navItems.map((item) =>
                    item.href.startsWith("#") ? (
                      <a
                        key={item.name}
                        href={item.href}
                        onClick={(e) => handleSmoothScroll(item.href, e)}
                        className={`${
                          isInHeroSection
                            ? "text-foreground"
                            : "text-foreground"
                        } hover:scale-105 px-3 py-2 rounded-md text-sm font-medium transition-all duration-300 `}>
                        {item.name}
                      </a>
                    ) : item.external ? (
                      <a
                        key={item.name}
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`${
                          isInHeroSection
                            ? "text-foreground"
                            : "text-foreground"
                        } hover:scale-105 px-3 py-2 rounded-md text-sm font-medium transition-all duration-300 flex items-center gap-1`}>
                        {item.name}
                      </a>
                    ) : (
                      <Link
                        key={item.name}
                        to={item.href}
                        className={`${
                          isInHeroSection
                            ? "text-foreground"
                            : "text-foreground"
                        } hover:scale-105 px-3 py-2 rounded-md text-sm font-medium transition-all duration-300`}>
                        {item.name}
                      </Link>
                    )
                  )}
                </div>
              </div>

              {/* Desktop Auth Button */}
              <div className="hidden md:flex items-center mr-6 space-x-4">
                {user ? (
                  <div className="flex items-center space-x-3">
                    <Button
                      variant="outline"
                      onClick={handleSignOut}
                      className={`border-2 border-[#2A3439] text-white bg-[#2A3439] hover:bg-[#E08A1E] hover:text-white hover:border-[#E08A1E] transition-all duration-300 ${
                        isInHeroSection
                          ? "border-[#2A3439] text-white bg-[#2A3439] hover:bg-[#E08A1E] hover:text-white hover:border-[#E08A1E]"
                          : ""
                      }`}>
                      Sign Out
                    </Button>
                  </div>
                ) : (
                  <Button className="btn-hero" onClick={handleAuthClick}>
                    Sign Up
                  </Button>
                )}
              </div>

              {/* Mobile menu button */}
              <div className="md:hidden">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="h-10 w-10">
                  {isMenuOpen ? (
                    <X className="h-6 w-6" />
                  ) : (
                    <Menu className="h-8 w-8" />
                  )}
                </Button>
              </div>
            </div>

            {/* Mobile Navigation - Backdrop */}
            {isMenuOpen && (
              <div
                className="fixed w-screen h-screen inset-0 bg-transparent backdrop-blur-sm transition-opacity md:hidden top-16"
                onClick={() => setIsMenuOpen(false)}
                aria-hidden="true"
              />
            )}
            {/* Mobile Navigation - Sliding Sidebar */}
            <div
              className={`fixed inset-y-0 -right-4 w-64 bg-white/95 top-16 h-[56vh] rounded-lg mt-1 backdrop-blur-md shadow-lg transform transition-transform duration-300 ease-in-out md:hidden z-50 ${
                isMenuOpen ? "translate-x-0" : "translate-x-full"
              }`}
              onClick={(e) => e.stopPropagation()}>
              <div className="h-full overflow-y-auto">
                <div className="px-4 py-6 space-y-4">
                  {/* Mobile Countries */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground mb-2">
                      Countries:
                    </p>
                    <div className="space-y-2">
                      {countries.map((country) => (
                        <button
                          key={country.code}
                          onClick={() => handleCountryToggle(country.code)}
                          className={`flex items-center gap-3 w-full px-3 py-2 text-left border-b border-gray-100 ${
                            selectedCountries.includes(country.code)
                              ? "bg-primary/10 text-primary"
                              : "hover:bg-gray-50"
                          }`}>
                          <img
                            src={country.flag}
                            alt={`${country.name} flag`}
                            className="w-6 h-4 object-cover rounded"
                          />
                          <span>{country.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <Link
                    to="/universities"
                    className="flex items-center px-4 py-0 text-foreground hover:text-primary border-b border-gray-100 hover:bg-gray-50"
                    onClick={() => setIsMenuOpen(false)}>
                    Universities
                  </Link>

                  {navItems.map((item) =>
                    item.href.startsWith("#") ? (
                      <a
                        key={item.name}
                        href={item.href}
                        onClick={(e) => handleSmoothScroll(item.href, e)}
                        className="flex items-center px-4 py-0 text-foreground hover:text-primary border-b border-gray-100 hover:bg-gray-50">
                        {item.name}
                      </a>
                    ) : item.external ? (
                      <a
                        key={item.name}
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center px-4 py-0 text-foreground hover:text-primary border-b border-gray-100 hover:bg-gray-50"
                        onClick={() => setIsMenuOpen(false)}>
                        {item.name}
                      </a>
                    ) : (
                      <Link
                        key={item.name}
                        to={item.href}
                        className="flex items-center px-4 py-0 text-foreground hover:text-primary border-b border-gray-100 hover:bg-gray-50"
                        onClick={() => setIsMenuOpen(false)}>
                        {item.name}
                      </Link>
                    )
                  )}

                  {/* Mobile Auth */}
                  <div className="px-3 py-2 space-y-2">
                    {user ? (
                      <div className="space-y-2">
                        <p className="text-foreground text-sm">
                          Welcome, {getDisplayName()}!
                        </p>
                        <Button
                          variant="outline"
                          className="w-full border-2 border-[#2A3439] text-white bg-[#2A3439] hover:bg-[#E08A1E] hover:text-white hover:border-[#E08A1E] transition-all duration-300"
                          onClick={handleSignOut}>
                          Sign Out
                        </Button>
                      </div>
                    ) : (
                      <Button
                        className="btn-hero w-full"
                        onClick={handleAuthClick}>
                        Sign Up
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </nav>
      </div>

      {/* Auth Popup - Only mount when explicitly opened, not just when user is null.
          Mounting when user=null (after sign-out) would trigger its useEffect which
          checks google_auth_token in localStorage and could cause accidental redirects. */}
      {showAuthPopup && (
        <AuthPopup
          isOpen={showAuthPopup}
          onClose={handleAuthClose}
          onAuthSuccess={handleAuthSuccess}
        />
      )}
    </>
  );
};