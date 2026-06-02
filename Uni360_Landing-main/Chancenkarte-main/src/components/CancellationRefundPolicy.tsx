import { ArrowLeft } from 'lucide-react';
import { useEffect } from 'react';

export const CancellationRefundPolicy = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const goBack = () => {
    window.history.back();
  };

  return (
    <div className="min-h-screen bg-off-white">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <button 
            onClick={goBack}
            className="flex items-center gap-2 text-gunmetal hover:text-tigers-eye transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <h1 className="text-2xl lg:text-6xl font-satoshi font-bold text-gunmetal mb-6">
              Cancellation & Refund Policy
            </h1>
            <p className="text-lg text-gunmetal/70 max-w-2xl mx-auto">
              Please carefully review our strict non-refundable and no-cancellation policy for all consulting services.
            </p>
          </div>

          {/* Content Card */}
          <div className="bg-white rounded-chancenkarte p-8 lg:p-12 shadow-sm">
            <div className="prose prose-lg max-w-none">
              
              {/* Introduction */}
              <div className="mb-8">
                <p className="text-sm text-gunmetal/80 leading-relaxed">
                  Last Updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
                <p className="text-sm text-gunmetal/80 leading-relaxed mt-4">
                  At UNI 360°, we value the time and expertise of our consultants as well as the commitment of our clients. To maintain the highest quality of service and ensure efficient scheduling, we enforce a strict <strong>No Cancellation and No Refund Policy</strong>. By booking a consultation or service with us and completing your payment, you explicitly acknowledge and agree to the terms outlined below.
                </p>
              </div>

              {/* 1. Strict Non-Refundable Policy */}
              <section className="mb-10">
                <h2 className="text-xl font-satoshi font-bold text-gunmetal mb-6">1. Strict Non-Refundable Policy</h2>
                <div className="space-y-4">
                  <p className="text-sm text-gunmetal/80 leading-relaxed">
                    All fees paid for consultation services, visa guidance, and any other offerings through our platform are <strong>100% non-refundable</strong>. Once a transaction is successfully processed through our payment gateway, the funds cannot be returned under any circumstances.
                  </p>
                  <p className="text-sm text-gunmetal/80 leading-relaxed">
                    This strict policy applies, but is not limited to, the following scenarios:
                  </p>
                  <ul className="space-y-2 mt-2">
                    <li className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-tigers-eye rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-sm text-gunmetal/80">Change of mind or decision to no longer pursue the visa or study program.</p>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-tigers-eye rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-sm text-gunmetal/80">Personal emergencies, illness, or unforeseen scheduling conflicts on the client's end.</p>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-tigers-eye rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-sm text-gunmetal/80">Dissatisfaction with the advice, recommendations, or outcome of the consultation.</p>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-tigers-eye rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-sm text-gunmetal/80">Failure to qualify for the visa or program discussed.</p>
                    </li>
                  </ul>
                </div>
              </section>

              {/* 2. No Cancellation Allowed */}
              <section className="mb-10">
                <h2 className="text-xl font-satoshi font-bold text-gunmetal mb-6">2. No Cancellations Permitted</h2>
                <div className="space-y-4">
                  <p className="text-sm text-gunmetal/80 leading-relaxed">
                    Once a booking is confirmed and a time slot is reserved on our calendar, <strong>cancellations are not permitted</strong>. The allocated time is exclusively reserved for you, which prevents other clients from booking that slot. Because our consultants dedicate time to prepare for your specific case prior to the meeting, we cannot accommodate cancellations.
                  </p>
                  <div className="bg-red-50 border border-red-100 rounded-lg p-6">
                    <p className="text-sm text-red-800 leading-relaxed font-medium">
                      If you choose not to attend your scheduled session or notify us that you wish to cancel, the session will be marked as forfeited. You will not receive a refund, and you will not be offered an alternative slot.
                    </p>
                  </div>
                </div>
              </section>

              {/* 3. No-Shows and Punctuality */}
              <section className="mb-10">
                <h2 className="text-xl font-satoshi font-bold text-gunmetal mb-6">3. No-Shows and Punctuality</h2>
                <div className="space-y-4">
                  <p className="text-sm text-gunmetal/80 leading-relaxed">
                    Clients are expected to join the consultation meeting exactly at the scheduled start time. 
                  </p>
                  <ul className="space-y-2 mt-2">
                    <li className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-tigers-eye rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-sm text-gunmetal/80"><strong>No-Show:</strong> If a client fails to join the meeting within 15 minutes of the scheduled start time, it will be classified as a "No-Show." The meeting will be terminated, and the entire fee will be forfeited.</p>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-tigers-eye rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-sm text-gunmetal/80"><strong>Late Arrivals:</strong> If you join late (within the 15-minute grace period), the meeting will still end at the originally scheduled time. Time lost due to late arrival will not be compensated or refunded.</p>
                    </li>
                  </ul>
                </div>
              </section>

              {/* 4. Technical Responsibilities */}
              <section className="mb-10">
                <h2 className="text-xl font-satoshi font-bold text-gunmetal mb-6">4. Client's Technical Responsibilities</h2>
                <div className="space-y-4">
                  <p className="text-sm text-gunmetal/80 leading-relaxed">
                    It is the sole responsibility of the client to ensure they have a stable internet connection, a working webcam, and a functioning microphone before the meeting begins. <strong>No refunds will be issued for meetings disrupted, delayed, or missed due to technical difficulties on the client's end.</strong>
                  </p>
                </div>
              </section>

              {/* 5. Exceptions (UNI360° Cancellations) */}
              <section className="mb-10">
                <h2 className="text-xl font-satoshi font-bold text-gunmetal mb-6">5. UNI 360° Initiated Cancellations</h2>
                <div className="space-y-4">
                  <p className="text-sm text-gunmetal/80 leading-relaxed">
                    In the highly unlikely event that UNI 360° or our consultant must cancel the meeting due to sudden illness, technical failure on our end, or an unforeseen emergency, we will notify you as soon as possible. In this singular scenario, the client will be offered the choice of:
                  </p>
                  <ul className="space-y-2 mt-2">
                    <li className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-tigers-eye rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-sm text-gunmetal/80">A free priority rescheduling to the next available slot.</p>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-tigers-eye rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-sm text-gunmetal/80">A full refund of the payment made.</p>
                    </li>
                  </ul>
                </div>
              </section>

              {/* 6. Disputes and Chargebacks */}
              <section className="mb-10">
                <h2 className="text-xl font-satoshi font-bold text-gunmetal mb-6">6. Payment Disputes and Chargebacks</h2>
                <div className="space-y-4">
                  <p className="text-sm text-gunmetal/80 leading-relaxed">
                    By making a payment, you agree not to file a chargeback or dispute with your bank or credit card company to bypass this no-refund policy. Fraudulent chargebacks will be vigorously contested using your booking confirmation, IP address logs, and communication history. Clients initiating unwarranted chargebacks will be permanently banned from all future UNI 360° services.
                  </p>
                </div>
              </section>

              {/* 7. Contact Us */}
              <section className="mb-10">
                <h2 className="text-xl font-satoshi font-bold text-gunmetal mb-6">7. Pre-Booking Questions</h2>
                <p className="text-sm text-gunmetal/80 leading-relaxed">
                  Because our policies are strictly enforced, we strongly encourage you to ask any preliminary questions before finalizing your booking and payment. We are happy to clarify our service offerings.
                </p>
                <div className="bg-off-white rounded-lg p-6 mt-4">
                  <p className="text-sm text-gunmetal/80">
                    Email Support: <a href="mailto:support@uni360degree.com" className="text-tigers-eye hover:underline font-medium">support@uni360degree.com</a>
                  </p>
                </div>
              </section>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CancellationRefundPolicy;
