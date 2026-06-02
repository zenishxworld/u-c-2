import { useState } from "react";
import { ChevronDown, Plus, Minus } from "lucide-react";

const faqs = [
  {
    question: "What is UNI 360° and how can it help me?",
    answer:
      "UNI 360° is a comprehensive study abroad consultancy that provides end-to-end support for students planning to study in Germany or the UK. We help with university selection, application process, document preparation, visa guidance, and post-arrival support.",
  },
  {
    question: "What makes UNI 360° different from other consultancies?",
    answer:
      "We offer a 98% visa success rate, AI-powered SOP/LOR generation, 24/7 support, real-time document tracking, and a money-back guarantee. Our expert counselors have deep knowledge of German and UK education systems.",
  },
  {
    question: "What is APS and why do I need it for Germany?",
    answer:
      "APS (Academic Evaluation Centre) certificate is mandatory for Indian students applying to German universities. It verifies your academic credentials and ensures they meet German standards. We provide complete APS guidance and support.",
  },
  {
    question: "Do I need to know German to study in Germany?",
    answer:
      "Not necessarily. Many universities offer English-taught programs, especially at the Master's level. However, learning basic German can be helpful for daily life and part-time job opportunities.",
  },
  {
    question: "What is a blocked account and how much money do I need?",
    answer:
      "A blocked account (Sperrkonto) is a special account required for your student visa. You need to deposit approximately €11,208 per year to prove you can financially support yourself in Germany.",
  },
  {
    question: "Can I work while studying in the UK?",
    answer:
      "Yes, students on a Student visa can work up to 20 hours per week during term time and full-time during holidays. This helps offset living costs and gain valuable work experience.",
  },
  {
    question: "What is the Graduate Route visa?",
    answer:
      "The Graduate Route allows international students to stay in the UK for 2 years (3 years for PhD graduates) after completing their studies to find work. No job offer is required initially.",
  },
  {
    question: "When should I start my application process?",
    answer:
      "We recommend starting 12-18 months before your intended start date. This allows sufficient time for language tests, document preparation, university applications, and visa processing.",
  },
  {
    question: "What documents do I need for my application?",
    answer:
      "Common documents include academic transcripts, degree certificates, language test scores (IELTS/TOEFL), SOP, LORs, passport, and financial documents. Specific requirements vary by country and university.",
  },
  {
    question: "How long does the visa process take?",
    answer:
      "Visa processing times vary: Germany typically takes 4-8 weeks, while UK visas usually take 3-4 weeks. We recommend applying as early as possible to avoid delays.",
  },
  {
    question: "How much does it cost to study in Germany vs UK?",
    answer:
      "Germany: Public universities charge €300-350/semester for tuition. UK: Tuition ranges from £15,000-40,000/year. Living costs are generally lower in Germany (€800-1200/month) compared to UK (£800-1500/month).",
  },
  {
    question: "Are scholarships available for international students?",
    answer:
      "Yes, both countries offer various scholarships. Germany has DAAD scholarships, and UK offers Chevening, Commonwealth scholarships, and university-specific grants. We help identify and apply for relevant scholarships.",
  },
];

interface FAQSectionProps {
  onBookCall?: () => void;
}

const FAQSection = ({ onBookCall }: FAQSectionProps = {}) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (idx: number) => {
    setOpenIndex((prev) => (prev === idx ? null : idx));
  };

  return (
    <section
      id="faq"
      className="w-full py-20 md:py-28"
      style={{
        background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 50%, #e8f4f8 100%)",
      }}
    >
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-14">
          <span className="inline-block bg-[#E08D3C]/10 text-[#E08D3C] text-xs font-semibold tracking-widest uppercase px-4 py-2 rounded-full mb-4">
            Got Questions?
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#2C3539] leading-tight mb-4">
            Frequently Asked{" "}
            <span
              style={{
                background: "linear-gradient(90deg, #E08D3C, #c77a32)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Questions
            </span>
          </h2>
          <p className="text-gray-500 text-lg">
            Everything you need to know about studying abroad with UNI 360°
          </p>
        </div>

        {/* Accordion */}
        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                onClick={() => toggle(idx)}
                className="cursor-pointer rounded-2xl overflow-hidden transition-all duration-300"
                style={{
                  background: isOpen
                    ? "linear-gradient(135deg, #2C3539 0%, #3a454a 100%)"
                    : "white",
                  boxShadow: isOpen
                    ? "0 8px 32px rgba(44,53,57,0.18)"
                    : "0 2px 8px rgba(0,0,0,0.06)",
                  border: isOpen
                    ? "1px solid transparent"
                    : "1px solid #e5e7eb",
                }}
              >
                {/* Question Row */}
                <div className="flex items-center justify-between px-6 py-5 gap-4">
                  <span
                    className={`font-semibold text-sm md:text-base leading-snug transition-colors duration-300 ${
                      isOpen ? "text-white" : "text-[#2C3539]"
                    }`}
                  >
                    {faq.question}
                  </span>
                  <span
                    className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 ${
                      isOpen
                        ? "bg-[#E08D3C] text-white"
                        : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    {isOpen ? (
                      <Minus className="w-3.5 h-3.5" />
                    ) : (
                      <Plus className="w-3.5 h-3.5" />
                    )}
                  </span>
                </div>

                {/* Answer */}
                <div
                  style={{
                    maxHeight: isOpen ? "500px" : "0",
                    opacity: isOpen ? 1 : 0,
                    overflow: "hidden",
                    transition: "max-height 0.35s ease, opacity 0.3s ease",
                  }}
                >
                  <div
                    className="px-6 pb-5 text-sm md:text-base leading-relaxed"
                    style={{ color: isOpen ? "rgba(255,255,255,0.8)" : "#6b7280" }}
                  >
                    {faq.answer}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div
          className="mt-14 rounded-3xl overflow-hidden text-center px-8 py-10 bg-testimonials-gradient border border-gray-200"
          style={{
            boxShadow: "0 8px 40px rgba(164,220,255,0.25), 0 4px 20px rgba(255,183,122,0.15)",
          }}
        >
          <h3 className="text-2xl md:text-3xl font-bold text-[#2C3539] mb-3">
            Still have questions?
          </h3>
          <p className="text-gray-500 mb-7 text-sm md:text-base max-w-sm mx-auto">
            Our expert counselors are ready to give you personalized guidance
            for your study abroad journey.
          </p>
          {onBookCall ? (
            <button
              onClick={onBookCall}
              className="inline-block font-semibold px-8 py-3 rounded-xl transition-all duration-200 hover:scale-105 hover:shadow-lg text-sm md:text-base text-white cursor-pointer"
              style={{ background: "linear-gradient(90deg, #E08D3C, #c77a32)" }}
            >
              Schedule 1:1 Call
            </button>
          ) : (
            <a
              href="/contact"
              className="inline-block font-semibold px-8 py-3 rounded-xl transition-all duration-200 hover:scale-105 hover:shadow-lg text-sm md:text-base text-white"
              style={{ background: "linear-gradient(90deg, #E08D3C, #c77a32)" }}
            >
              Schedule 1:1 Call
            </a>
          )}
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
