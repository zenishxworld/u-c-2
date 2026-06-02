import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { HeroSection } from "@/components/HeroSection";
import { CountrySelectionModal } from "@/components/CountrySelectionModal";
import { CollegeExplorer } from "@/components/CollegeExplorer";
import { FloatingChatbot } from "@/components/FloatingChatbot";
import WorkInGermanySection from '@/components/WorkInGermanySection';
import { Germany } from "@/components/Germany";
import { UK } from "@/components/UK";
import WhyChooseSection from "@/components/WhyChooseSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Phone } from "lucide-react";
import AuthPopup, { AuthUtils } from '@/components/AuthPopup';
import { paymentAPI } from '@/services/api';
import FAQSection from '@/components/FAQSection';

export const LandingPage = () => {
  const [selectedCountries, setSelectedCountries] = useState<string[]>(["germany", "uk"]);
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [hasScrolledToCountries, setHasScrolledToCountries] = useState(false);
  const [showAuthPopup, setShowAuthPopup] = useState(false);
  const [showPaymentPopup, setShowPaymentPopup] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);

  const CALENDLY_LINK = "https://calendly.com/uni360degreetech/30min";

  // Reset scroll position to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Detect scroll to countries section for modal trigger
  useEffect(() => {
    const handleScroll = () => {
      const servicesSection = document.getElementById("services");
      if (servicesSection && !hasScrolledToCountries) {
        const rect = servicesSection.getBoundingClientRect();
        if (rect.top <= window.innerHeight && rect.bottom >= 0) {
          setHasScrolledToCountries(true);
          setShowCountryModal(true);
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [hasScrolledToCountries]);

  const handleCountrySelection = (countries: string[]) => {
    setSelectedCountries(countries);
  };

  const handleBookCallClick = () => {
    if (AuthUtils.isAuthenticated()) {
      // Already logged in — grab user from session and show payment popup
      setCurrentUser(AuthUtils.getCurrentUser());
      setShowPaymentPopup(true);
    } else {
      // Not logged in — show auth popup first
      setShowAuthPopup(true);
    }
  };

  const handleAuthSuccess = (userData: any, token?: string) => {
    // After login/signup, close auth popup and open payment popup
    setShowAuthPopup(false);
    setCurrentUser(userData);
    setTimeout(() => setShowPaymentPopup(true), 300);
  };

  const handlePayNow = async () => {
    setPaymentLoading(true);
    setPaymentError('');

    try {
      // Step 1: Check payment service health
      await paymentAPI.checkHealth();

      // Step 2: Fetch and validate allowed payment types
      const paymentTypes = await paymentAPI.getPaymentTypes();
      console.log('Available payment types:', paymentTypes);

      // Verify that 'OTHER' is in the allowed payment types
      if (Array.isArray(paymentTypes) && !paymentTypes.includes('OTHER')) {
        setPaymentError('Payment configuration error. "OTHER" payment type not supported. Please contact support.');
        setPaymentLoading(false);
        return;
      }

      // Step 3: Create Razorpay order with payment_type = 'OTHER' for 1:1 call booking
      const order = await paymentAPI.createOrder(100, 'INR', 'OTHER');

      // Validate order response
      if (!order?.orderId || !order?.keyId) {
        setPaymentError('Order creation failed. Invalid response from server.');
        setPaymentLoading(false);
        return;
      }

      // Step 4: Load Razorpay checkout script dynamically if not already loaded
      if (!(window as any).Razorpay) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.onload = () => resolve();
          script.onerror = () => reject(new Error('Failed to load Razorpay. Please check your connection.'));
          document.body.appendChild(script);
        });
      }

      // Step 5: Open Razorpay checkout — prefill with user's name & email from login
      const rzp = new (window as any).Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        order_id: order.orderId,
        name: 'UNI 360°',
        description: '1:1 Consultation Call',
        prefill: {
          name: currentUser?.name || currentUser?.fullName || '',
          email: currentUser?.email || '',
        },
        theme: { color: '#2C3539' },
        handler: async (response: any) => {
          try {
            // Step 6: Verify payment signature with backend
            const verification = await paymentAPI.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            if (verification?.verified || verification?.data?.verified) {
              // Payment verified — close popup and open Calendly
              setShowPaymentPopup(false);
              setPaymentError('');
              const name = encodeURIComponent(currentUser?.name || currentUser?.fullName || `${currentUser?.firstName || ''} ${currentUser?.lastName || ''}`.trim() || '');
              const email = encodeURIComponent(currentUser?.email || '');
              window.open(`${CALENDLY_LINK}?name=${name}&email=${email}`, '_blank');
            } else {
              setPaymentError('Payment verification failed. Please contact support.');
            }
          } catch {
            setPaymentError('Payment verification failed. Please contact support.');
          } finally {
            setPaymentLoading(false);
          }
        },
        modal: {
          ondismiss: () => {
            setPaymentLoading(false);
          },
        },
      });

      rzp.open();
    } catch (err: any) {
      setPaymentError(err?.message || 'Could not initiate payment. Please try again.');
      setPaymentLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Navigation */}
      <div className="w-full max-w-full">
        <Navigation
          selectedCountries={selectedCountries}
          onCountrySelect={handleCountrySelection}
        />
      </div>

      {/* Main Content Container */}
      <div className="w-full max-w-full overflow-hidden">
        {/* Hero Section */}
        <div className="w-full max-w-full">
          <HeroSection selectedCountries={selectedCountries} />
        </div>

        <div className="w-full max-w-full">
          <Germany selectedCountries={selectedCountries} />
        </div>

        <div className="w-full max-w-full">
          <UK selectedCountries={selectedCountries} />
        </div>

        {/* College Explorer */}
        <div className="w-full max-w-full">
          <CollegeExplorer selectedCountries={selectedCountries} />
        </div>

        {/* Work In Germany Section */}
        <div className="w-full max-w-full">
          <WorkInGermanySection selectedCountries={selectedCountries} />
        </div>

        {/* Why Choose Section */}
        <div className="w-full max-w-full">
          <WhyChooseSection selectedCountries={selectedCountries} />
        </div>

        {/* Testimonials Section */}
        <div className="w-full max-w-full">
          <TestimonialsSection selectedCountries={selectedCountries} />
        </div>

        {/* FAQ Section */}
        <div className="w-full max-w-full">
          <FAQSection onBookCall={handleBookCallClick} />
        </div>
      </div>

      {/* Book My Call Button - Desktop/Tablet Only */}
      <Button
        onClick={handleBookCallClick}
        className="
          fixed top-1/2 -translate-y-1/2 z-40
          text-[#2C3539]
          px-3 py-4
          rounded-l-md shadow-lg
           items-center gap-2
          font-medium text-sm
          transform rotate-90 origin-center
          transition-colors duration-200
          whitespace-nowrap
          hidden md:flex
        "
        style={{
          right: '-52px',
          backgroundColor: '#C4DFF0',
          border: '1px solid #B0D4EA'
        }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#B0D4EA'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#C4DFF0'}
      >
        <span className="transform rotate-180 text-sm font-semibold">Book 1:1 Call</span>
        <Phone className="h-4 w-4 text-[#2C3539] transform rotate-180" />
      </Button>

      {/* Footer */}
      <div className="w-full max-w-full">
        <Footer />
      </div>

      {/* Auth Popup */}
      {showAuthPopup && (
        <AuthPopup 
          isOpen={true}
          onClose={() => setShowAuthPopup(false)} 
          onAuthSuccess={handleAuthSuccess} 
          title="Sign in to book your consultation"
          subtitle="Please sign in to schedule your 1:1 call with our experts"
          initialMode="login"
          skipPortalRedirect={true}
        />
      )}

      {/* Payment Popup */}
      {showPaymentPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl p-4 w-80 mx-4">

            {/* Header */}
            <div className="text-center mb-5">
              <div className="w-12 h-12 bg-[#C4DFF0] rounded-full flex items-center justify-center mx-auto mb-3">
                <Phone className="w-5 h-5 text-[#2C3539]" />
              </div>
              <h2 className="text-lg font-bold text-[#2C3539]">Book Your 1:1 Call</h2>
              <p className="text-sm text-gray-500 mt-1">with a UNI 360° expert</p>
            </div>

            {/* User info from login — name & email pulled from session */}
            {currentUser && (
              <div className="bg-gray-50 rounded-lg p-3 mb-4 text-sm border border-gray-100">
                <p className="text-gray-500 text-xs mb-1">Booking as:</p>
                <p className="font-semibold text-[#2C3539]">
                  {currentUser.name || currentUser.fullName || `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim()}
                </p>
                <p className="text-gray-500 text-xs">{currentUser.email}</p>
              </div>
            )}

            {/* Price summary */}
            <div className="flex items-center justify-between bg-[#C4DFF0]/30 rounded-lg px-4 py-3 mb-4 border border-[#C4DFF0]">
              <span className="text-sm text-gray-600">Consultation Fee</span>
              <span className="text-lg font-bold text-[#2C3539]">₹1</span>
            </div>

            {/* What you get */}
            <ul className="text-xs text-gray-500 space-y-1 mb-4 px-1">
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span> 15-minute 1:1 video call
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span> Personalized university guidance
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span> UK & Germany admission support
              </li>
            </ul>

            {/* Error message */}
            {paymentError && (
              <div className="text-red-500 text-xs bg-red-50 border border-red-200 rounded-lg p-2 mb-3">
                {paymentError}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowPaymentPopup(false);
                  setPaymentError('');
                }}
                disabled={paymentLoading}
                className="flex-1 h-10 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePayNow}
                disabled={paymentLoading}
                className="flex-1 h-10 rounded-lg bg-[#2C3539] text-white text-sm font-semibold hover:bg-[#3a454a] disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
              >
                {paymentLoading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Processing...
                  </>
                ) : (
                  'Pay ₹1 & Book'
                )}
              </button>
            </div>

            <p className="text-xs text-center text-gray-400 mt-3 flex items-center justify-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              Secured by Razorpay
            </p>
          </div>
        </div>
      )}

      {/* Prevent horizontal scroll styles */}
      <style>
        {`
          * {
            box-sizing: border-box;
          }
          
          html, body {
            overflow-x: hidden;
            max-width: 100vw;
          }
          
          body {
            position: relative;
          }

          * {
            max-width: 100%;
          }

          img, video, iframe, object, embed {
            max-width: 100%;
            height: auto;
          }

          @media (max-width: 640px) {
            .mobile-full-width {
              padding-left: 0 !important;
              padding-right: 0 !important;
              margin-left: 0 !important;
              margin-right: 0 !important;
            }
            .mobile-inner-padding {
              padding-left: 1rem;
              padding-right: 1rem;
            }
          }
          
          @media (min-width: 641px) {
            .desktop-full-width {
              padding-left: 0 !important;
              padding-right: 0 !important;
              margin-left: 0 !important;
              margin-right: 0 !important;
              width: 100% !important;
              max-width: 100% !important;
            }
          }
          
          @media (max-width: 320px) {
            .hero-title {
              font-size: 1.5rem !important;
              line-height: 1.2 !important;
            }
            .hero-subtitle {
              font-size: 0.8rem !important;
            }
            .chatbot-mobile-xs {
              bottom: 12px !important;
              right: 12px !important;
            }
          }

          @media (min-width: 321px) and (max-width: 375px) {
            .hero-title {
              font-size: 1.75rem !important;
              line-height: 1.3 !important;
            }
          }

          @media (min-width: 376px) and (max-width: 425px) {
            .hero-title {
              font-size: 2rem !important;
              line-height: 1.3 !important;
            }
          }

          @media (min-width: 768px) and (max-width: 1024px) {
            .tablet-spacing {
              padding-left: 0 !important;
              padding-right: 0 !important;
            }
          }

          @media (min-width: 1025px) {
            .desktop-container {
              width: 100vw !important;
              max-width: 100vw !important;
              padding-left: 0 !important;
              padding-right: 0 !important;
              margin-left: 0 !important;
              margin-right: 0 !important;
            }
          }

          @media (min-width: 1441px) {
            .desktop-xl-container {
              width: 100vw !important;
              max-width: 100vw !important;
              margin: 0 !important;
            }
          }

          @media (max-width: 640px) {
            .chatbot-mobile {
              bottom: 16px !important;
              right: 16px !important;
              left: auto !important;
            }
          }
          
          @media (max-width: 375px) {
            .chatbot-mobile {
              bottom: 12px !important;
              right: 12px !important;
            }
          }

          .container, .max-w-full, .w-full {
            max-width: 100vw !important;
            overflow-x: hidden !important;
          }

          body {
            overflow-x: hidden !important;
          }
        `}
      </style>
    </div>
  );
};