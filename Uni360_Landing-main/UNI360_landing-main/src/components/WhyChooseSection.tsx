import { Card } from "@/components/ui/card";
import {
  CheckCircle,
  Users,
  Target,
  BookOpen,
  Briefcase,
  Home,
} from "lucide-react";
import { HowItWorks } from "@/components/HowItWorks";

interface WhyChooseSectionProps {
  selectedCountries: string[];
}

const WhyChooseSection = ({ selectedCountries }: WhyChooseSectionProps) => {
  const leftFeatures = [
    {
      icon: Target,
      title: "End-to-End Guidance",
      description:
        "From university selection to post-arrival support, we're with you every step of your journey.",
      benefits: [
        "Personalized counseling",
        "Application assistance",
        "Document preparation",
        "Interview prep",
      ],
    },
    {
      icon: Users,
      title: "University Matchmaking",
      description:
        "Our AI-powered system matches you with universities that fit your profile, interests, and career goals.",
      benefits: [
        "Smart recommendations",
        "Course compatibility",
        "Scholarship opportunities",
        "Admission probability",
      ],
    },
    {
      icon: BookOpen,
      title: "Germany & UK Specialization",
      description:
        "Deep expertise in German and UK education systems, requirements, and cultural nuances.",
      benefits: [
        "IELTS/German prep",
        "Scholarship guidance",
        "Student Loan",
        "Language support",
      ],
    },
  ];

  const rightFeatures = [
    {
      icon: Briefcase,
      title: "Post-Study Work Support",
      description:
        "Maximize your career opportunities with guidance on work permits and job placement in Germany & UK.",
      benefits: [
        "Work visa guidance",
        "CV optimization",
        "Interview coaching",
        "Employer connections",
      ],
    },
    {
      icon: Home,
      title: "Settlement Assistance",
      description:
        "Complete support for accommodation, banking, insurance, and settling into your new life abroad.",
      benefits: [
        "Accommodation help",
        "Bank account setup",
        "Insurance guidance",
        "Local orientation",
      ],
    },
  ];

  return (
    <section className="py-16 bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 360 Degree Image */}
        <div 
          className="relative flex flex-col space-y-4 sm:space-y-6 lg:space-y-8 items-center justify-center mb-12 sm:mb-16 lg:mb-24"
        >
          {/* Background PNG */}
          <img
            src="/UNI-360-Degree-Education-Services.png"
            alt=""
            className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
          />

          {/* Content */}
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-center px-2 sm:px-4 leading-tight relative z-10">
            We Cover <span className="text-tigers-eye">360°</span> of Your Study Abroad Journey 
          </h2>
          <img
            src="/360-degree.png"
            alt="UNI 360 Degree Education Services"
            className="relative z-10 w-full sm:w-[85%] md:w-[80%] lg:w-[70%] xl:w-[65%] object-contain h-auto max-w-4xl"
          />
        </div>

        <HowItWorks selectedCountries={selectedCountries} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Left Content */}
          <div className="space-y-6">
            <div className="space-y-3">
              <h2 className="hero-title text-2xl sm:text-3xl md:text-3xl lg:text-4xl mb-4 font-bold">
                Why Choose <span className="text-accent">UNI 360°?</span>
              </h2>
              <p className="text-base text-muted-foreground">
                We're more than just an education consultancy. We're your
                trusted partner in building a global future.
              </p>
            </div>

            {/* Left Features */}
            <div className="space-y-4">
              {leftFeatures.map((feature, index) => (
                <Card
                  key={index}
                  className="service-card p-4 hover:shadow-md transition-all duration-300">
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-tigers-eye rounded-lg flex items-center justify-center flex-shrink-0">
                      <feature.icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="space-y-2 flex-1">
                      <h3 className="font-semibold text-base text-primary">
                        {feature.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {feature.description}
                      </p>
                      <div className="grid grid-cols-2 gap-1">
                        {feature.benefits.map((benefit, idx) => (
                          <div
                            key={idx}
                            className="flex items-center space-x-1">
                            <CheckCircle className="w-3 h-3 text-success flex-shrink-0" />
                            <span className="text-xs text-muted-foreground">
                              {benefit}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Right Content - Added top margin to push content down slightly */}
          <div className="space-y-5 mt-2">
            {/* Main Image */}
            <Card className="service-card overflow-hidden">
              <div className="relative">
                <img
                  src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=600&h=300&fit=crop"
                  alt="Global education support and guidance"
                  className="w-full h-65 object-cover rounded-lg shadow-lg"
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-black/40 to-transparent rounded-2xl" />
                <div className="absolute bottom-3 left-3 text-white">
                  <h4 className="font-semibold text-sm">
                    Global Education Network
                  </h4>
                  <p className="text-xs opacity-90">
                    Connecting students worldwide
                  </p>
                </div>
              </div>
            </Card>

            {/* Right Features */}
            <div className="space-y-4">
              {rightFeatures.map((feature, index) => (
                <Card
                  key={index}
                  className="service-card p-4 hover:shadow-md transition-all duration-300">
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-tigers-eye rounded-lg flex items-center justify-center flex-shrink-0">
                      <feature.icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="space-y-2 flex-1">
                      <h3 className="font-semibold text-base text-primary">
                        {feature.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {feature.description}
                      </p>
                      <div className="grid grid-cols-2 gap-1">
                        {feature.benefits.map((benefit, idx) => (
                          <div
                            key={idx}
                            className="flex items-center space-x-1">
                            <CheckCircle className="w-3 h-3 text-success flex-shrink-0" />
                            <span className="text-xs text-muted-foreground">
                              {benefit}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhyChooseSection;