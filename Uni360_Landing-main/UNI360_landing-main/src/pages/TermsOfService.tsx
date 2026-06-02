import React from "react";
import { Card } from "@/components/ui/card";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { CheckCircle } from "lucide-react";

const TermsAndConditions = () => {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Navbar */}
      <Navigation />

      {/* Main Content */}
      <div className="flex-grow max-w-5xl mx-auto px-3 xs:px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        
        {/* Heading */}
        <h1 className="mt-20 text-2xl xs:text-3xl sm:text-4xl font-bold text-[#2C3539] mb-6 text-center leading-tight">
          Terms & Conditions – UNI360
        </h1>

        <p className="text-center text-gray-600 mb-10">
          By using UNI360 services, you agree to the following terms.
        </p>

        {/* Card */}
        <Card className="p-6 sm:p-8 shadow-lg border border-gray-200 rounded-2xl space-y-8">

          {/* Section 1 */}
          <div>
            <h2 className="text-xl font-semibold text-[#2C3539] mb-3">
              1. Service Overview
            </h2>
            <p className="text-gray-700">
              UNI360 provides paid 1:1 consultation calls for study abroad guidance, visa processes, and eligibility assistance.
            </p>
          </div>

          {/* Section 2 */}
          <div>
            <h2 className="text-xl font-semibold text-[#2C3539] mb-3">
              2. Booking & Scheduling
            </h2>
            <ul className="space-y-2 text-gray-700">
              <li className="flex gap-2">
                <CheckCircle className="text-[#E08D3C] w-5 h-5 mt-1" />
                All consultations must be booked via Calendly
              </li>
              <li className="flex gap-2">
                <CheckCircle className="text-[#E08D3C] w-5 h-5 mt-1" />
                Users must select an available time slot
              </li>
              <li className="flex gap-2">
                <CheckCircle className="text-[#E08D3C] w-5 h-5 mt-1" />
                Booking is confirmed only after successful payment
              </li>
            </ul>
          </div>

          {/* Section 3 */}
          <div>
            <h2 className="text-xl font-semibold text-[#2C3539] mb-3">
              3. Payments
            </h2>
            <ul className="space-y-2 text-gray-700">
              <li>Payments are processed securely via Razorpay</li>
              <li>Prices are displayed before checkout</li>
              <li>All payments must be made in full before the session</li>
            </ul>
          </div>

          {/* Section 4 */}
          <div>
            <h2 className="text-xl font-semibold text-[#2C3539] mb-3">
              4. User Responsibility
            </h2>
            <ul className="space-y-2 text-gray-700">
              <li>Provide accurate information</li>
              <li>Join the session on time</li>
              <li>Maintain respectful communication</li>
            </ul>
          </div>

          {/* Section 5 */}
          <div>
            <h2 className="text-xl font-semibold text-[#2C3539] mb-3">
              5. Rescheduling Policy
            </h2>
            <ul className="space-y-2 text-gray-700">
              <li>Users may reschedule up to 12 hours before the scheduled call</li>
              <li>Rescheduling is subject to slot availability</li>
            </ul>
          </div>

          {/* Section 6 */}
          <div>
            <h2 className="text-xl font-semibold text-[#2C3539] mb-3">
              6. No-Show Policy
            </h2>
            <p className="text-gray-700">
              Failure to attend the session without prior notice will result in no refund.
            </p>
          </div>

          {/* Section 7 */}
          <div>
            <h2 className="text-xl font-semibold text-[#2C3539] mb-3">
              7. Service Limitation
            </h2>
            <p className="text-gray-700 mb-2">
              UNI360 provides guidance only and does not guarantee:
            </p>
            <ul className="space-y-2 text-gray-700">
              <li>• Visa approval</li>
              <li>• Admission confirmation</li>
            </ul>
          </div>

          {/* Section 8 */}
          <div>
            <h2 className="text-xl font-semibold text-[#2C3539] mb-3">
              8. Modification of Services
            </h2>
            <p className="text-gray-700">
              UNI360 reserves the right to modify or discontinue services at any time.
            </p>
          </div>

        </Card>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default TermsAndConditions;