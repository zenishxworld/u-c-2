import React from "react";
import { Card } from "@/components/ui/card";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { CheckCircle } from "lucide-react";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Navbar */}
      <Navigation />

      {/* Main Content */}
      <div className="flex-grow max-w-5xl mx-auto px-3 xs:px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        
        {/* Heading */}
        <h1 className="mt-20 text-2xl xs:text-3xl sm:text-4xl font-bold text-[#2C3539] mb-6 text-center leading-tight">
          Privacy Policy – UNI360
        </h1>

        <p className="text-center text-gray-600 mb-10">
          At UNI360, we value your privacy and are committed to protecting your personal information.
        </p>

        {/* Card */}
        <Card className="p-6 sm:p-8 shadow-lg border border-gray-200 rounded-2xl space-y-8">

          {/* Section 1 */}
          <div>
            <h2 className="text-xl font-semibold text-[#2C3539] mb-3">
              1. Information We Collect
            </h2>
            <ul className="space-y-2 text-gray-700">
              {[
                "Name, email address, phone number",
                "Payment details (processed securely via Razorpay)",
                "Appointment details booked via Calendly",
                "Academic and visa-related information you voluntarily provide",
              ].map((item, index) => (
                <li key={index} className="flex gap-2 items-start">
                  <CheckCircle className="text-[#E08D3C] w-5 h-5 mt-1" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Section 2 */}
          <div>
            <h2 className="text-xl font-semibold text-[#2C3539] mb-3">
              2. How We Use Your Information
            </h2>
            <ul className="space-y-2 text-gray-700">
              {[
                "Schedule and manage 1:1 consultation calls",
                "Process payments securely",
                "Provide personalized study abroad guidance",
                "Improve our platform and services",
              ].map((item, index) => (
                <li key={index} className="flex gap-2 items-start">
                  <CheckCircle className="text-[#E08D3C] w-5 h-5 mt-1" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Section 3 */}
          <div>
            <h2 className="text-xl font-semibold text-[#2C3539] mb-3">
              3. Payment Security
            </h2>
            <p className="text-gray-700">
              All payments are processed through Razorpay. We do not store your card or banking details on our servers.
            </p>
          </div>

          {/* Section 4 */}
          <div>
            <h2 className="text-xl font-semibold text-[#2C3539] mb-3">
              4. Third-Party Services
            </h2>
            <p className="text-gray-700 mb-2">
              We use trusted third-party tools including:
            </p>
            <ul className="space-y-2 text-gray-700">
              <li>• Calendly (for scheduling appointments)</li>
              <li>• Razorpay (for payment processing)</li>
            </ul>
            <p className="text-gray-700 mt-2">
              These platforms have their own privacy policies governing your data.
            </p>
          </div>

          {/* Section 5 */}
          <div>
            <h2 className="text-xl font-semibold text-[#2C3539] mb-3">
              5. Data Protection
            </h2>
            <p className="text-gray-700">
              We implement industry-standard security practices to safeguard your information.
            </p>
          </div>

          {/* Section 6 */}
          <div>
            <h2 className="text-xl font-semibold text-[#2C3539] mb-3">
              6. User Rights
            </h2>
            <ul className="space-y-2 text-gray-700">
              <li>• Access your data</li>
              <li>• Update or correct your data</li>
              <li>• Delete your data</li>
            </ul>
          </div>

          {/* Section 7 */}
          <div>
            <h2 className="text-xl font-semibold text-[#2C3539] mb-3">
              7. Updates to Policy
            </h2>
            <p className="text-gray-700">
              UNI360 reserves the right to update this policy at any time.
            </p>
          </div>

          {/* Section 8 */}
          <div>
            <h2 className="text-xl font-semibold text-[#2C3539] mb-3">
              8. Contact Us
            </h2>
            <p className="text-gray-700">
              For any privacy concerns, contact us at{" "}
              <a
                href="mailto:support@uni360degree.com"
                className="text-[#E08D3C] font-medium hover:underline"
              >
                support@uni360degree.com
              </a>
            </p>
          </div>

        </Card>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default PrivacyPolicy;