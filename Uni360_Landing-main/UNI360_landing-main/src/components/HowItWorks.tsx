import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ZoomIn } from "lucide-react";

interface HowItWorksProps {
  selectedCountries: string[];
}


export const HowItWorks = ({ selectedCountries }: HowItWorksProps) => {
  const [filter, setFilter] = useState("all");
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  // ADD IT HERE ↓
  useEffect(() => {
    if (selectedCountries.length === 1) {
      setFilter(selectedCountries[0]);
    } else {
      setFilter("all");
    }
  }, [selectedCountries]);


  const processFlows = {
    uk: {
      flag: "/uk-logo.png",
      title: "UK",
      image: "/uk.png", // First image you uploaded
      description: "Step-by-step process to study in the United Kingdom",
    },
    germany: {
      flag: "/germany-logo.png",
      title: "Germany",
      image: "/ger.png", // Second image you uploaded
      description: "Step-by-step process to study in Germany",
    },
  };

  const getDisplayContent = () => {
    // AFTER
if (filter === "uk") {
  return [processFlows.uk];
} else if (filter === "germany") {
  return [processFlows.germany];
} else {
  // "all" — always show both regardless of selectedCountries
  return Object.values(processFlows);
}
  };

  const displayContent = getDisplayContent();

  const openZoomedImage = (imageSrc: string) => {
    setZoomedImage(imageSrc);
  };

  const closeZoomedImage = () => {
    setZoomedImage(null);
  };

  return (
    <section id="how-it-works" className="py-12 sm:py-16 lg:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-10 lg:mb-12 animate-fade-in-up">
          <h2 className=" text-foreground mb-3 font-bold text-center text-2xl sm:text-2xl md:text-3xl lg:text-4xl">
            How It Works
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto px-4">
            Your journey to studying abroad made simple with our step-by-step
            process
          </p>
        </div>

        {/* Filters - Responsive Layout */}
{(
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3 lg:gap-4 mb-8 sm:mb-10 lg:mb-12 px-4">
            <Button
              variant={filter === "all" ? "default" : "outline"}
              onClick={() => setFilter("all")}
              className={`${
                filter === "all" ? "btn-hero" : ""
              } text-xs sm:text-sm px-3 sm:px-4 py-2 h-8 sm:h-9 lg:h-10`}>
              Both Countries
            </Button>
            <Button
  variant={filter === "germany" ? "default" : "outline"}
  onClick={() => setFilter("germany")}
  className={`${
    filter === "germany" ? "btn-hero" : ""
  } text-xs sm:text-sm px-3 sm:px-4 py-2 h-8 sm:h-9 lg:h-10`}>
  <img
    src="/germany-logo.png"
    alt="Germany flag"
    className="w-4 sm:w-5 h-2.5 sm:h-3 object-cover rounded mr-1.5 sm:mr-2"
  />
  <span>Germany</span>
</Button>
            <Button
  variant={filter === "uk" ? "default" : "outline"}
  onClick={() => setFilter("uk")}
  className={`${
    filter === "uk" ? "btn-hero" : ""
  } text-xs sm:text-sm px-3 sm:px-4 py-2 h-8 sm:h-9 lg:h-10`}>
  <img
    src="/uk-logo.png"
    alt="UK flag"
    className="w-4 sm:w-5 h-2.5 sm:h-3 object-cover rounded mr-1.5 sm:mr-2"
  />
  <span>United Kingdom</span>
</Button>
          </div>
        )}

        {/* Process Flow Images */}
        <div
          className={`grid gap-6 sm:gap-8 lg:gap-12 ${
            displayContent.length === 1
              ? "grid-cols-1 place-items-center"
              : "grid-cols-1 lg:grid-cols-2"
          }`}>
          {displayContent.map((flow, index) => (
            <div
              key={flow.title}
              className={`flex flex-col items-center text-center animate-fade-in-up ${
                displayContent.length === 1 ? "max-w-3xl" : "w-full max-w-2xl"
              }`}
              style={{ animationDelay: `${index * 0.2}s` }}>
              <div className="w-full">
                <h3 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-foreground mb-3 sm:mb-4 flex items-center justify-center gap-3">
                  <img
                    src={flow.flag}
                    alt={`${flow.title} flag`}
                    className="w-8 sm:w-10 h-5 sm:h-6 object-cover rounded"
                  />
                  {flow.title}
                </h3>
                <p className="text-sm sm:text-base text-muted-foreground mb-6 sm:mb-8">
                  {flow.description}
                </p>
                <div className="bg-background rounded-2xl shadow-lg p-4 sm:p-6 lg:p-8 border border-border/50 relative group">
                  {/* Magnifying glass icon */}
                  <button
                    onClick={() => openZoomedImage(flow.image)}
                    className="absolute top-6 right-6 z-10 bg-primary text-primary-foreground p-2 rounded-full shadow-lg hover:bg-primary/90 transition-colors duration-200 opacity-80 group-hover:opacity-100"
                    aria-label="Zoom image">
                    <ZoomIn className="w-4 h-4" />
                  </button>

                  <img
                    src={flow.image}
                    alt={flow.title}
                    className="w-full h-auto min-h-[250px] sm:min-h-[300px] md:h-96 lg:h-[450px] xl:h-[500px] object-contain cursor-pointer"
                    loading="lazy"
                    onClick={() => openZoomedImage(flow.image)}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Call to Action */}
      </div>

      {/* Zoomed Image Modal - Mobile Optimized */}
      {zoomedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-2 sm:p-4"
          onClick={closeZoomedImage}>
          <div
            className="bg-white rounded-xl shadow-2xl p-3 sm:p-6 max-w-[96vw] sm:max-w-[95vw] max-h-[95vh] overflow-auto relative"
            onClick={(e) => e.stopPropagation()}>
            {/* Close button */}
            <button
              onClick={closeZoomedImage}
              className="absolute top-2 right-2 z-10 bg-gray-100 hover:bg-gray-200 text-gray-600 p-2 rounded-full transition-colors duration-200"
              aria-label="Close zoom">
              ✕
            </button>

            <img
              src={zoomedImage}
              alt="Zoomed view"
              className="w-full h-auto max-w-full object-contain"
              style={{ maxHeight: "calc(95vh - 4rem)" }}
            />
          </div>
        </div>
      )}
    </section>
  );
};
