import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

import { Link } from "react-router-dom";

const FAQ = () => {
  const [openItems, setOpenItems] = useState<Set<number>>(new Set());

  const faqs = [
    {
      question: "Can I really go to Germany without a job offer?",
      answer: "Yes! The Chancenkarte (Opportunity Card) allows you to move to Germany without a job offer. You get 12 months to search for employment while living there. This is different from traditional work visas that require a job offer first."
    },
    {
      question: "What's required as financial proof?",
      answer: "You need to show proof of funds of approximately €11,208 (€934 per month for 12 months). This can be through a blocked account (Sperrkonto) in Germany or a formal sponsorship declaration from someone in Germany."
    },
    {
      question: "What's the difference from the Job Seeker Visa?",
      answer: "The Chancenkarte uses a points-based system and allows part-time work (up to 20 hours/week) during your job search. The Job Seeker Visa requires higher qualifications, doesn't permit employment, and is generally less accessible for most applicants."
    },
    {
      question: "Can I switch to a work permit or Blue Card later?",
      answer: "Absolutely! Once you secure employment, you can convert your Chancenkarte to a residence permit for employment or an EU Blue Card (for highly skilled workers). This conversion can be done from within Germany."
    },
    {
      question: "How long does the entire application process take?",
      answer: "The complete process typically takes 2-4 months from document preparation to approval. This includes gathering required documents, submitting your application, and waiting for processing by German authorities."
    },
    {
      question: "Can I bring my family with me?",
      answer: "Initially, the Chancenkarte is issued only to the main applicant. However, once you secure employment and convert to a residence permit, you may be eligible to bring family members through family reunification procedures."
    },
    {
      question: "What happens if I don't find a job within 12 months?",
      answer: "If you don't secure employment within 12 months, you'll need to leave Germany. However, our success rate is high because we provide comprehensive support including CV optimization, interview preparation, and networking strategies specific to the German job market."
    }
  ];

  const toggleItem = (index: number) => {
    const newOpenItems = new Set(openItems);
    if (newOpenItems.has(index)) {
      newOpenItems.delete(index);
    } else {
      newOpenItems.add(index);
    }
    setOpenItems(newOpenItems);
  };

  return (
    <section id="faq" className="py-16 lg:py-24 bg-off-white">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl lg:text-5xl font-satoshi font-bold text-gunmetal mb-6">
              Got doubts? We've clarified them all.
            </h2>
            <p className="text-mb text-gunmetal/70">
              Everything you need to know about the Chancenkarte process.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className={`rounded-chancenkarte border border-sage-green/10 overflow-hidden hover:shadow-md transition-shadow duration-300 ${
                  index % 2 === 0 ? 'bg-white' : 'bg-pale-mint/100'
                }`}
              >
                <button
                  onClick={() => toggleItem(index)}
                  className="w-full px-6 py-6 text-left flex items-center justify-between hover:bg-sage-green/5 transition-colors duration-200"
                >
                  <h3 className="font-semibold text-gunmetal pr-4">
                    {faq.question}
                  </h3>
                  {openItems.has(index) ? (
                    <ChevronUp className="w-5 h-5 text-sage-green flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-sage-green flex-shrink-0" />
                  )}
                </button>
                
                {openItems.has(index) && (
                  <div className="px-6 pb-6 animate-fade-in-up">
                    <div className="pt-4 border-t border-sage-green/10">
                      <p className="text-sm sm:text-base text-gunmetal/70 leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
};

export default FAQ;