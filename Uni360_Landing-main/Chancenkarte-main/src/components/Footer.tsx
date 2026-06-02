import { Linkedin, Instagram, Mail, Phone, MapPin, Heart } from 'lucide-react';
import { Link } from 'react-router-dom'; 

export const Footer = ({ showStartButton = true }: { showStartButton?: boolean })=> {
  const scrollToSection = (sectionId: string) => {
    window.history.pushState(null, '', `#${sectionId}`);
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
  <footer className="bg-gunmetal text-white py-8 sm:py-12">
    <div className="container mx-auto px-4 sm:px-6 lg:px-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12 lg:gap-8 items-center lg:items-start xl:items-center">
        {/* Left - Brand and Contact */}
        <div className="text-center md:text-left order-1">
          <p className="text-white/80 text-xs sm:text-sm mb-2">A product of</p>
          <h3 className="text-xl sm:text-2xl font-satoshi font-bold text-white flex items-center justify-center md:justify-start gap-0 mb-4">
            <img
              src="./White_uni360.png"
              alt="Logo"
              className="h-10 sm:h-14 w-auto object-contain -ml-3 sm:-ml-4 translate-y-0.5 mr-[-4px] sm:mr-[-6px]"
            />
            UNI360°
          </h3>
          <div className="space-y-3 text-white/80 text-sm flex flex-col items-center md:items-start mt-4">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 flex-shrink-0" />
              <a href="mailto:support@uni360degree.com" className="hover:text-white transition-colors">support@uni360degree.com</a>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 flex-shrink-0" />
              <a href="tel:+919876543210" className="hover:text-white transition-colors">+91 98765 43210</a>
            </div>
            <div className="flex items-start gap-2 text-left">
              <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>GF-18, Windsor Plaza, RC Dutt Rd, Vishwas Colony, Alkapuri, Vadodara, Gujarat 390007</span>
            </div>
          </div>
        </div>

        {/* Center - Navigation */}
        <div className="text-center md:text-right lg:text-center order-2">
          <div className="flex flex-wrap justify-center md:justify-end lg:justify-center gap-4 sm:gap-6">
            <button
              onClick={() => scrollToSection('about')}
              className="text-white/80 hover:text-white text-sm transition-colors"
            >
              About
            </button>
            <button
              onClick={() => scrollToSection('faq')}
              className="text-white/80 hover:text-white text-sm transition-colors"
            >
              FAQs
            </button>
            <Link
              to="/privacy"
              className="text-white/80 hover:text-white text-sm transition-colors"
            >
              Privacy
            </Link>
            <Link
              to="/terms"
              className="text-white/80 hover:text-white text-sm transition-colors"
            >
              Terms
            </Link>
            <Link
              to="/cancellation-refund"
              className="text-white/80 hover:text-white text-sm transition-colors"
            >
              Refund
            </Link>
            <Link
              to="/cancellation-rescheduling"
              className="text-white/80 hover:text-white text-sm transition-colors"
            >
              Reschedule
            </Link>
          </div>
        </div>

        {/* Right - Social and Copyright */}
        <div className="text-center md:col-span-2 lg:col-span-1 lg:text-right order-3 mt-4 md:mt-0">
          <div className="flex justify-center lg:justify-end gap-3 sm:gap-4 mb-3 sm:mb-4">
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              className="w-7 h-7 sm:w-8 sm:h-8 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
            >
              <Linkedin className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </a>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="w-7 h-7 sm:w-8 sm:h-8 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
            >
              <Instagram className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </a>
          </div>
          <p className="text-white/60 text-xs">
            © 2025 UNI 360°. All rights reserved.
          </p>
          <div className="flex justify-center lg:justify-end items-center gap-1.5 mt-2 text-white/80 text-xs sm:text-sm font-medium">
            <span>Made with</span>
            <Heart className="w-3 h-3 sm:w-4 sm:h-4 text-tigers-eye" />
            <span>by</span>
            <a 
              href="https://mckhtech.com/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="hover:scale-105 hover:opacity-100 opacity-90 transition-all duration-300 ml-1 block"
            >
              <img 
                src="/mckh white.png" 
                alt="MCKH Tech" 
                className="h-3 sm:h-4 object-contain drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]" 
              />
            </a>
          </div>
        </div>
      </div>



      <div className="border-t border-white/20 mt-6 sm:mt-8 pt-6 sm:pt-8 text-center">
        <p className="text-white/60 text-sm">
          Helping students and professionals achieve their dreams in Germany.
        </p>
      </div>
    </div>
  </footer>
);
};