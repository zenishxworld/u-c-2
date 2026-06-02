import { useState, useEffect } from 'react';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, GraduationCap, FileText, Languages, Home, Briefcase, CheckCircle, Globe, Building, CreditCard, Phone } from 'lucide-react';
import AuthPopup, { AuthUtils } from '@/components/AuthPopup';
import { paymentAPI } from '@/services/api';

// ✅ FIXED: Import images so Vite tracks and hashes them correctly in production
import imgAdmission from '@/assets/admission-counselling.webp';
import imgVisa from '@/assets/visa-support.webp';
import imgSOP from '@/assets/SOP-writing.webp';
import imgLanguage from '@/assets/language-training.webp';
import imgArrival from '@/assets/arrival.webp';
import imgJobAssist from '@/assets/job-assist.webp';
import imgTranslation from '@/assets/doc-translation.webp';
import imgAccommodation from '@/assets/accomodation.webp';
import imgMoneyTransfer from '@/assets/money-transfer.webp';

const germanyLogo = '/germany-logo.png';

const Services = () => {
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [showAuthPopup, setShowAuthPopup] = useState(false);
  const [showPaymentPopup, setShowPaymentPopup] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);

  const CALENDLY_LINK = "https://calendly.com/uni360degreetech/30min";

  useEffect(() => {
    const loadSelectedCountries = () => {
      if (typeof window !== "undefined" && window.localStorage) {
        try {
          const storedCountries = localStorage.getItem("selectedCountries");
          if (storedCountries) {
            const countries = JSON.parse(storedCountries);
            setSelectedCountries(countries);
          }
        } catch (error) {
          console.error("Error loading selected countries from localStorage:", error);
        }
      }
    };
    loadSelectedCountries();
  }, []);

  const handleCountrySelect = (countries: string[]) => {
    setSelectedCountries(countries);
  };

  const handleBookCall = () => {
    if (AuthUtils.isAuthenticated()) {
      setCurrentUser(AuthUtils.getCurrentUser());
      setShowPaymentPopup(true);
    } else {
      setShowAuthPopup(true);
    }
  };

  const handleAuthSuccess = (userData: any, token?: string) => {
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

  const services = [
    {
      icon: GraduationCap,
      title: "Admission Counseling",
      description: "Complete guidance from university selection to application submission with personalized strategy.",
      features: [
        "University and course selection",
        "Application strategy planning",
        "Profile evaluation and improvement",
        "Scholarship guidance",
        "Interview preparation"
      ],
      popular: true,
      cta: "Start Free Consultation",
      ctaAction: handleBookCall,
      image: imgAdmission,
      countries: ['germany', 'uk']
    },
    {
      icon: FileText,
      title: "Visa Support",
      description: "End-to-end visa assistance with documentation, application tracking, and interview preparation.",
      features: [
        "Visa eligibility assessment",
        "Document preparation and review",
        "Application form assistance",
        "Embassy interview coaching",
        "Post-visa arrival support"
      ],
      popular: false,
      cta: "Get Visa Help",
      ctaLink: "https://students.uni360degree.com/",
      image: imgVisa,
      countries: ['germany', 'uk']
    },
    {
      icon: Languages,
      title: "SOP & LOR Writing",
      description: "Professional writing services for Statement of Purpose, Letters of Recommendation, and essays.",
      features: [
        "Personalized SOP writing",
        "LOR coordination and drafting",
        "Essay writing and editing",
        "Multiple revisions included",
        "University-specific customization"
      ],
      popular: false,
      cta: "Start Writing",
      ctaLink: "https://students.uni360degree.com/",
      image: imgSOP,
      countries: ['germany', 'uk']
    },
    {
      icon: Languages,
      title: "Language Training",
      description: "IELTS, TOEFL, and German language training with certified instructors and proven methods.",
      features: [
        "IELTS/TOEFL preparation",
        "German language courses (A1-C2)",
        "One-on-one tutoring available",
        "Mock tests and practice sessions",
        "Guaranteed score improvement"
      ],
      popular: false,
      cta: "Start Learning",
      ctaLink: "https://students.uni360degree.com/",
      image: imgLanguage,
      countries: ['germany', 'uk']
    },
    {
      icon: Home,
      title: "Post-Arrival Support",
      description: "Complete assistance after reaching your destination including accommodation and local guidance.",
      features: [
        "Airport pickup arrangements",
        "Accommodation assistance",
        "Bank account opening help",
        "Local area orientation",
        "Emergency support hotline"
      ],
      popular: false,
      cta: "Get Support",
      ctaLink: "https://www.edroots.com/service/post-arrival-assistance",
      image: imgArrival,
      countries: ['germany', 'uk']
    },
    {
      icon: Briefcase,
      title: "Job Assist (Germany)",
      description: "Exclusive career support for Germany including job placement, CV optimization, and interview prep.",
      features: [
        "CV/Resume optimization",
        "Job search assistance",
        "Interview preparation",
        "Networking events access",
        "Chancenkarte visa support"
      ],
      popular: false,
      cta: "Find Jobs",
      ctaAction: () => window.open("https://chancenkarte.uni360degree.com/#home", '_blank'),
      image: imgJobAssist,
      badge: (
        <div className="flex items-center gap-1">
          <img
            src={germanyLogo}
            alt="Germany"
            loading="eager"
            fetchPriority="high"
            decoding="async"
            className="w-4 h-3 rounded-sm"
          />
          <span>Germany Only</span>
        </div>
      ),
      countries: ['germany']
    },
    {
      icon: Globe,
      title: "Document Translation",
      description: "Certified translation services for all academic and official documents required for your application.",
      features: [
        "Certified academic transcripts",
        "Official document translation",
        "Apostille and notarization",
        "Multiple language support",
        "Fast turnaround time"
      ],
      popular: false,
      cta: "Get Translation",
      ctaLink: "https://certifiedtranslationindia.com/?gad_source=1&gad_campaignid=21476763982&gbraid=0AAAAABevLfCplHDmN5DAZTXhq3438ycam&gclid=CjwKCAjwqazPBhALEiwAOuXqdAc6BmIF93hXPpryosG8oJWGKsys6xPRpy_BfFWlYxR8h6V4PoXI6BoC6fsQAvD_BwE",
      image: imgTranslation,
      countries: ['germany', 'uk']
    },
    {
      icon: Building,
      title: "Accommodation",
      description: "Secure comfortable and affordable accommodation options near your university campus.",
      features: [
        "University dormitory booking",
        "Private apartment search",
        "Homestay arrangements",
        "Virtual property tours",
        "Lease agreement assistance"
      ],
      popular: false,
      cta: "Find Housing",
      ctaLink: "https://www.globalreach.in/accommodation.php",
      image: imgAccommodation,
      countries: ['germany', 'uk']
    },
    {
      icon: CreditCard,
      title: "Money Transfer",
      description: "Safe and secure international money transfer services with competitive exchange rates.",
      features: [
        "Competitive exchange rates",
        "Fast international transfers",
        "Tuition fee payments",
        "Travel card services",
        "24/7 transfer tracking"
      ],
      popular: false,
      cta: "Transfer Money",
      ctaLink: "https://wise.com/in/send-money/",
      image: imgMoneyTransfer,
      countries: ['germany', 'uk']
    }
  ];

  const filteredServices = services.filter(service => {
    if (!selectedCountries || selectedCountries.length === 0) return true;
    
    // Check if "All" is selected or if there is a match ignoring case
    if (selectedCountries.includes("All")) return true;

    return service.countries.some(country => 
      selectedCountries.some(selected => 
        selected.toLowerCase() === country.toLowerCase()
      )
    );
  });

  return (
    <div className="min-h-screen mt-16">
      <Navigation
        selectedCountries={selectedCountries}
        onCountrySelect={handleCountrySelect}
      />

      {/* Hero Section */}
      <section className="pt-20 pb-12 bg-gradient-to-br from-secondary/10 to-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-primary">
              Complete <span className="text-accent">Study Abroad Services</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              From university selection to landing your dream job abroad, we provide end-to-end support
              throughout your international education journey.
            </p>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredServices.map((service, index) => (
              <Card
                key={index}
                className="group p-6 h-full flex flex-col transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ring-2 ring-accent"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Header Image */}
                <div className="relative overflow-hidden h-48 rounded-lg mb-4">
                  <img
                    src={service.image}
                    alt={service.title}
                    loading="eager"
                    fetchPriority="high"
                    decoding="async"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-primary/20" />

                  {/* Icon */}
                  <div className="absolute top-4 left-4 w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                    <service.icon className="w-6 h-6 text-primary-foreground" />
                  </div>

                  {/* Badges */}
                  <div className="absolute top-4 right-4 space-y-2">
                    {service.badge && (
                      <Badge className="bg-secondary text-secondary-foreground border-0 block">
                        {service.badge}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="space-y-4 flex-1 flex flex-col">
                  <div>
                    <h3 className="text-xl font-bold text-primary mb-2">{service.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {service.description}
                    </p>
                  </div>

                  {/* Features */}
                  <div className="space-y-2 flex-1">
                    {service.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start space-x-2">
                        <CheckCircle className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-muted-foreground">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* CTA */}
                  <Button
                    className="w-full group/btn border-accent text-accent hover:bg-accent hover:text-accent-foreground"
                    variant="outline"
                    onClick={() => {
                      if ((service as any).ctaAction) {
                        (service as any).ctaAction();
                      } else if ((service as any).ctaLink) {
                        window.open((service as any).ctaLink, "_blank");
                      }
                    }}
                  >
                    {service.cta}
                    <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">
            Not Sure Which Service You Need?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
            Book a free consultation with our experts. We'll assess your profile and recommend
            the best services for your study abroad journey.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
              onClick={handleBookCall}
            >
              Book 1 : 1 Call
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      <Footer />

      <AuthPopup
        isOpen={showAuthPopup}
        onClose={() => setShowAuthPopup(false)}
        onAuthSuccess={handleAuthSuccess}
        title="Sign in to book your consultation"
        subtitle="Please sign in to schedule your 1:1 call with our experts"
        initialMode="login"
        skipPortalRedirect={true}
      />

      {showPaymentPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl p-4 w-80 mx-4">

            <div className="text-center mb-4">
              <div className="w-10 h-10 bg-[#C4DFF0] rounded-full flex items-center justify-center mx-auto mb-2">
                <Phone className="w-4 h-4 text-[#2C3539]" />
              </div>
              <h2 className="text-base font-bold text-[#2C3539]">Book Your 1:1 Call</h2>
              <p className="text-xs text-gray-500 mt-0.5">with a UNI 360° expert</p>
            </div>

            {currentUser && (
              <div className="bg-gray-50 rounded-lg p-3 mb-3 border border-gray-100">
                <p className="text-gray-500 text-xs mb-0.5">Booking as:</p>
                <p className="font-semibold text-[#2C3539] text-sm">
                  {currentUser.name || currentUser.fullName || `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim()}
                </p>
                <p className="text-gray-500 text-xs">{currentUser.email}</p>
              </div>
            )}

            <div className="flex items-center justify-between bg-[#C4DFF0]/30 rounded-lg px-3 py-2.5 mb-3 border border-[#C4DFF0]">
              <span className="text-sm text-gray-600">Consultation Fee</span>
              <span className="text-base font-bold text-[#2C3539]">₹1</span>
            </div>

            <ul className="text-xs text-gray-500 space-y-1 mb-3 px-1">
              <li className="flex items-center gap-2"><span className="text-green-500">✓</span> 15-minute 1:1 video call</li>
              <li className="flex items-center gap-2"><span className="text-green-500">✓</span> Personalized university guidance</li>
              <li className="flex items-center gap-2"><span className="text-green-500">✓</span> UK & Germany admission support</li>
            </ul>

            {paymentError && (
              <div className="text-red-500 text-xs bg-red-50 border border-red-200 rounded-lg p-2 mb-3">
                {paymentError}
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => { setShowPaymentPopup(false); setPaymentError(''); }}
                disabled={paymentLoading}
                className="flex-1 h-9 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePayNow}
                disabled={paymentLoading}
                className="flex-1 h-9 rounded-lg bg-[#2C3539] text-white text-sm font-semibold hover:bg-[#3a454a] disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
              >
                {paymentLoading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Processing...
                  </>
                ) : 'Pay ₹1 & Book'}
              </button>
            </div>

            <p className="text-xs text-center text-gray-400 mt-2 flex items-center justify-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              Secured by Razorpay
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Services;