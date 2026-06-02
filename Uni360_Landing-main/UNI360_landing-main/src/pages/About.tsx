import React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  ArrowRight,
  Target,
  Users,
  Award,
  Globe,
  CheckCircle,
  Star,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import siddika from "/siddika.webp";
import dishant from "/dishant.webp";
import vishal from "/vishal.webp";
import heroImage from "@/assets/hero-image1.webp";
import admissionImg from "@/assets/admission-counselling.webp";
import campusImg from "@/assets/hero-campus-germany.webp";
import sopImg from "@/assets/SOP-writing.webp";
import visaImg from "@/assets/visa-support.webp";
import arrivalImg from "@/assets/arrival.webp";
import jobImg from "@/assets/job-assist.webp";

const About = () => {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([
    "germany",
    "uk",
  ]);

  // Individual digit slot component for slot machine animation
  const DigitSlot = ({
    finalDigit,
    delay = 0,
    duration = 1200,
    className = "",
    isVisible = false,
  }) => {
    const [currentDigit, setCurrentDigit] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
      if (!isVisible) return;

      const startAnimation = () => {
        setIsAnimating(true);
        let iterations = 0;
        const totalSpins = 8 + Math.floor(Math.random() * 4); // 8-12 spins total

        intervalRef.current = setInterval(() => {
          if (iterations < totalSpins - 1) {
            setCurrentDigit(Math.floor(Math.random() * 10));
          } else {
            setCurrentDigit(parseInt(finalDigit));
            if (intervalRef.current) clearInterval(intervalRef.current);
            setIsAnimating(false);
          }
          iterations++;
        }, duration / totalSpins); // Evenly distribute spins over duration
      };

      timeoutRef.current = setTimeout(startAnimation, delay);

      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
      };
    }, [finalDigit, delay, duration, isVisible]);

    return (
      <div className={`relative overflow-hidden ${className}`}>
        <div className="transition-all duration-100 ease-in-out">
          {currentDigit}
        </div>
      </div>
    );
  };

  // Slot machine number component
  const SlotMachineNumber = ({
    finalNumber,
    delay = 0,
    duration = 1200,
    className = "text-3xl lg:text-4xl font-bold text-accent",
    isVisible = false,
    prefix = "",
    suffix = "",
  }) => {
    const digits = finalNumber.toString().split("");

    return (
      <div className="flex justify-center items-center">
        {prefix && <span className={className}>{prefix}</span>}
        {digits.map((digit, index) => (
          <DigitSlot
            key={index}
            finalDigit={digit}
            delay={delay + index * 50} // Shorter stagger - 50ms between digits
            duration={duration}
            className={className}
            isVisible={isVisible}
          />
        ))}
        {suffix && <span className={className}>{suffix}</span>}
      </div>
    );
  };

  // Intersection Observer hook
  const useInView = (threshold = 0.1) => {
    const [isInView, setIsInView] = useState(false);
    const ref = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsInView(true);
          }
        },
        { threshold }
      );

      if (ref.current) {
        observer.observe(ref.current);
      }

      return () => {
        if (ref.current) {
          observer.unobserve(ref.current);
        }
      };
    }, [threshold]);

    return [ref, isInView];
  };

  // Use intersection observer for stats visibility
  const [statsRef, statsVisible] = useInView(0.3);

  const testimonials = [
    {
      name: "Siddika",
      photo: siddika,
      university: "TU Munich",
      program: "Computer Science",
      quote:
        "UNI 360° made my dream of studying in Germany a reality. Their visa guidance was exceptional, and I'm now working at a top tech company in Munich.",
      rating: 5,
    },
    {
      name: "Dishant",
      photo: dishant,
      university: "Imperial College London",
      program: "MSc Program",
      quote:
        "The SOP writing assistance was incredible. Got into Imperial College with their support!",
      rating: 5,
    },
    {
      name: "Vishal",
      photo: vishal,
      university: "University of Edinburgh",
      program: "MSc Program",
      quote:
        "From application to arrival, they were there every step. Highly recommend!",
      rating: 5,
    },
  ];

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Auto-rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 4000); // Change every 4 seconds

    return () => clearInterval(interval);
  }, [testimonials.length]);

  const handleServicesRedirect = () => {
    window.open("https://students.uni360degree.com/", "_blank");
  };

  const stats = [
    { number: "7000", label: "Students Helped", suffix: "+" },
    { number: "98", label: "Visa Success Rate", suffix: "%" },
    { number: "100", label: "Partner Universities", suffix: "+" },
    { number: "12", label: "Years Experience", suffix: "+" },
  ];

  const values = [
    {
      icon: Target,
      title: "Student-Centric Approach",
      description:
        "Every decision we make is focused on student success and satisfaction",
    },
    {
      icon: Users,
      title: "Personalized Guidance",
      description:
        "Tailored support based on individual goals, background, and aspirations",
    },
    {
      icon: Award,
      title: "Excellence & Quality",
      description:
        "Maintaining the highest standards in service delivery and outcomes",
    },
    {
      icon: Globe,
      title: "Global Network",
      description:
        "Strong partnerships with universities and institutions worldwide",
    },
  ];

  return (
    <div className="min-h-screen mt-24">
      {/* Navigation */}
      <Navigation
        selectedCountries={selectedCountries}
        onCountrySelect={setSelectedCountries}
      />
      {/* Hero Section */}
      <section 
        className="relative bg-primary text-white py-20 overflow-hidden bg-cover bg-center"
        style={{
          backgroundImage: `url(${heroImage})`,
          backgroundAttachment: 'fixed',
        }}
      >
        {/* Blurred overlay with gunmetal color */}
        <div className="absolute inset-0 bg-primary/50"></div>
        
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 drop-shadow-lg">
            About UNI 360°
          </h1>
          <p className="text-lg md:text-xl text-white/95 max-w-3xl mx-auto mb-8 leading-relaxed drop-shadow-md">
            We're dedicated to making study abroad dreams accessible to students
            worldwide. Our comprehensive 360° approach ensures success at every
            step of your international education journey.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            
            <Button
              variant="outline"
              size="lg"
              className="bg-transparent border-2 border-white text-white hover:bg-accent hover:text-white hover:border-accent px-6 py-3 sm:px-8 sm:py-4 rounded-lg font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg text-sm sm:text-base drop-shadow-md"
              onClick={handleServicesRedirect}>
              Explore Our Portal
            </Button>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 md:py-24 relative overflow-hidden bg-testimonials-gradient">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            
            {/* Left Side: Mission Content */}
            <div className="space-y-8">
              <div>
                <div className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary font-semibold text-sm mb-6 border border-primary/20 shadow-sm uppercase tracking-wider">
                  Our Core Purpose
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 leading-tight">
                  Democratizing Global Education
                </h2>
                <p className="text-gray-700 text-lg mb-4 leading-relaxed font-medium">
                  We bridge the gap between ambitious students and world-class universities, providing comprehensive support that transforms study abroad dreams into reality.
                </p>
                <p className="text-gray-500 leading-relaxed">
                  We believe quality education should be accessible to every deserving student. Our mission is to provide expert guidance, transparent processes, and unwavering support to make your global journey seamless.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { text: "Empowering students globally", icon: Target },
                  { text: "Building cultural bridges", icon: Globe },
                  { text: "Creating career pathways", icon: Award },
                  { text: "Fostering lifelong success", icon: Users },
                ].map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <div key={index} className="group relative p-5 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-500 hover:-translate-y-1 overflow-hidden cursor-default flex items-center gap-4">
                      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white group-hover:rotate-6 transition-all duration-500 relative z-10 flex-shrink-0">
                        <Icon className="w-6 h-6" />
                      </div>
                      <span className="font-bold text-gray-800 group-hover:text-primary transition-colors duration-300 relative z-10 leading-tight">
                        {item.text}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Side: Success Stories Carousel */}
            <div className="relative z-10 mt-8 lg:mt-0">
              <div className="relative bg-white rounded-[2rem] p-8 md:p-12 shadow-2xl border border-gray-100/50 overflow-hidden group hover:shadow-primary/10 transition-shadow duration-500">
                {/* Decorative background for the card */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-accent/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none transition-transform duration-1000 group-hover:scale-125"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none transition-transform duration-1000 group-hover:scale-125"></div>
                
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
                          <blockquote className="text-gray-700 text-xl font-medium italic mb-8 leading-relaxed">
                            "{testimonial.quote}"
                          </blockquote>
                          
                          <div className="mt-auto flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-primary/20 shadow-md relative group-hover:border-primary transition-colors duration-500 flex-shrink-0">
                              <img
                                src={testimonial.photo}
                                alt={testimonial.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div>
                              <div className="font-bold text-gray-900 text-lg">
                                {testimonial.name}
                              </div>
                              <div className="text-sm font-bold text-primary mb-0.5">
                                {testimonial.program}
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

                  {/* Progress dots */}
                  <div className="flex justify-start space-x-3 mt-8">
                    {testimonials.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentTestimonial(index)}
                        className={`transition-all duration-300 rounded-full ${
                          index === currentTestimonial
                            ? "w-8 h-2.5 bg-primary shadow-sm"
                            : "w-2.5 h-2.5 bg-gray-200 hover:bg-primary/40"
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

      {/* Stats Section */}
      <section className="py-20 md:py-28 relative overflow-hidden bg-primary">
        {/* Subtle dot pattern in white */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4xKSIvPjwvc3ZnPg==')] opacity-100"></div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight">
              Our Impact in Numbers
            </h2>
            <p className="text-white/80 text-lg max-w-2xl mx-auto font-medium">
              Over a decade of excellence in international education consulting, transforming thousands of dreams into reality.
            </p>
          </div>

          <div ref={statsRef} className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {stats.map((stat, index) => {
              const statIcons = [Users, Target, Globe, Award];
              const Icon = statIcons[index];
              return (
                <div key={index} className="group relative bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20 hover:bg-white/20 hover:border-white/40 transition-all duration-500 hover:-translate-y-2 flex flex-col items-center text-center overflow-hidden shadow-lg hover:shadow-2xl">
                  
                  {/* Hover Light Effect */}
                  <div className="absolute inset-0 bg-gradient-to-t from-white/0 via-white/5 to-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

                  {/* Icon */}
                  <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mb-6 text-white group-hover:scale-110 group-hover:bg-accent transition-all duration-500 shadow-inner group-hover:shadow-lg relative z-10">
                    <Icon className="w-8 h-8" />
                  </div>

                  <div className="mb-3 relative z-10">
                    <SlotMachineNumber
                      finalNumber={parseInt(stat.number)}
                      delay={index * 100}
                      duration={1500}
                      className="text-4xl lg:text-5xl font-extrabold text-white tracking-tight drop-shadow-sm"
                      isVisible={statsVisible}
                      suffix={stat.suffix || ""}
                    />
                  </div>
                  <div
                    className={`text-white/80 text-sm md:text-base font-semibold transition-all duration-700 delay-[1200ms] group-hover:text-white uppercase tracking-wider ${
                      statsVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                    }`}>
                    {stat.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Combined Section Wrapper for continuous background */}
      <div className="bg-testimonials-gradient relative overflow-hidden">
        {/* Subtle dot pattern */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMCwwLDAsMC4wNSkiLz48L3N2Zz4=')] opacity-100"></div>
        </div>

        {/* How We Work */}
        <section className="py-12 md:py-16 relative z-10">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3 tracking-tight">
                How We Work
              </h2>
              <p className="text-muted-foreground text-base max-w-2xl mx-auto">
                Our proven methodology ensures comprehensive support throughout
                your study abroad journey
              </p>
            </div>

            <div className="relative max-w-4xl mx-auto">
              {/* Vertical Line */}
              <div className="absolute left-6 md:left-1/2 top-4 bottom-4 w-1 bg-gradient-to-b from-primary/10 via-primary/30 to-primary/10 md:transform md:-translate-x-1/2 rounded-full z-0"></div>

              <div className="space-y-8">
                {[
                  {
                    step: "01",
                    title: "Personalized Assessment",
                    description: "We start by understanding your academic background, career goals, and personal preferences to create a tailored strategy.",
                    icon: Target,
                    image: admissionImg,
                  },
                  {
                    step: "02",
                    title: "University Selection",
                    description: "Based on your profile, we recommend the best-fit universities and programs that align with your aspirations.",
                    icon: Globe,
                    image: campusImg,
                  },
                  {
                    step: "03",
                    title: "Application Support",
                    description: "Our experts guide you through every aspect of the application process, from essays to interviews.",
                    icon: Award,
                    image: sopImg,
                  },
                  {
                    step: "04",
                    title: "Visa & Documentation",
                    description: "Complete assistance with visa applications, financial documentation, and pre-departure preparations.",
                    icon: CheckCircle,
                    image: visaImg,
                  },
                  {
                    step: "05",
                    title: "Pre-Arrival Orientation",
                    description: "Comprehensive briefing on academic expectations, cultural adaptation, and practical living arrangements.",
                    icon: Users,
                    image: arrivalImg,
                  },
                  {
                    step: "06",
                    title: "Ongoing Support",
                    description: "Continued guidance throughout your studies and assistance with career planning and job placement.",
                    icon: Star,
                    image: jobImg,
                  }
                ].map((item, index) => {
                  const isEven = index % 2 === 0;
                  const Icon = item.icon;
                  return (
                    <div key={index} className="relative flex flex-col md:flex-row items-center group">
                      
                      {/* Center Node */}
                      <div className="absolute left-6 md:left-1/2 transform -translate-x-1/2 w-12 h-12 bg-white rounded-full border-4 border-primary/20 flex items-center justify-center z-20 group-hover:border-accent group-hover:bg-accent group-hover:scale-110 transition-all duration-500 shadow-sm group-hover:shadow-md group-hover:shadow-accent/40">
                        <Icon className="w-5 h-5 text-primary group-hover:text-white transition-colors duration-500" />
                      </div>

                      {/* Card Container */}
                      <div className={`w-full pl-20 pr-4 md:pl-0 md:pr-0 md:w-1/2 ${isEven ? 'md:pr-10' : 'md:pl-10 md:order-last'}`}>
                        <div className="relative bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-500 border border-gray-100 hover:border-primary/30 hover:-translate-y-1 z-10 overflow-hidden group-hover:shadow-primary/10 flex flex-col">
                            {/* Accent border line - Desktop */}
                            <div className={`hidden md:block absolute top-0 w-1.5 h-full bg-accent scale-y-0 group-hover:scale-y-100 transition-transform duration-500 z-20 ${isEven ? 'right-0 origin-bottom' : 'left-0 origin-top'}`}></div>
                            
                            {/* Accent border line - Mobile */}
                            <div className="md:hidden absolute top-0 left-0 w-1.5 h-full bg-accent scale-y-0 group-hover:scale-y-100 transition-transform duration-500 z-20 origin-top"></div>

                            {/* Image Section */}
                            <div className="relative h-48 w-full overflow-hidden">
                               <img src={item.image} alt={item.title} className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700 ease-out" />
                               <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                               <div className={`absolute bottom-4 ${isEven ? 'md:right-6 md:left-auto left-6' : 'left-6'} text-4xl font-bold text-white drop-shadow-md z-10 flex items-center gap-2`}>
                                 <span className="text-lg text-white/70 uppercase tracking-widest font-semibold mt-2">Step</span> {item.step}
                               </div>
                            </div>

                            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none z-10"></div>
                            
                            <div className="relative z-10 w-full p-6 bg-white">
                              <h3 className={`text-xl font-bold text-gray-900 mb-2 group-hover:text-primary transition-colors duration-300 ${isEven ? 'md:text-right text-left' : 'text-left'}`}>
                                {item.title}
                              </h3>
                              <p className={`text-sm text-gray-600 leading-relaxed font-medium ${isEven ? 'md:text-right text-left' : 'text-left'}`}>
                                {item.description}
                              </p>
                            </div>
                        </div>
                      </div>
                      
                      {/* Spacer */}
                      <div className="hidden md:block md:w-1/2"></div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="py-16 md:py-24 relative z-10">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 tracking-tight">
                Our Core Values
              </h2>
              <p className="text-gray-500 text-lg max-w-2xl mx-auto font-medium">
                The foundational principles that guide every decision and action we take on behalf of our students.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {values.map((value, index) => {
                const Icon = value.icon;
                return (
                  <div key={index} className="group relative bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-200 hover:border-primary/40 hover:-translate-y-3 overflow-hidden flex flex-col items-center text-center">
                    {/* Decorative background gradient that fades in on hover */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                    
                    {/* Border Accent Line on Top */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-accent scale-x-0 group-hover:scale-x-100 transition-transform duration-700 origin-left"></div>

                    {/* Icon Container */}
                    <div className="relative w-20 h-20 mb-6 rounded-2xl bg-primary/5 flex items-center justify-center group-hover:bg-primary group-hover:rotate-6 group-hover:scale-110 transition-all duration-500 shadow-inner group-hover:shadow-primary/30 z-10">
                      <Icon className="w-10 h-10 text-primary group-hover:text-white transition-colors duration-500" />
                    </div>
                    
                    <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-primary transition-colors duration-300 relative z-10">
                      {value.title}
                    </h3>
                    
                    <p className="text-gray-600 text-sm leading-relaxed relative z-10 font-medium">
                      {value.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default About;