export const Testimonials = () => {
  const testimonials = [
    {
      name: "Siddika",
      age: 29,
      quote: "I moved with no offer. Chancenkarte helped me find a job in Munich within 4 months!",
      photo: "/siddika,jpg-Picsart-AiImageEnhancer.webp",
      role: "Software Developer",
      rating: 5
    },
    {
      name: "Vishal",
      age: 40,
      quote: "From Delhi to Berlin in 3 months. Easiest decision ever. The guidance was invaluable.",
      photo: "/vishal,jpg-Picsart-AiImageEnhancer.webp",
      role: "Marketing Manager",
      rating: 4.5
    },
    {
      name: "Dishant",
      age: 34,
      quote: "Balanced family and job-hunt thanks to Chancenkarte. Found my dream role in Hamburg.",
      photo: "/dishant,jpg-Picsart-AiImageEnhancer.webp",
      role: "Research Scientist",
      rating: 4
    },
    {
      name: "Vaibhav",
      age: 42,
      quote: "Didn't think I was eligible. Turns out, I was ready all along. Now working in Frankfurt!",
      photo: "/vaibhav,jpg-Picsart-AiImageEnhancer.webp",
      role: "Senior Engineer",
      rating: 4.5
    }
  ];

   const renderStars = (rating) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    const emptyStars = 5 - Math.ceil(rating);

    return (
      <>
        {[...Array(fullStars)].map((_, i) => (
          <span key={`full-${i}`} className="text-tigers-eye text-sm">★</span>
        ))}
        {hasHalfStar && (
          <span className="text-tigers-eye text-sm relative">
            <span className="absolute inset-0 overflow-hidden w-1/2">★</span>
            <span className="text-gray-300">★</span>
          </span>
        )}
        {[...Array(emptyStars)].map((_, i) => (
          <span key={`empty-${i}`} className="text-gray-300 text-sm">★</span>
        ))}
      </>
    );
  };

  return (
    <section className="py-16 lg:py-24 bg-off-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-2xl lg:text-5xl font-satoshi font-bold text-gunmetal mb-6">
            Success Stories from Germany
          </h2>
          <p className="text-mb text-gunmetal/70 max-w-2xl mx-auto">
            Real people, real journeys, real success in Germany.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-white rounded-chancenkarte p-6 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-2"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="text-center mb-4">
                <div className="w-16 h-16 rounded-full overflow-hidden mx-auto mb-3 border-2 border-tigers-eye shadow-lg">
                  <img 
                    src={testimonial.photo} 
                    alt={`${testimonial.name}'s photo`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="font-satoshi font-bold text-gunmetal">
                  {testimonial.name}, {testimonial.age}
                </h3>
                <p className="text-sm text-tigers-eye font-medium">
                  {testimonial.role}
                </p>
              </div>
              
              <blockquote className="text-gunmetal/80 text-sm leading-relaxed italic text-center">
                "{testimonial.quote}"
              </blockquote>
              
              <div className="flex justify-center mt-4">
                {renderStars(testimonial.rating)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};