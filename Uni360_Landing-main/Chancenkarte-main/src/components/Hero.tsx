import {
  GraduationCap,
  MapPin,
  Briefcase,
  Plane,
  Building2,
  GraduationCapIcon,
} from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  useCarousel,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";
import Autoplay from "embla-carousel-autoplay";
import { useRef } from "react";


const CarouselDots = () => {
  const { selectedIndex } = useCarousel();


  return (
    <div className="flex justify-center gap-2">
      {[0, 1, 2].map((index) => (
        <div
          key={index}
          className={cn(
            "w-2 h-2 rounded-full transition-colors",
            index === selectedIndex ? "bg-tigers-eye" : "bg-tigers-eye/30"
          )}
        />
      ))}
    </div>
  );
};


interface HeroProps {
  onCheckEligibility: () => void;
}


export const Hero = ({ onCheckEligibility }: HeroProps) => {
  const plugin = useRef(
    Autoplay({
      delay: 3000,
      stopOnInteraction: false,
      playOnInit: true,
      active: true,
    })
  );


  return (
 
  <section className="relative overflow-hidden bg-gradient-to-br from-off-white via-cb10 to-columbia-blue">
    <div className="container mx-auto px-4 sm:px-6 lg:px-4 py-8 sm:py-12 lg:py-16 xl:py-10">
      <div className="grid lg:grid-cols-2 gap-8 sm:gap-10 lg:gap-12 items-center">
        {/* Left Column - Content */}
        <div className="space-y-6 sm:space-y-8 animate-fade-in-up order-1 lg:order-1">
          <div className="space-y-4 sm:space-y-6">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-satoshi font-bold text-gunmetal leading-tight">
              Want to work in <span className="text-tigers-eye">Germany</span>{" "}
              — but haven't landed a job offer yet?
            </h1>


            <p className="text-lg sm:text-xl text-gunmetal/70 leading-relaxed max-w-lg">
              Answer a few simple questions and instantly see if you're on
              track.
            </p>
          </div>
         
          <button
            onClick={() => {
              window.history.pushState(null, '', '#eligibility-checker');
              onCheckEligibility();
            }}
            className="bg-tigers-eye hover:bg-tigers-eye/90 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-chancenkarte text-base sm:text-lg font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg w-full sm:w-auto"
          >
            Check My Eligibility
          </button>


          {/* Trust indicators */}
            <div className="flex flex-col sm:flex-row sm:flex-wrap gap-4 sm:gap-6 items-start sm:items-center pt-6 sm:pt-8 border-t border-gunmetal/10">
              {/* Mobile: First two items side by side */}
              <div className="flex justify-between w-full sm:contents">
                <div className="flex items-center gap-2 text-gunmetal/60">
                  <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5 text-sage-green" />
                  <span className="text-sm">Study Abroad Experts</span>
                </div>
                <div className="flex items-center gap-2 text-gunmetal/60">
                  <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-sage-green" />
                  <span className="text-sm">Germany Specialists</span>
                </div>
              </div>
              {/* Mobile: Third item centered, SM+: normal flow */}
              <div className="flex justify-center w-full sm:w-auto sm:justify-start">
                <div className="flex items-center gap-2 text-gunmetal/60">
                  <Briefcase className="w-4 h-4 sm:w-5 sm:h-5 text-sage-green" />
                  <span className="text-sm">Career Success</span>
                </div>
              </div>
            </div>
          </div>


          {/* Right Column - Rotating Cards Carousel */}
          <div className="relative order-2 lg:order-2 px-2 sm:px-0">
            <Carousel
              plugins={[plugin.current]}
              className="w-full max-w-[280px] sm:max-w-sm md:max-w-md mx-auto"
            >
              <CarouselContent>
                {/* Card 1: Visual Illustration - IMPROVED CONTENT SIZING */}
                <CarouselItem>
                  <div className="relative bg-gradient-to-br from-columbia-blue/20 to-pale-mint/30 backdrop-blur-sm rounded-xl sm:rounded-2xl md:rounded-3xl p-4 sm:p-6 md:p-8 border border-white/30 min-h-[320px] sm:min-h-[380px]">
                    <div className="space-y-3 sm:space-y-4 md:space-y-6">
                      {/* Passport mockup - Larger content */}
                      <div className="bg-gunmetal rounded-lg p-3.5 sm:p-4 md:p-5 rotate-2 shadow-xl w-fit mx-auto sm:mx-0">
                        <div className="flex items-center gap-2.5 sm:gap-3 md:gap-4 mb-2.5 sm:mb-3 md:mb-4">
                          <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4 bg-tigers-eye rounded-full"></div>
                          <div className="text-white text-sm sm:text-base md:text-lg font-semibold">
                            PASSPORT
                          </div>
                        </div>
                        <div className="space-y-1.5 sm:space-y-2 md:space-y-3">
                          <div className="h-1.5 sm:h-2 md:h-3 bg-white/30 rounded w-20 sm:w-24 md:w-28"></div>
                          <div className="h-1.5 sm:h-2 md:h-3 bg-white/30 rounded w-14 sm:w-16 md:w-20"></div>
                        </div>
                      </div>


                      {/* German flag colors - Larger */}
                      <div className="flex gap-1.5 sm:gap-2 md:gap-3 -rotate-1 justify-center sm:justify-start">
                        <div className="w-10 sm:w-12 md:w-16 h-3 sm:h-4 md:h-5 bg-black rounded"></div>
                        <div className="w-10 sm:w-12 md:w-16 h-3 sm:h-4 md:h-5 bg-red-600 rounded"></div>
                        <div className="w-10 sm:w-12 md:w-16 h-3 sm:h-4 md:h-5 bg-yellow-400 rounded"></div>
                      </div>


                      {/* Achievement cards - Larger content */}
                      <div className="space-y-2.5 sm:space-y-3 md:space-y-4">
                        <div className="bg-sage-green/20 rounded-lg p-2.5 sm:p-3 md:p-4 flex items-center gap-2.5 sm:gap-3 md:gap-4">
                          <div className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 bg-sage-green rounded-full flex items-center justify-center flex-shrink-0">
                            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 md:w-2.5 md:h-2.5 bg-white rounded-full"></div>
                          </div>
                          <span className="text-gunmetal font-medium text-sm sm:text-base md:text-lg">
                            Degree Certified
                          </span>
                        </div>
                        <div className="bg-sage-green/20 rounded-lg p-2.5 sm:p-3 md:p-4 flex items-center gap-2.5 sm:gap-3 md:gap-4">
                          <div className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 bg-sage-green rounded-full flex items-center justify-center flex-shrink-0">
                            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 md:w-2.5 md:h-2.5 bg-white rounded-full"></div>
                          </div>
                          <span className="text-gunmetal font-medium text-sm sm:text-base md:text-lg">
                            Ready to Apply
                          </span>
                        </div>
                        <div className="bg-tigers-eye/20 rounded-lg p-2.5 sm:p-3 md:p-4 flex items-center gap-2.5 sm:gap-3 md:gap-4">
                          <div className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 bg-tigers-eye rounded-full flex items-center justify-center flex-shrink-0">
                            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 md:w-2.5 md:h-2.5 bg-white rounded-full"></div>
                          </div>
                          <span className="text-gunmetal font-medium text-sm sm:text-base md:text-lg">
                            Fly. Work. Settle
                          </span>
                        </div>
                      </div>
                    </div>


                    {/* Floating elements - Same as original */}
                    <div className="absolute -top-2 -right-2 sm:-top-3 sm:-right-3 md:-top-4 md:-right-4 w-4 h-4 sm:w-6 sm:h-6 md:w-8 md:h-8 bg-tigers-eye rounded-full animate-bounce"></div>
                    <div className="absolute -bottom-1 -left-1 sm:-bottom-2 sm:-left-2 w-3 h-3 sm:w-4 sm:h-4 md:w-6 md:h-6 bg-sage-green rounded-full animate-pulse"></div>
                    <Plane className="absolute top-2 right-4 sm:top-3 sm:right-6 md:top-4 md:right-8 w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-tigers-eye/60 rotate-45" />
                  </div>
                </CarouselItem>


                {/* Card 2: Testimonial Highlight - IMPROVED CONTENT SIZING */}
                <CarouselItem>
                  <div className="relative bg-gradient-to-br from-off-white to-sage-green/10 rounded-xl sm:rounded-2xl md:rounded-3xl p-4 sm:p-6 md:p-8 border border-sage-green/20 min-h-[320px] sm:min-h-[380px]">
                    <div className="space-y-3 sm:space-y-4 md:space-y-6 h-full flex flex-col">
                      {/* Quote bubble design - Larger content */}
                      <div className="relative bg-white rounded-lg sm:rounded-xl md:rounded-2xl p-4 sm:p-5 md:p-6 shadow-lg flex-1">
                        <blockquote className="text-gunmetal text-base sm:text-lg md:text-xl leading-relaxed italic text-center sm:text-left">
                          "No job. No visa? Think again. Chancenkarte got me to
                          Berlin in 3 months."
                        </blockquote>
                        {/* Speech bubble tail */}
                        <div className="absolute -bottom-1.5 left-1/2 transform -translate-x-1/2 sm:left-4 sm:transform-none md:left-6 w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4 bg-white rotate-45 border-r border-b border-sage-green/20"></div>
                      </div>


                      {/* Profile section - Larger */}
                      <div className="flex items-center gap-3 sm:gap-4 md:gap-5 justify-center sm:justify-start">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full overflow-hidden border-2 border-tigers-eye shadow-lg flex-shrink-0">
                          <img
                            src="/siddika,jpg-Picsart-AiImageEnhancer.webp"
                            alt="Siddika's photo"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="text-center sm:text-left">
                          <div className="font-semibold text-gunmetal text-base sm:text-lg md:text-xl">
                            Siddika, 29
                          </div>
                          <div className="text-sm sm:text-base md:text-lg text-gunmetal/60">
                            Software Developer, Berlin
                          </div>
                        </div>
                      </div>


                      {/* Success indicators - Larger */}
                      <div className="grid grid-cols-2 gap-2.5 sm:gap-3 md:gap-4 mt-auto">
                        <div className="bg-sage-green/20 rounded-lg p-3 sm:p-4 md:p-5 text-center">
                          <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-sage-green">
                            3
                          </div>
                          <div className="text-sm sm:text-base text-gunmetal/70">Months</div>
                        </div>
                        <div className="bg-tigers-eye/20 rounded-lg p-3 sm:p-4 md:p-5 text-center">
                          <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-tigers-eye">
                            ✓
                          </div>
                          <div className="text-sm sm:text-base text-gunmetal/70">
                            Success
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CarouselItem>


                {/* Card 3: Germany Inspiration - IMPROVED CONTENT SIZING */}
                <CarouselItem>
                  <div className="relative bg-gradient-to-br from-columbia-blue/20 to-off-white rounded-xl sm:rounded-2xl md:rounded-3xl p-4 sm:p-6 md:p-8 border border-columbia-blue/30 min-h-[320px] sm:min-h-[380px]">
                    <div className="space-y-3 sm:space-y-4 md:space-y-6 h-full flex flex-col">
                      <div className="text-center">
                        <h3 className="text-xl sm:text-2xl md:text-3xl font-satoshi font-bold text-gunmetal mb-2 sm:mb-3">
                          Why Germany?
                        </h3>
                        <div className="w-12 sm:w-16 md:w-20 h-1.5 bg-tigers-eye rounded-full mx-auto"></div>
                      </div>


                      {/* Benefits list - Larger content */}
                      <div className="space-y-3 sm:space-y-4 md:space-y-5 flex-1">
                        <div className="flex items-start gap-2.5 sm:gap-3 md:gap-4">
                          <div className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 bg-sage-green/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Briefcase className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 text-sage-green" />
                          </div>
                          <div>
                            <div className="font-semibold text-gunmetal text-sm sm:text-base md:text-lg">
                              #1 for job-seeking visa access
                            </div>
                            <div className="text-xs sm:text-sm md:text-base text-gunmetal/60">
                              Easiest pathway to work in Europe
                            </div>
                          </div>
                        </div>


                        <div className="flex items-start gap-2.5 sm:gap-3 md:gap-4">
                          <div className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 bg-sage-green/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <GraduationCapIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 text-sage-green" />
                          </div>
                          <div>
                            <div className="font-semibold text-gunmetal text-sm sm:text-base md:text-lg">
                              World-class opportunities
                            </div>
                            <div className="text-xs sm:text-sm md:text-base text-gunmetal/60">
                              Top universities and research facilities
                            </div>
                          </div>
                        </div>


                        <div className="flex items-start gap-2.5 sm:gap-3 md:gap-4">
                          <div className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 bg-sage-green/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Building2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 text-sage-green" />
                          </div>
                          <div>
                            <div className="font-semibold text-gunmetal text-sm sm:text-base md:text-lg">
                              Vibrant cities & culture
                            </div>
                            <div className="text-xs sm:text-sm md:text-base text-gunmetal/60">
                              Safety, diversity, and quality of life
                            </div>
                          </div>
                        </div>
                      </div>


                      {/* German skyline silhouette - Larger */}
                      <div className="relative mt-auto">
                        <div className="flex items-end justify-center gap-1 sm:gap-1.5 opacity-20">
                          <div className="w-1.5 h-5 sm:w-2 sm:h-6 md:w-2.5 md:h-8 bg-gunmetal rounded-t"></div>
                          <div className="w-2 h-8 sm:w-2.5 sm:h-10 md:w-3 md:h-12 bg-gunmetal rounded-t"></div>
                          <div className="w-1.5 h-4 sm:w-2 sm:h-5 md:w-2.5 md:h-6 bg-gunmetal rounded-t"></div>
                          <div className="w-2.5 h-10 sm:w-3 sm:h-12 md:w-4 md:h-16 bg-gunmetal rounded-t"></div>
                          <div className="w-1.5 h-6 sm:w-2 sm:h-8 md:w-2.5 md:h-10 bg-gunmetal rounded-t"></div>
                          <div className="w-2 h-9 sm:w-2.5 sm:h-11 md:w-3 md:h-14 bg-gunmetal rounded-t"></div>
                          <div className="w-1.5 h-5 sm:w-2 sm:h-6 md:w-2.5 md:h-8 bg-gunmetal rounded-t"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CarouselItem>
              </CarouselContent>
              <div className="mt-3 sm:mt-4 md:mt-6">
                <CarouselDots />
              </div>
            </Carousel>
          </div>
        </div>
      </div>
    </section>
  );
};
