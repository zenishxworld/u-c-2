import React from "react";
import { Card } from "@/components/ui/card";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { CheckCircle } from "lucide-react";

const RefundCancellationPolicy = () => {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Navbar */}
      <Navigation />

      {/* Main Content */}
      <div className="flex-grow max-w-5xl mx-auto px-3 xs:px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        
        {/* Heading */}
        <h1 className="mt-20 text-2xl xs:text-3xl sm:text-4xl font-bold text-[#2C3539] mb-6 text-center leading-tight">
          Refund & Cancellation Policy – UNI360
        </h1>

        <p className="text-center text-gray-600 mb-10">
          Please read our policy carefully before booking your consultation.
        </p>

        {/* Card */}
        <Card className="p-6 sm:p-8 shadow-lg border border-gray-200 rounded-2xl space-y-8">
          
          {/* Section 1 */}
          <div>
            <h2 className="text-xl font-semibold text-[#2C3539] mb-3">
              1. No Refund Policy
            </h2>
            <p className="text-gray-700">
              Please note that <strong>no refunds</strong> will be provided once the payment is successfully completed. All consultation bookings are final.
            </p>
          </div>

          {/* Section 2 */}
          <div>
            <h2 className="text-xl font-semibold text-[#2C3539] mb-3">
              2. No Cancellations
            </h2>
            <p className="text-gray-700">
              We do not allow cancellations for any booked sessions. Please ensure you select a time slot you can commit to before completing the payment.
            </p>
          </div>

          {/* Section 3 */}
          <div>
            <h2 className="text-xl font-semibold text-[#2C3539] mb-3">
              3. Payment Issues
            </h2>
            <p className="text-gray-700">
              If any kind of technical issues or payment failures happen while making the payment and the amount is deducted, it will be auto-refunded by your bank or the payment gateway (Razorpay) as per their standard timelines. UNI360 is not responsible for transaction failures.
            </p>
          </div>

          {/* Section 4 */}
          <div>
            <h2 className="text-xl font-semibold text-[#2C3539] mb-3">
              4. No-Show
            </h2>
            <p className="text-gray-700">
              If a user fails to attend the scheduled call at the appointed time, the session will be considered forfeited. No refunds or free rescheduling will be provided in this case.
            </p>
          </div>

          {/* Section 5 */}
          <div>
            <h2 className="text-xl font-semibold text-[#2C3539] mb-3">
              5. Rescheduling by UNI360
            </h2>
            <p className="text-gray-700">
              In the rare event that our counselors are unavailable due to unforeseen circumstances, we will provide an option to reschedule your session at no additional cost.
            </p>
          </div>

        </Card>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default RefundCancellationPolicy;