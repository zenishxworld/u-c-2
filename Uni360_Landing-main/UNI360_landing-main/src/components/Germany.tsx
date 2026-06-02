import React from 'react';
import { GraduationCap, MapPin, Clock, Users, DollarSign, BookOpen } from 'lucide-react';

interface GermanyProps {
  selectedCountries: string[];
}

export const Germany = ({ selectedCountries }: GermanyProps) => {
  // Don't render if Germany is not selected
  if (!selectedCountries.includes('germany')) {
    return null;
  }
  
  const highlights = [
    {
      icon: <DollarSign className="w-4 h-4" />,
      title: "Low Tuition Fees",
      description: "Minimal or no tuition at public universities"
    },
    {
      icon: <GraduationCap className="w-4 h-4" />,
      title: "Top Universities",
      description: "World-class education and research"
    },
    {
      icon: <Users className="w-4 h-4" />,
      title: "Strong Job Market",
      description: "Acess to Global Companies"
    },
    {
      icon: <BookOpen className="w-4 h-4" />,
      title: "English Programs",
      description: "Thousands of English-taught courses"
    }
  ];

  const quickFacts = [
    { label: "Average Salary", value: "€50,000" },
    { label: "Language", value: "German & English" },
    { label: "Living Cost", value: "€800-1200/month" }
  ];

  return (
    <div className="mx-4 sm:mx-6 lg:mx-8 mt-12 sm:mt-16 lg:mt-24 mb-4 sm:mb-6 lg:mb-8 rounded-xl sm:rounded-2xl lg:rounded-3xl border border-border shadow-[var(--card-shadow)] overflow-hidden hover:shadow-[var(--glow-primary)] transition-all duration-300" style={{backgroundColor: '#f0f4f8ff'}}>
      <div className="flex flex-col lg:grid lg:grid-cols-2 gap-0">
        {/* Image First on Mobile - More compact */}
        <div className="relative h-40 sm:h-64 lg:h-auto lg:min-h-full order-1 lg:order-2">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-tigers-eye/5 z-10"></div>
          <img 
            src="/germany-skyline.jpg" 
            alt="Study in Germany" 
            className="absolute inset-0 w-full h-full object-cover"
            onError={(e) => {
              // Fallback if image doesn't exist
              e.currentTarget.style.display = 'none';
              e.currentTarget.parentElement!.innerHTML = `
                <div class="flex items-center justify-center h-full bg-gradient-to-br from-primary/10 to-tigers-eye/10">
                  <div class="text-center space-y-2 sm:space-y-3 p-3 sm:p-4 lg:p-8">
                    <div class="w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 mx-auto bg-primary/20 rounded-full flex items-center justify-center">
                      <svg class="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 text-primary" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2L2 7v10c0 5.55 3.84 9.74 9 10.16V17h2v10.16c5.16-.42 9-4.61 9-10.16V7l-10-5z"/>
                      </svg>
                    </div>
                    <h3 class="text-base sm:text-lg lg:text-xl font-semibold text-gunmetal">Study in Germany</h3>
                    <p class="text-xs sm:text-sm lg:text-base text-muted-foreground">Excellence in Education</p>
                  </div>
                </div>
              `;
            }}
          />
        </div>

        {/* Content Second on Mobile */}
        <div className="p-3 sm:p-4 lg:p-8 space-y-3 sm:space-y-4 lg:space-y-6 order-2 lg:order-1">
          {/* Header */}
          <div className="flex items-center gap-2 sm:gap-3">
            <img 
              src="/germany-logo.png" 
              alt="Germany Flag" 
              className="w-6 h-4 sm:w-8 sm:h-6 lg:w-10 lg:h-7 object-cover rounded shadow-sm"
            />
            <h2 className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-gunmetal">
              Study in <span className="text-tigers-eye">Germany</span>
            </h2>
          </div>

          {/* Description - Short on mobile, full on tablet+ */}
          <p className="text-xs sm:hidden text-muted-foreground leading-relaxed">
            World-class education with minimal costs and excellent career opportunities in Europe's economic powerhouse.
          </p>
          <p className="hidden sm:block text-sm lg:text-base text-muted-foreground leading-relaxed">
            Germany offers world-class education with minimal costs, excellent research opportunities, 
            and strong industry connections. With 400+ universities and English-taught programs, 
            it's ideal for international students seeking quality education and career growth.
          </p>

          {/* Key Highlights - Compressed on mobile */}
          <div className="space-y-1.5 sm:space-y-3 lg:space-y-4">
            <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gunmetal flex items-center gap-1.5 sm:gap-2">
              <MapPin className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-tigers-eye" />
              <span className="sm:hidden">Highlights</span>
              <span className="hidden sm:inline">Why Choose Germany?</span>
            </h3>
            
            <div className="grid grid-cols-2 sm:grid-cols-2 gap-1.5 sm:gap-3">
              {highlights.map((highlight, index) => (
                <div key={index} className="flex items-start gap-1.5 sm:gap-2.5 p-1.5 sm:p-2.5 lg:p-3 bg-secondary/10 rounded-md sm:rounded-xl border border-secondary/20 hover:bg-secondary/20 transition-colors duration-200">
                  <div className="text-tigers-eye mt-0.5 flex-shrink-0">
                    {highlight.icon}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-medium text-gunmetal text-xs sm:text-xs lg:text-sm leading-tight">{highlight.title}</h4>
                    <p className="hidden sm:block text-xs text-muted-foreground mt-0.5 sm:mt-1 leading-tight">{highlight.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Facts - Compressed on mobile */}
          <div className="space-y-1.5 sm:space-y-3">
            <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gunmetal flex items-center gap-1.5 sm:gap-2">
              <Clock className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-tigers-eye" />
              Quick Facts
            </h3>
            
            <div className="space-y-1 sm:space-y-2">
              {quickFacts.map((fact, index) => (
                <div key={index} className="flex justify-between items-center py-0.5 sm:py-1.5 lg:py-2 border-b border-border/50 last:border-b-0">
                  <span className="font-medium text-gunmetal text-xs sm:text-xs lg:text-sm">{fact.label}:</span>
                  <span className="text-muted-foreground text-xs sm:text-xs lg:text-sm text-right">{fact.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};