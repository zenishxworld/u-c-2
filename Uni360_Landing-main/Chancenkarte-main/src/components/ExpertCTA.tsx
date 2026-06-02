import { useState } from 'react';
import { Calendar, CheckCircle } from 'lucide-react';
import { BookingForm } from './BookingForm';

interface ExpertCTAProps {
  submissionId?: string | null;
}

export const ExpertCTA = ({ submissionId }: ExpertCTAProps) => {
  const [isBookingFormOpen, setIsBookingFormOpen] = useState(false);

  return (
    <section className="py-12 sm:py-16 lg:py-24 bg-gradient-to-r from-sage-green to-sage-green/80 animate-fade-in-up">
      <div className="container mx-auto px-4 sm:px-6 lg:px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 sm:gap-10 lg:gap-12 items-center">
            {/* Left Column */}
            <div className="text-center lg:text-left order-2 lg:order-1">
              <div className="mb-6 sm:mb-8">
                <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-3 sm:px-4 py-2 mb-4 sm:mb-6">
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  <span className="text-white font-medium text-sm sm:text-base">Eligible for Chancenkarte</span>
                </div>

                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-satoshi font-bold text-white mb-4 sm:mb-6">
                  You're Eligible — Let's Turn That Into a Plan
                </h2>

                <p className="text-sm sm:text-xl text-white/90 mb-4 sm:mb-6 leading-relaxed">
                  Schedule a 15-min expert call for just{' '}
                  <span className="font-bold text-tigers-eye">₹349</span>
                  <span className="line-through text-white/60 ml-2">₹499</span>
                </p>

                <p className="text-tigers-eye mb-8 mb-6 sm:mb-8 text-sm sm:text-base">
                  That's just the cost of a pizza — and it's totally worth it.
                </p>
              </div>

              <button
                onClick={() => setIsBookingFormOpen(true)}
                className="bg-tigers-eye hover:bg-tigers-eye/90 text-white px-8 sm:px-12 py-3 sm:py-4 rounded-chancenkarte text-base sm:text-lg font-semibold transition-all duration-300 hover:scale-105 hover:shadow-2xl inline-flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-center"
              >
                <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
                Book My Call
              </button>

              <div className="grid grid-cols-3 gap-4 sm:gap-6 mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-white/20">
                <div className="text-center">
                  <div className="text-lg sm:text-2xl font-satoshi font-bold text-white mb-1 sm:mb-2">15 min</div>
                  <div className="text-white/80 text-xs sm:text-sm">Expert consultation</div>
                </div>
                <div className="text-center">
                  <div className="text-lg sm:text-2xl font-satoshi font-bold text-white mb-1 sm:mb-2">₹349</div>
                  <div className="text-white/80 text-xs sm:text-sm">One-time fee</div>
                </div>
                <div className="text-center">
                  <div className="text-lg sm:text-2xl font-satoshi font-bold text-white mb-1 sm:mb-2">500+</div>
                  <div className="text-white/80 text-xs sm:text-sm">Success stories</div>
                </div>
              </div>
            </div>

            {/* Right Column – Expert Profile */}
            <div className="bg-white/10 backdrop-blur-sm rounded-chancenkarte p-6 sm:p-8 border border-white/20 order-1 lg:order-2">
              <div className="text-center mb-4 sm:mb-6">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden mx-auto mb-3 sm:mb-4 border-4 border-tigers-eye shadow-lg">
                  <img src="./Akshar.webp" alt="Profile" className="w-full h-full object-cover" />
                </div>
                <h3 className="text-xl sm:text-2xl font-satoshi font-bold text-white mb-2">Akshar Tank</h3>
                <p className="text-white/80 mb-4 text-sm sm:text-base">Founder, UNI 360°</p>
              </div>

              <div className="space-y-3 sm:space-y-4 text-white/90">
                <div className="flex items-start gap-2 sm:gap-3">
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-700 flex-shrink-0 mt-0.5" />
                  <span className="text-xs sm:text-sm">15+ years of experience helping students navigate education systems worldwide</span>
                </div>
                <div className="flex items-start gap-2 sm:gap-3">
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-700 flex-shrink-0 mt-0.5" />
                  <span className="text-xs sm:text-sm">500+ successful applications</span>
                </div>
                <div className="flex items-start gap-2 sm:gap-3">
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-700 flex-shrink-0 mt-0.5" />
                  <span className="text-xs sm:text-sm">Expert in German visa processes</span>
                </div>
              </div>

              <blockquote className="mt-4 sm:mt-6 p-3 sm:p-4 bg-white/5 rounded-lg border-l-4 border-tigers-eye">
                <p className="text-white/90 italic text-xs sm:text-sm">
                  "Let's make Germany happen — the right way. I've helped hundreds of students and professionals navigate this journey successfully.
                  <span className="text-tigers-eye"> Now it's your turn.</span>"
                </p>
              </blockquote>
            </div>
          </div>
        </div>
      </div>

      <BookingForm
        isOpen={isBookingFormOpen}
        onClose={() => setIsBookingFormOpen(false)}
        submissionId={submissionId}
      />
    </section>
  );
};