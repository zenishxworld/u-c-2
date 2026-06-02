import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";
import Index from "./pages/Index";
import Services from "./pages/Services";
import UniversityQuiz from "./pages/UniversityQuiz";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import CookiePolicy from "./pages/CookiePolicy";
import RefundPolicy from "./pages/Refund&CancellationPolicy";
import Pricing from "./pages/Pricingpolicy";
import AuthCallback from "./pages/AuthCallback";


import About from "./pages/About";
import { Contact } from "./pages/Contact";
import NotFound from "./pages/NotFound";
// In _app.tsx or layout.tsx
import "./index.css";

// Scroll Restoration Component
const ScrollRestoration = () => {
  const location = useLocation();

  useEffect(() => {
    const handleScrollSave = () => {
      sessionStorage.setItem(
        `scroll_${location.pathname}`,
        window.scrollY.toString()
      );
    };

    // Save scroll position before leaving the page
    window.addEventListener("beforeunload", handleScrollSave);
    
    // Save scroll position when route changes
    return () => {
      handleScrollSave();
      window.removeEventListener("beforeunload", handleScrollSave);
    };
  }, [location.pathname]);

  useEffect(() => {
    // Restore scroll position when component mounts or route changes
    const savedPosition = sessionStorage.getItem(`scroll_${location.pathname}`);
    
    if (savedPosition) {
      // Use setTimeout to ensure DOM is ready
      setTimeout(() => {
        window.scrollTo(0, parseInt(savedPosition, 10));
      }, 0);
    } else {
      // If no saved position, scroll to top (for new pages)
      window.scrollTo(0, 0);
    }
  }, [location.pathname]);

  return null;
};

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollRestoration />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/services" element={<Services />} />
          <Route path="/universities" element={<UniversityQuiz />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
          <Route path="/cookie-policy" element={<CookiePolicy />} />
          <Route path="/refund-policy" element={<RefundPolicy />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;