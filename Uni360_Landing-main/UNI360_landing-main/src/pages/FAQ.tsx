import { useState } from "react";
import { ChevronDown, ChevronUp, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

const FAQ = () => {
  const [openItems, setOpenItems] = useState<number[]>([]);

  const faqData = [
    {
      category: "General",
      items: [
        {
          question: "What is UNI 360° and how can it help me?",
          answer: "UNI 360° is a comprehensive study abroad consultancy that provides end-to-end support for students planning to study in Germany or the UK. We help with university selection, application process, document preparation, visa guidance, and post-arrival support."
        },
        {
          question: "What makes UNI 360° different from other consultancies?",
          answer: "We offer a 98% visa success rate, AI-powered SOP/LOR generation, 24/7 support, real-time document tracking, and a money-back guarantee. Our expert counselors have deep knowledge of German and UK education systems."
        }
      ]
    },
    {
      category: "Germany",
      items: [
        {
          question: "What is APS and why do I need it for Germany?",
          answer: "APS (Academic Evaluation Centre) certificate is mandatory for Indian students applying to German universities. It verifies your academic credentials and ensures they meet German standards. We provide complete APS guidance and support."
        },
        {
          question: "Do I need to know German to study in Germany?",
          answer: "Not necessarily. Many universities offer English-taught programs, especially at the Master's level. However, learning basic German can be helpful for daily life and part-time job opportunities."
        },
        {
          question: "What is a blocked account and how much money do I need?",
          answer: "A blocked account (Sperrkonto) is a special account required for your student visa. You need to deposit approximately €11,208 per year to prove you can financially support yourself in Germany."
        }
      ]
    },
    {
      category: "UK",
      items: [
        {
          question: "Can I work while studying in the UK?",
          answer: "Yes, students on a Student visa can work up to 20 hours per week during term time and full-time during holidays. This helps offset living costs and gain valuable work experience."
        },
        {
          question: "What is the Graduate Route visa?",
          answer: "The Graduate Route allows international students to stay in the UK for 2 years (3 years for PhD graduates) after completing their studies to find work. No job offer is required initially."
        }
      ]
    },
    {
      category: "Applications & Visas",
      items: [
        {
          question: "When should I start my application process?",
          answer: "We recommend starting 12-18 months before your intended start date. This allows sufficient time for language tests, document preparation, university applications, and visa processing."
        },
        {
          question: "What documents do I need for my application?",
          answer: "Common documents include academic transcripts, degree certificates, language test scores (IELTS/TOEFL), SOP, LORs, passport, and financial documents. Specific requirements vary by country and university."
        },
        {
          question: "How long does the visa process take?",
          answer: "Visa processing times vary: Germany typically takes 4-8 weeks, while UK visas usually take 3-4 weeks. We recommend applying as early as possible to avoid delays."
        }
      ]
    },
    {
      category: "Costs & Scholarships",
      items: [
        {
          question: "How much does it cost to study in Germany vs UK?",
          answer: "Germany: Public universities charge €300-350/semester for tuition. UK: Tuition ranges from £15,000-40,000/year. Living costs are generally lower in Germany (€800-1200/month) compared to UK (£800-1500/month)."
        },
        {
          question: "Are scholarships available for international students?",
          answer: "Yes, both countries offer various scholarships. Germany has DAAD scholarships, and UK offers Chevening, Commonwealth scholarships, and university-specific grants. We help identify and apply for relevant scholarships."
        }
      ]
    }
  ];

  const toggleItem = (categoryIndex: number, itemIndex: number) => {
    const itemId = categoryIndex * 100 + itemIndex;
    setOpenItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const isOpen = (categoryIndex: number, itemIndex: number) => {
    const itemId = categoryIndex * 100 + itemIndex;
    return openItems.includes(itemId);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-accent text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Button 
            variant="ghost" 
            className="text-white hover:bg-white/10 mb-6"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
          
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-xl text-white/90">
            Find answers to common questions about studying abroad with UNI 360°
          </p>
        </div>
      </div>

      {/* FAQ Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {faqData.map((category, categoryIndex) => (
          <div key={categoryIndex} className="mb-12">
            <h2 className="text-2xl font-semibold text-foreground mb-6 pb-2 border-b-2 border-accent">
              {category.category}
            </h2>
            
            <div className="space-y-4">
              {category.items.map((item, itemIndex) => (
                <Collapsible key={itemIndex}>
                  <CollapsibleTrigger
                    onClick={() => toggleItem(categoryIndex, itemIndex)}
                    className="w-full"
                  >
                    <div className="flex items-center justify-between w-full p-6 bg-card hover:bg-muted/50 border border-border rounded-lg transition-colors duration-200">
                      <h3 className="text-left font-medium text-foreground pr-4">
                        {item.question}
                      </h3>
                      {isOpen(categoryIndex, itemIndex) ? (
                        <ChevronUp className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                      )}
                    </div>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <div className="px-6 pb-6 text-muted-foreground leading-relaxed">
                      {item.answer}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          </div>
        ))}

        {/* Contact Section */}
        <div className="mt-16 p-8 bg-gradient-to-r from-primary/10 to-accent/10 rounded-2xl text-center">
          <h3 className="text-2xl font-semibold text-foreground mb-4">
            Still Have Questions?
          </h3>
          <p className="text-muted-foreground mb-6">
            Our expert counselors are here to help you with personalized guidance for your study abroad journey.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button className="btn-hero">
              Schedule Free Consultation 
            </Button> 
          </div>
        </div>
      </div>
    </div>
  );
};

export default FAQ;