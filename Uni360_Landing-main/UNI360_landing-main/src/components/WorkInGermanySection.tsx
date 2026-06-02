import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  Briefcase,
  Euro,
  MapPin,
  Users,
  Search,
  GraduationCap,
} from "lucide-react";

const WorkInGermanySection = ({
  selectedCountries,
}: {
  selectedCountries: string[];
}) => {
  if (!selectedCountries.includes("germany")) {
    return null;
  }

  const features = [
    {
      icon: <Search className="w-4 h-4" />,
      title: "Job Search Guidance",
    },
    {
      icon: <Euro className="w-4 h-4" />,
      title: "Low Cost",
    },
    {
      icon: <Users className="w-4 h-4" />,
      title: "Family Relocation",
    },
    {
      icon: <ArrowRight className="w-4 h-4" />,
      title: "Step-by-Step Planning",
    },
  ];

  return (
    <div
    id="work-in-germany-section"
    
    className="mx-4 sm:mx-6 lg:mx-8 mt-12 sm:mt-16 lg:mt-24 mb-4 sm:mb-6 lg:mb-8 rounded-xl sm:rounded-2xl lg:rounded-3xl border border-border shadow-[var(--card-shadow)] overflow-hidden hover:shadow-[var(--glow-primary)] transition-all duration-300" style={{backgroundColor: '#f0f4f8ff'}}>
      <div className="flex flex-col lg:grid lg:grid-cols-2 gap-0">
        {/* Image First on Mobile */}
        <div className="relative h-40 sm:h-64 lg:h-auto lg:min-h-full order-1 lg:order-2">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-tigers-eye/5 z-10"></div>
          <img
            src="/chancenkarte.jpg"
            alt="Work in Germany - Historic German Town"
            className="absolute inset-0 w-full h-full object-cover"
            onError={(e) => {
              // Fallback if image doesn't exist
              e.currentTarget.style.display = "none";
              e.currentTarget.parentElement!.innerHTML = `
                <div class="flex items-center justify-center h-full bg-gradient-to-br from-primary/10 to-tigers-eye/10">
                  <div class="text-center space-y-2 sm:space-y-3 p-3 sm:p-4 lg:p-8">
                    <div class="w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 mx-auto bg-primary/20 rounded-full flex items-center justify-center">
                      <svg class="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 text-primary" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20 6L9 17l-5-5"/>
                      </svg>
                    </div>
                    <h3 class="text-base sm:text-lg lg:text-xl font-semibold text-gunmetal">Work in Germany</h3>
                    <p class="text-xs sm:text-sm lg:text-base text-muted-foreground">Career Opportunities Await</p>
                  </div>
                </div>
              `;
            }}
          />
        </div>

        {/* Content Second on Mobile */}
        <div className="p-3 sm:p-4 lg:p-8 space-y-3 sm:space-y-4 lg:space-y-6 order-2 lg:order-1">
          {/* Header */}
          <div className="space-y-2 sm:space-y-3">
            <Badge className="bg-secondary/20 hover:bg-secondary/20 text-secondary-foreground border border-secondary px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs inline-flex items-center">
              <MapPin className="w-3 h-3 mr-1" /> Germany
            </Badge>
            <h2 className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-gunmetal">
              Work in <span className="text-tigers-eye">Germany</span>
            </h2>
          </div>

          {/* Description - Short on mobile, full on tablet+ */}
          <p className="text-xs sm:hidden text-muted-foreground leading-relaxed">
            Leverage the Chancenkarte to explore work opportunities and plan
            your career in Germany.
          </p>
          <p className="hidden sm:block text-sm lg:text-base text-muted-foreground leading-relaxed">
            Leverage the Chancenkarte to explore work, study, and relocation
            possibilities in Germany. Plan your future with confidence and
            discover new career opportunities.
          </p>

          {/* Features - Compressed on mobile */}
          <div className="space-y-1.5 sm:space-y-3 lg:space-y-4">
            <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gunmetal flex items-center gap-1.5 sm:gap-2">
              <GraduationCap className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-tigers-eye" />
              <span className="sm:hidden">Services</span>
              <span className="hidden sm:inline">Our Services</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-2 gap-1.5 sm:gap-3">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="flex items-start gap-1.5 sm:gap-2.5 p-1.5 sm:p-2.5 lg:p-3 bg-secondary/10 rounded-md sm:rounded-xl border border-secondary/20 hover:bg-secondary/20 transition-colors duration-200">
                  <div className="text-tigers-eye mt-0.5 flex-shrink-0">
                    {feature.icon}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-medium text-gunmetal text-xs sm:text-xs lg:text-sm leading-tight">
                      {feature.title}
                    </h4>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA Button */}
          <div className="pt-2 sm:pt-4 lg:pt-6">
            <a
              href="https://chancenkarte.uni360degree.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block">
              <Button className="bg-gunmetal hover:bg-tigers-eye/90 text-white text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl font-medium transition-colors duration-200">
                Explore Chancenkarte
                <ArrowRight className="ml-1.5 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkInGermanySection;
