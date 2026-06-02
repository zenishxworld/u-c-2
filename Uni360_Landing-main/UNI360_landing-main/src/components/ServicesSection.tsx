import { 
  FileText, 
  GraduationCap, 
  Shield, 
  CreditCard, 
  Clock, 
  CheckCircle,
  Brain,
  Users
} from "lucide-react";

interface ServicesSectionProps {
  selectedCountries: string[];
}

export const ServicesSection = ({ selectedCountries }: ServicesSectionProps) => {
  const getServicesForCountries = () => {
    const germanyServices = [
      {
        icon: FileText,
        title: "Document Tracking",
        description: "Real-time tracking of all your application documents"
      },
      {
        icon: Shield,
        title: "APS Support", 
        description: "Complete guidance for APS certificate process"
      },
      {
        icon: Brain,
        title: "AI SOP & LOR Tool",
        description: "Generate personalized SOPs and LORs with AI assistance"
      },
      {
        icon: GraduationCap,
        title: "Visa Guidance",
        description: "Step-by-step visa application support"
      },
      {
        icon: CreditCard,
        title: "Block Account",
        description: "Assistance with opening German blocked account"
      },
      {
        icon: Clock,
        title: "24x7 Support",
        description: "Round-the-clock expert assistance"
      },
      {
        icon: CheckCircle,
        title: "Success Guarantee",
        description: "Money-back guarantee for visa approval"
      }
    ];

    const ukServices = [
      {
        icon: Clock,
        title: "24x7 Support",
        description: "Round-the-clock expert assistance"
      },
      {
        icon: CheckCircle,
        title: "Success Guarantee", 
        description: "Money-back guarantee for visa approval"
      },
      {
        icon: Shield,
        title: "Visa Readiness",
        description: "Complete visa preparation and guidance"
      },
      {
        icon: FileText,
        title: "APS Support",
        description: "Academic credential verification assistance"
      },
      {
        icon: Brain,
        title: "AI SOP & LOR Tool",
        description: "Generate personalized SOPs and LORs with AI assistance"
      },
      {
        icon: GraduationCap,
        title: "Document Tracking",
        description: "Real-time tracking of all your application documents"
      }
    ];

    if (selectedCountries.includes("germany") && selectedCountries.includes("uk")) {
      // Combine both but avoid duplicates
      const combined = [...germanyServices];
      ukServices.forEach(ukService => {
        if (!combined.find(service => service.title === ukService.title)) {
          combined.push(ukService);
        }
      });
      return combined;
    }
    
    if (selectedCountries.includes("germany")) return germanyServices;
    if (selectedCountries.includes("uk")) return ukServices;
    
    return germanyServices; // Default
  };

  const services = getServicesForCountries();

  const getCountryText = () => {
    if (selectedCountries.includes("germany") && selectedCountries.includes("uk")) {
      return "Germany & UK";
    }
    if (selectedCountries.includes("germany")) return "Germany";
    if (selectedCountries.includes("uk")) return "UK";
    return "Germany & UK";
  };

  return (
    <section id="services" className="py-20 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 animate-fade-in-up">
          <h2 className="text-section text-foreground mb-4">
            Complete Study Abroad Services for {getCountryText()}
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            From application to graduation - we provide end-to-end support for your {getCountryText()} study journey
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {services.map((service, index) => {
            const Icon = service.icon;
            return (
              <div
                key={index}
                className="card-elevated text-center group hover:scale-105 transition-transform duration-300"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center mx-auto mb-4 group-hover:shadow-[var(--glow-primary)] transition-shadow duration-300">
                  <Icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-3">
                  {service.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {service.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Why Choose UNI 360° */}
        <div className="mt-20">
          <div className="text-center mb-12">
            <h3 className="text-2xl md:text-3xl font-semibold text-foreground mb-4">
              Why Choose UNI 360°?
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="card-elevated text-center">
              <Users className="h-12 w-12 text-primary mx-auto mb-4" />
              <h4 className="text-lg font-semibold mb-3">Expert Counselors</h4>
              <p className="text-muted-foreground">
                Experienced counselors with deep knowledge of {getCountryText()} education system
              </p>
            </div>

            <div className="card-elevated text-center">
              <CheckCircle className="h-12 w-12 text-success mx-auto mb-4" />
              <h4 className="text-lg font-semibold mb-3">Proven Track Record</h4>
              <p className="text-muted-foreground">
                98% visa success rate with over 5000+ students successfully placed
              </p>
            </div>

            <div className="card-elevated text-center">
              <Clock className="h-12 w-12 text-accent mx-auto mb-4" />
              <h4 className="text-lg font-semibold mb-3">End-to-End Support</h4>
              <p className="text-muted-foreground">
                Complete guidance from application to graduation and beyond
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};