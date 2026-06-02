
import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export const Uni360Popup = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if popup has been shown before in this session
    const hasBeenShown = sessionStorage.getItem('uni360PopupShown');
    
    if (!hasBeenShown) {
      // Show popup after 3 seconds only if it hasn't been shown before
      const timer = setTimeout(() => {
        setIsVisible(true);
        // Mark popup as shown for this session
        sessionStorage.setItem('uni360PopupShown', 'true');
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-chancenkarte p-8 max-w-md w-full shadow-xl animate-fade-in-up">
        <div className="flex justify-center items-start mb-6 relative">
          <img 
    src="./Uni360 logo.png" 
    alt="UNI360 Logo" 
    className="w-20 h-20 object-contain relative top-6"
  />
          <button 
            onClick={handleClose}
            className="absolute top-0 right-0 text-gunmetal/60 hover:text-gunmetal transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="text-center">
          <h3 className="text-xl font-satoshi font-bold text-gunmetal mb-4">
            Meet UNI 360° – Your Complete Study Abroad Companion
          </h3>

          <p className="text-gunmetal/70 mb-6">
            From exam prep to visa assistance, we help you unlock opportunities
            in Germany with ease.
          </p>

          <div className="flex items-center justify-center gap-2 mb-6">
          </div>

          <button
  onClick={() => window.open('https://uni360degree.com/', '_blank')}
  className="bg-tigers-eye hover:bg-tigers-eye/90 text-white px-8 py-3 rounded-chancenkarte font-semibold transition-all duration-300 hover:scale-105 w-full"
>
  Get Early Access
</button>
        </div>
      </div>
    </div>
  );
};