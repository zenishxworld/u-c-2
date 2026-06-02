import { Mail, Phone, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Footer = () => {
  const handleScrollToSuccessStories = () => {
    const successStoriesSection = document.getElementById('success-stories');
    if (successStoriesSection) {
      successStoriesSection.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  const handleAddressClick = () => {
    const address = "GF-18, Windsor Plaza, RC Dutt Rd, Vishwas Colony, Alkapuri, Vadodara, Gujarat 390007";
    const encodedAddress = encodeURIComponent(address);
    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
    window.open(googleMapsUrl, '_blank');
  };

  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Section — full width on mobile, normal on md+ */}
          <div className="lg:col-span-1">
            <button 
              onClick={() => window.location.href = '/'}
              className="text-2xl font-bold mb-4 hover:text-accent transition-colors duration-200 flex items-center gap-0 -ml-4"
            >
              <img src="/White_uni360.png" alt="UNI360 Logo" className="h-16 w-auto object-contain translate-y-1 -mr-2" />
              UNI360°
            </button>
            <p className="text-primary-foreground/80 mb-6 max-w-md">
              Your trusted partner for studying in Germany and UK. 
            </p>
            
            {/* Contact Info */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-accent" />
                <a 
                  href="mailto:support@uni360degree.com"
                  className="hover:text-[#E08D3C] transition-colors duration-200"
                >
                  support@uni360degree.com
                </a>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-accent" />
                <a 
                  href="tel:+919876543210"
                  className="hover:text-[#E08D3C] transition-colors duration-200"
                >
                  +91 98765 43210
                </a>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
                <button
                  onClick={handleAddressClick}
                  className="text-left hover:text-[#E08D3C] transition-colors duration-200 cursor-pointer"
                >
                  GF-18, Windsor Plaza, RC Dutt Rd, Vishwas Colony, Alkapuri, Vadodara, Gujarat 390007
                </button>
              </div>
            </div>
          </div>

          {/*
            On mobile: the three link columns sit side-by-side in a single row (3 cols).
            On md+: each column flows naturally in the 4-column grid as before.
          */}
          <div className="col-span-1 md:col-span-1 lg:col-span-3 grid grid-cols-3 md:grid-cols-3 lg:contents gap-4 md:gap-8">

            {/* Company Links */}
            <div className="pt-2 md:pt-4 lg:pt-6">
              <h4 className="text-sm sm:text-lg font-semibold mb-3 md:mb-4">Company</h4>
              <ul className="space-y-2 md:space-y-3">
                <li>
                  <a href="/about" className="text-xs sm:text-base text-primary-foreground/80 hover:text-accent transition-colors duration-200">
                    About Us
                  </a>
                </li>
                <li>
                  <a href="/contact" className="text-xs sm:text-base text-primary-foreground/80 hover:text-accent transition-colors duration-200">
                    Contact
                  </a>
                </li>
              </ul>
            </div>

            {/* Quick Links */}
            <div className="pt-2 md:pt-4 lg:pt-6">
              <h4 className="text-sm sm:text-lg font-semibold mb-3 md:mb-4">Quick Links</h4>
              <ul className="space-y-2 md:space-y-3">
                <li>
                  <a href="/#faq" className="text-xs sm:text-base text-primary-foreground/80 hover:text-accent transition-colors duration-200">
                    FAQs
                  </a>
                </li>
                <li>
                  <button 
                    onClick={handleScrollToSuccessStories}
                    className="text-xs sm:text-base text-primary-foreground/80 hover:text-accent transition-colors duration-200 text-left"
                  >
                    Success Stories
                  </button>
                </li>
              </ul>
            </div>

            {/* Legal Links */}
            <div className="pt-2 md:pt-4 lg:pt-6">
              <h4 className="text-sm sm:text-lg font-semibold mb-3 md:mb-4">Legal</h4>
              <ul className="space-y-2 md:space-y-3">
                <li>
                  <a href="/privacy-policy" className="text-xs sm:text-base text-primary-foreground/80 hover:text-accent transition-colors duration-200">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="/terms-of-service" className="text-xs sm:text-base text-primary-foreground/80 hover:text-accent transition-colors duration-200">
                    Terms & Conditions
                  </a>
                </li>
                <li>
                  <a href="/refund-policy" className="text-xs sm:text-base text-primary-foreground/80 hover:text-accent transition-colors duration-200">
                    Refund & Cancellation
                  </a>
                </li>
                <li>
                  <a href="/pricing" className="text-xs sm:text-base text-primary-foreground/80 hover:text-accent transition-colors duration-200">
                    Pricing Policy
                  </a>
                </li>
              </ul>
            </div>

          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-8 pt-8 border-t border-primary-foreground/20">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-primary-foreground/80">
            <div>
              <p>&copy; 2025 UNI 360°. All rights reserved.</p>
            </div>
            
            <a 
              href="https://mckhtech.com/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 hover:opacity-80 transition-opacity"
            >
              <span>Built and Developed by</span>
              <img src="/mckh white.png" alt="MCKH Logo" className="h-4 w-auto object-contain" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};