import React from 'react';
import { GraduationCap, MapPin, Clock, Users, Globe, BookOpen } from 'lucide-react';

interface UKProps {
  selectedCountries: string[];
}

export const UK = ({ selectedCountries }: UKProps) => {
  // Don't render if UK is not selected
  if (!selectedCountries.includes('uk')) {
    return null;
  }
  
  const highlights = [
    {
      icon: <GraduationCap className="w-4 h-4" />,
      title: "Prestigious Universities",
      description: "Home to Oxford, Cambridge & top institutions"
    },
    {
      icon: <Globe className="w-4 h-4" />,
      title: "Global Recognition",
      description: "Degrees recognized worldwide"
    },
    {
      icon: <Users className="w-4 h-4" />,
      title: "Diverse Community",
      description: "Students from 200+ countries"
    },
    {
      icon: <BookOpen className="w-4 h-4" />,
      title: "Quality Assurance",
      description: "Rigorous standards & assessments"
    }
  ];

  const quickFacts = [
    { label: "Average Salary", value: "£45,000" },
    { label: "Language", value: "English (Native)" },
    { label: "Living Cost", value: "£12,000-15,000/year" }
  ];

  return (
    <div className="mx-4 sm:mx-6 lg:mx-8 mt-4 sm:mt-16 lg:mt-24 mb-4 sm:mb-6 lg:mb-8 rounded-xl sm:rounded-2xl lg:rounded-3xl border border-border shadow-[var(--card-shadow)] overflow-hidden hover:shadow-[var(--glow-primary)] transition-all duration-300" style={{backgroundColor: '#f0f4f8ff'}}>
      <div className="flex flex-col lg:grid lg:grid-cols-2 gap-0">
        {/* Image First on Mobile - More compact */}
        <div className="relative h-40 sm:h-64 lg:h-auto lg:min-h-full order-1 lg:order-2">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-tigers-eye/5 z-10"></div>
          <img 
            src="/uk-skyline.jpg" 
            alt="Study in United Kingdom" 
            className="absolute inset-0 w-full h-full object-cover"
            onError={(e) => {
              // Fallback if image doesn't exist
              e.currentTarget.style.display = 'none';
              e.currentTarget.parentElement!.innerHTML = `
                <div class="flex items-center justify-center h-full bg-gradient-to-br from-primary/10 to-tigers-eye/10">
                  <div class="text-center space-y-2 sm:space-y-3 p-3 sm:p-4 lg:p-8">
                    <div class="w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 mx-auto bg-primary/20 rounded-full flex items-center justify-center">
                      <svg class="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 text-primary" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                      </svg>
                    </div>
                    <h3 class="text-base sm:text-lg lg:text-xl font-semibold text-gunmetal">Study in United Kingdom</h3>
                    <p class="text-xs sm:text-sm lg:text-base text-muted-foreground">Tradition Meets Innovation</p>
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
              src="/uk-logo.png" 
              alt="UK Flag" 
              className="w-6 h-4 sm:w-8 sm:h-6 lg:w-10 lg:h-7 object-cover rounded shadow-sm"
            />
            <h2 className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-gunmetal">
              Study in <span className="text-tigers-eye">United Kingdom</span>
            </h2>
          </div>

          {/* Description - Short on mobile, full on tablet+ */}
          <p className="text-xs sm:hidden text-muted-foreground leading-relaxed">
            Home to Oxford & Cambridge with prestigious degrees recognized worldwide and excellent post-study opportunities.
          </p>
          <p className="hidden sm:block text-sm lg:text-base text-muted-foreground leading-relaxed">
            The UK has been a beacon of academic excellence for centuries, hosting prestigious 
            universities like Oxford and Cambridge. With shorter degree durations, excellent 
            post-study work opportunities, and globally recognized qualifications, it's ideal 
            for ambitious international students.
          </p>

          {/* Key Highlights - Compressed on mobile */}
          <div className="space-y-1.5 sm:space-y-3 lg:space-y-4">
            <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gunmetal flex items-center gap-1.5 sm:gap-2">
              <MapPin className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-tigers-eye" />
              <span className="sm:hidden">Highlights</span>
              <span className="hidden sm:inline">Why Choose the UK?</span>
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