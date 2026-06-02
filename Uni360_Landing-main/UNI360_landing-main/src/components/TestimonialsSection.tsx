import React, { useState, useEffect } from "react";
import { Star, ArrowRight } from "lucide-react";
import siddika from "/siddika.webp";
import dishant from "/dishant.webp";
import vishal from "/vishal.webp";

interface TestimonialsSectionProps {
  selectedCountries?: string[];
}

const TestimonialsSection = ({ selectedCountries }: TestimonialsSectionProps = {}) => {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  const testimonials = [
    {
      id: 1,
      name: "Siddika",
      university: "TU Munich",
      country: "Germany",
      course: "Computer Science at TU Munich",
      image: siddika,
      quote:
        "UNI 360° made my dream of studying in Germany a reality. Their visa guidance was exceptional, and I'm now working at a top tech company in Munich.",
      rating: 5,
      countryFlag: "DE",
    },
    {
      id: 2,
      name: "Dishant",
      university: "Imperial College London",
      country: "UK",
      course: "Imperial College London",
      image: dishant,
      quote:
        "The SOP writing assistance was incredible. Got into Imperial College with their support!",
      rating: 5,
      countryFlag: "UK",
    },
    {
      id: 3,
      name: "Vishal",
      university: "University of Edinburgh",
      country: "UK",
      course: "University of Edinburgh",
      image: vishal,
      quote:
        "From application to arrival, they were there every step. Highly recommend!",
      rating: 5,
      countryFlag: "UK",
    },
  ];

  // Auto-rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 4000); // Change every 4 seconds

    return () => clearInterval(interval);
  }, [testimonials.length]);

  const handlePortalRedirect = () => {
    window.open("https://students.uni360degree.com/", "_blank");
  };

  return (
    <section id="success-stories" className="py-16 md:py-24 relative overflow-hidden bg-testimonials-gradient">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          
          {/* Left Side: Info Content */}
          <div className="space-y-8">
            <div>
              <div className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary font-semibold text-sm mb-6 border border-primary/20 shadow-sm uppercase tracking-wider">
                Proven Results
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 leading-tight">
                Student Success Stories
              </h2>
              <p className="text-gray-700 text-lg mb-4 leading-relaxed font-medium">
                Hear from students who achieved their study abroad dreams with our expert guidance and unwavering support.
              </p>
              <p className="text-gray-500 leading-relaxed">
                Join thousands of successful students who have trusted UNI 360° to navigate their journey to top universities in Germany and the UK. Our proven process ensures you have the best chance of success.
              </p>
            </div>

            <button
              onClick={handlePortalRedirect}
              className="inline-flex items-center gap-2 px-6 py-3 sm:px-8 sm:py-4 rounded-xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg text-white"
              style={{ background: "linear-gradient(90deg, #E08D3C, #c77a32)" }}
            >
              Visit Student Portal <ArrowRight className="w-5 h-5" />
            </button>
          </div>

          {/* Right Side: Success Stories Carousel */}
          <div className="relative z-10 mt-8 lg:mt-0">
            <div className="relative bg-white rounded-[2rem] p-8 md:p-12 shadow-2xl border border-gray-100/50 overflow-hidden group hover:shadow-primary/10 transition-shadow duration-500">
              {/* Decorative background for the card */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#E08D3C]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none transition-transform duration-1000 group-hover:scale-125"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#C4DFF0]/30 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none transition-transform duration-1000 group-hover:scale-125"></div>
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-10">
                  <h3 className="text-2xl font-bold text-gray-900">
                    Success Stories
                  </h3>
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-accent text-accent" />
                    ))}
                  </div>
                </div>

                {/* Testimonial Carousel */}
                <div className="relative h-64 md:h-56 flex items-center">
                  {testimonials.map((testimonial, index) => (
                    <div
                      key={index}
                      className={`absolute inset-0 transition-all duration-700 ease-in-out ${
                        index === currentTestimonial
                          ? "opacity-100 translate-y-0 scale-100"
                          : "opacity-0 translate-y-8 scale-95 pointer-events-none"
                      }`}
                    >
                      <div className="flex flex-col h-full">
                        <blockquote className="text-gray-700 text-lg md:text-xl font-medium italic mb-8 leading-relaxed">
                          "{testimonial.quote}"
                        </blockquote>
                        
                        <div className="mt-auto flex items-center gap-4">
                          <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[#E08D3C]/20 shadow-md relative group-hover:border-[#E08D3C] transition-colors duration-500 flex-shrink-0">
                            <img
                              src={testimonial.image}
                              alt={testimonial.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <div className="font-bold text-gray-900 text-lg">
                              {testimonial.name}
                            </div>
                            <div className="text-sm font-bold text-[#E08D3C] mb-0.5">
                              {testimonial.course}
                            </div>
                            <div className="text-xs text-gray-500 font-medium">
                              {testimonial.university}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Carousel Pagination Dots */}
                <div className="flex justify-center gap-2 mt-8">
                  {testimonials.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentTestimonial(index)}
                      className={`h-2 rounded-full transition-all duration-300 ${
                        index === currentTestimonial
                          ? "w-8 bg-[#E08D3C]"
                          : "w-2 bg-gray-200 hover:bg-gray-300"
                      }`}
                      aria-label={`Go to slide ${index + 1}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;