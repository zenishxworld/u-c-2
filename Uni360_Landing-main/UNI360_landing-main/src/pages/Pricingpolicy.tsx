import React from "react";
import { Card } from "@/components/ui/card";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { CheckCircle } from "lucide-react";

const PricingPolicy = () => {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Navbar */}
      <Navigation />

      {/* Main Content */}
      <div className="flex-grow max-w-5xl mx-auto px-3 xs:px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        
        {/* Heading */}
        <h1 className="mt-20 text-2xl xs:text-3xl sm:text-4xl font-bold text-[#2C3539] mb-6 text-center leading-tight">
          Pricing – UNI360 Consultation Calls
        </h1>

        <p className="text-center text-gray-600 mb-10">
          Get personalized guidance for your study abroad journey.
        </p>

        {/* Card */}
        <Card className="p-6 sm:p-8 shadow-lg border border-gray-200 rounded-2xl">
          
          {/* What You Get */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-[#2C3539] mb-4">
              What You Get:
            </h2>

            <ul className="space-y-3">
              {[
                "Eligibility assessment",
                "University selection guidance",
                "Visa process consultation",
                "Document & SOP guidance",
              ].map((item, index) => (
                <li key={index} className="flex items-center gap-2 text-gray-700">
                  <CheckCircle className="text-[#E08D3C] w-5 h-5" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Pricing */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-[#2C3539] mb-2">
              Pricing:
            </h2>
            <p className="text-lg font-bold text-[#E08D3C]">
              ₹499 per session
            </p>
          </div>

          {/* Notes */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-[#2C3539] mb-4">
              Important Notes:
            </h2>
            <ul className="list-disc pl-5 space-y-2 text-gray-700">
              <li>Payment is required before booking confirmation</li>
              <li>Sessions are conducted online via scheduled meeting link</li>
              <li>Duration: 15–30 minutes</li>
            </ul>
          </div>

          {/* Booking Process */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-[#2C3539] mb-4">
              Booking Process:
            </h2>
            <ol className="list-decimal pl-5 space-y-2 text-gray-700">
              <li>Select a time slot via Calendly</li>
              <li>Complete payment via Razorpay</li>
              <li>Receive confirmation and meeting details</li>
            </ol>
          </div>

          

          {/* Support */}
          <div className="mt-8 text-center text-sm text-gray-600">
            For any issues, contact:{" "}
            <a
              href="mailto:support@uni360degree.com"
              className="text-[#E08D3C] font-medium hover:underline"
            >
              support@uni360degree.com
            </a>
          </div>
        </Card>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default PricingPolicy;