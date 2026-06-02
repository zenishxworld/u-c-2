import { useState } from "react";
import { MapPin, Euro, Clock, Star, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface CollegeExplorerProps {
  selectedCountries: string[];
}

export const CollegeExplorer = ({
  selectedCountries,
}: CollegeExplorerProps) => {
  // University logos data - organized in 3 rows
  // University logos data - updated with all from screenshot
const universityLogos = {
  row1: [
    { name: "HMTM", logo: "128px-HMTM-Logo-2010.svg.png" },
    { name: "IBA", logo: "128px-IBA_Logo.jpg" },
    { name: "Karls University", logo: "128px-Karls_Logo_wiki.svg.png" },
    { name: "Technical University Berlin", logo: "128px-Logo_der_Technischen_Universität_Berlin.svg.png" },
    { name: "HCM", logo: "128px-Logo_HCM.jpg" },
    { name: "PH Schwäbisch Gmünd", logo: "128px-PH_Schwaebisch_Gmuend_Logo.svg.png" },
    { name: "Sheffield Hallam University", logo: "128px-Sheffield_Hallam_University_logo.svg.png" },
    { name: "TU Kaiserslautern", logo: "128px-Tu_kaiserslautern.svg.png" },
    { name: "KCL", logo: "250px-Kcl-logo.png" },
    { name: "AU Birmingham", logo: "AU_Birmingham_logo_Purple_RGB.png" },
    { name: "Bayes Business School", logo: "Bayes_Business_School_Logo.svg.png" },
    { name: "Centre of Development Studies", logo: "Centre_of_Development_Studies_logo.svg.png" },
    { name: "CU Coventry", logo: "CU_Coventry.png" },
    { name: "ECLA", logo: "ECLA_Logo.jpg" },
    { name: "Esslingen University", logo: "esslingen_uni.png" },
    { name: "FOM University of Applied Sciences", logo: "FOM University of Applied Sciences.png" }
  ],
  row2: [
  
    { name: "Goethe University", logo: "Centre_of_Development_Studies_logo.png" },
    { name: "Hamburg University of Technology", logo: "Hamburg University of Technology.png" },
    { name: "Hochschule", logo: "Hochschule.png" },
    { name: "IU International University", logo: "IU International University of Applied Sciences.png" },
    { name: "KCC", logo: "Kcc_logo.gif" },
    { name: "Kingston University", logo: "King's_College_London_logo.svg.png" },
    { name: "Nottingham Trent University", logo: "Logo_Nottingham_Trent_University.svg (1).png" },
    { name: "London Metropolitan University", logo: "London_Metropolitan_University_Logo.jpg" },
    { name: "Pearson College London", logo: "Pearson_College_London_logo.png" },
    { name: "Rosenheim Technical University", logo: "Rosenheim Technical University of Applied Sciences.png" },
    { name: "RWTH Aachen", logo: "RWTH Aachen University.png" },
    { name: "School of Advanced Study", logo: "School_of_Advanced_Study_Logo.png" },
    { name: "Southampton Solent University", logo: "Southampton-Solent-University-logo.svg.png" },
    { name: "Stuttgart", logo: "stuttgart.png" },
    { name: "Hamburg", logo: "Hamburg.jpeg" },
  ],
  row3: [
    { name: "Technical University Berlin (Alt)", logo: "Technical University Berlin.png" },
    { name: "Technical University of Munich", logo: "Technical University of Munich.png" },
    { name: "Technische Hochschule Ingolstadt", logo: "Technishe Hochschule.png" },
    { name: "TH Lübeck", logo: "TH_Logo_Wikipedia.png" },
    { name: "TU Dortmund", logo: "TU Dortmund.png" },
    { name: "TU", logo: "School_of_Advanced_Study_Logo.png" },
    { name: "University of Europe", logo: "University of Europe for Applied Sciences.png" },
    { name: "University of Oxford", logo: "University_of_Oxford.svg.png" },
    { name: "University of Southampton", logo: "University_of_Southampton_logo.png" },
    { name: "University of Westminster", logo: "University_of_Westminster_Logo.jpg" },
    { name: "Universität Bremen", logo: "universitybremen.jpg" },
    { name: "Warwick Business School", logo: "Warwick_Business_School_logo.svg.png" }
  ]
};


  return (
    <section
      id="universities"
      className="pt-8 pb-8 mt-12 sm:pt-12 sm:pb-12 md:pt-16 md:pb-16 lg:pt-20 lg:pb-20 overflow-hidden">
      <div className=" mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        <div className="text-center mb-6 sm:mb-8 md:mb-10 lg:mb-12 animate-fade-in-up">
          <h2 className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 sm:mb-3 md:mb-4 px-2">
            Explore 100+ Partner Institutions, 200+ Programs in{" "}
            <span className="text-tigers-eye">UK & Germany</span>
          </h2>
          <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto px-2 sm:px-4">
            Discover world-class universities and find the perfect match for
            your academic goals
          </p>
        </div>

        {/* Rotating University Logos */}
        <div className="relative">
          {/* Row 1 - Moving Right to Left */}
          <div className="mb-3 sm:mb-4 md:mb-6 overflow-hidden">
            <div className="flex animate-scroll-left space-x-2 sm:space-x-4 md:space-x-6 lg:space-x-8">
              {/* Duplicate the logos for seamless loop */}
              {[
                ...universityLogos.row1,
                ...universityLogos.row1,
                ...universityLogos.row1,
              ].map((university, index) => (
                <div
                  key={`row1-${index}`}
                  className="flex-shrink-0 bg-white rounded-md sm:rounded-lg p-1.5 sm:p-3 md:p-4 shadow-sm border hover:shadow-md transition-shadow duration-300">
                  <img
                    src={
                      new URL(
                        `../assets/logos/${university.logo}`,
                        import.meta.url
                      ).href
                    }
                    alt={university.name}
                    className="h-6 sm:h-8 md:h-12 lg:h-16 w-auto object-contain mx-auto"
                    onError={(e) => {
                      e.currentTarget.src = `data:image/svg+xml,${encodeURIComponent(
                        `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="60" viewBox="0 0 120 60">
        <rect width="120" height="60" fill="#f3f4f6"/>
        <text x="60" y="35" text-anchor="middle" fill="#6b7280" font-family="Arial" font-size="8">
          ${university.name}
        </text>
      </svg>`
                      )}`;
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Row 2 - Moving Left to Right */}
          <div className="mb-3 sm:mb-4 md:mb-6 overflow-hidden">
            <div className="flex animate-scroll-right space-x-2 sm:space-x-4 md:space-x-6 lg:space-x-8">
              {/* Duplicate the logos for seamless loop */}
              {[
                ...universityLogos.row2,
                ...universityLogos.row2,
                ...universityLogos.row2,
              ].map((university, index) => (
                <div
                  key={`row2-${index}`}
                  className="flex-shrink-0 bg-white rounded-md sm:rounded-lg p-1.5 sm:p-3 md:p-4 shadow-sm border hover:shadow-md transition-shadow duration-300">
                  <img
                    src={
                      new URL(
                        `../assets/logos/${university.logo}`,
                        import.meta.url
                      ).href
                    }
                    alt={university.name}
                    className="h-6 sm:h-8 md:h-12 lg:h-16 w-auto object-contain mx-auto"
                    onError={(e) => {
                      e.currentTarget.src = `data:image/svg+xml,${encodeURIComponent(
                        `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="60" viewBox="0 0 120 60">
        <rect width="120" height="60" fill="#f3f4f6"/>
        <text x="60" y="35" text-anchor="middle" fill="#6b7280" font-family="Arial" font-size="8">
          ${university.name}
        </text>
      </svg>`
                      )}`;
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Row 3 - Moving Right to Left */}
          <div className="mb-3 sm:mb-4 md:mb-6 overflow-hidden">
            <div className="flex animate-scroll-left space-x-2 sm:space-x-4 md:space-x-6 lg:space-x-8">
              {/* Duplicate the logos for seamless loop */}
              {[
                ...universityLogos.row3,
                ...universityLogos.row3,
                ...universityLogos.row3,
              ].map((university, index) => (
                <div
                  key={`row3-${index}`}
                  className="flex-shrink-0 bg-white rounded-md sm:rounded-lg p-1.5 sm:p-3 md:p-4 shadow-sm border hover:shadow-md transition-shadow duration-300">
                  <img
                    src={
                      new URL(
                        `../assets/logos/${university.logo}`,
                        import.meta.url
                      ).href
                    }
                    alt={university.name}
                    className="h-6 sm:h-8 md:h-12 lg:h-16 w-auto object-contain mx-auto"
                    onError={(e) => {
                      e.currentTarget.src = `data:image/svg+xml,${encodeURIComponent(
                        `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="60" viewBox="0 0 120 60">
        <rect width="120" height="60" fill="#f3f4f6"/>
        <text x="60" y="35" text-anchor="middle" fill="#6b7280" font-family="Arial" font-size="8">
          ${university.name}
        </text>
      </svg>`
                      )}`;
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Explore More Button */}
        <div className="text-center mt-8 sm:mt-10 md:mt-12 lg:mt-16 px-4">
          <button
            onClick={() => (window.location.href = "/universities")}
            className="mx-auto bg-gunmetal hover:bg-tigers-eye text-white font-medium text-sm sm:text-base px-4 sm:px-6 py-2.5 sm:py-3 rounded-md transition-colors duration-200 shadow-sm hover:shadow-md flex items-center">
            Explore Universities
          </button>
        </div>
      </div>

      {/* CSS Animations */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
          @keyframes scroll-left {
            0% {
              transform: translateX(0);
            }
            100% {
              transform: translateX(-33.333%);
            }
          }

          @keyframes scroll-right {
            0% {
              transform: translateX(-33.333%);
            }
            100% {
              transform: translateX(0);
            }
          }

          .animate-scroll-left {
            animation: scroll-left 30s linear infinite;
          }

          .animate-scroll-right {
            animation: scroll-right 30s linear infinite;
          }

          .animate-scroll-left:hover,
          .animate-scroll-right:hover {
            animation-play-state: paused;
          }
            /* Add these media queries to your existing keyframes */
@media (max-width: 640px) {
  .animate-scroll-left {
    animation: scroll-left 20s linear infinite;
  }
  .animate-scroll-right {
    animation: scroll-right 20s linear infinite;
  }
}

@media (max-width: 480px) {
  .animate-scroll-left {
    animation: scroll-left 15s linear infinite;
  }
  .animate-scroll-right {
    animation: scroll-right 15s linear infinite;
  }
}
        `,
        }}
      />
    </section>
  );
};
