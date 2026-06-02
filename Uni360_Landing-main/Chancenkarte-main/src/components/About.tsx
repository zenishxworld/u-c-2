import { Clock, Globe, Users, Shield } from 'lucide-react';

const About = () => {
  const features = [
    {
      icon: Clock,
      title: "12-month residence permit",
      description: "Get a full year to search for employment opportunities while living in Germany."
    },
    {
      icon: Globe,
      title: "No job offer required",
      description: "Move to Germany first, then find the perfect job that matches your skills."
    },
    {
      icon: Users,
      title: "Part-time work allowed",
      description: "Earn income with up to 20 hours per week while actively job searching."
    },
    {
      icon: Shield,
      title: "Path to permanent residency",
      description: "Convert to a work permit or EU Blue Card once you secure employment."
    }
  ];

  return (
    <section id="about" className="py-16 lg:py-24 bg-gradient-to-br from-pale-mint to-off-white">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-2xl lg:text-5xl font-satoshi font-bold text-gunmetal mb-6">
              What is the Chancenkarte?
            </h2>
            <p className="text-sm sm:text-xl text-gunmetal/70 max-w-2xl mx-auto px-4 sm:px-0">
              Germany's Opportunity Card (Job Seeker Visa) is a revolutionary residence permit designed for 
              non-EU skilled individuals. It allows you to live in Germany for up to 12 months while 
              searching for employment, without needing a job offer first.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white rounded-chancenkarte p-6 shadow-sm hover:shadow-md transition-shadow duration-300"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-sage-green/20 rounded-chancenkarte flex items-center justify-center flex-shrink-0">
                    <feature.icon className="w-6 h-6 text-sage-green" />
                  </div>
                  <div>
                    <h3 className="text-lg font-satoshi font-bold text-gunmetal mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-sm sm:text-base text-gunmetal/70 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
