import { ArrowLeft } from 'lucide-react';
import { useEffect } from 'react';

export const CancellationReschedulingPolicy = () => {
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
              Rescheduling Policy
            </h1>
            <p className="text-lg text-gunmetal/70 max-w-2xl mx-auto">
              Please carefully review our strict policy regarding modifications to your confirmed booking time.
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
                  At UNI 360°, our consultants operate on tightly optimized schedules to ensure maximum focus and preparation for every client. To respect the time of our team and ensure fair access to availability for all clients, we maintain a <strong>Strict No Rescheduling Policy</strong>.
                </p>
              </div>

              {/* 1. Finality of Booked Slots */}
              <section className="mb-10">
                <h2 className="text-xl font-satoshi font-bold text-gunmetal mb-6">1. Finality of Booked Slots</h2>
                <div className="space-y-4">
                  <p className="text-sm text-gunmetal/80 leading-relaxed">
                    When you select a date and time and complete your payment, that specific slot is hard-booked into our calendar and made unavailable to anyone else. <strong>Therefore, the date and time of your consultation are final and cannot be altered, postponed, or shifted under any circumstances.</strong>
                  </p>
                  <p className="text-sm text-gunmetal/80 leading-relaxed">
                    We urge all clients to thoroughly double-check their personal schedules, work commitments, and local time zones before finalizing a booking.
                  </p>
                </div>
              </section>

              {/* 2. No Exceptions */}
              <section className="mb-10">
                <h2 className="text-xl font-satoshi font-bold text-gunmetal mb-6">2. No Exceptions for Personal Emergencies</h2>
                <div className="space-y-4">
                  <p className="text-sm text-gunmetal/80 leading-relaxed">
                    We recognize that unexpected events occur in life; however, to maintain an efficient consulting practice, we cannot make exceptions to this policy. Requests to reschedule due to:
                  </p>
                  <ul className="space-y-2 mt-2">
                    <li className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-tigers-eye rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-sm text-gunmetal/80">Illness or medical situations</p>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-tigers-eye rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-sm text-gunmetal/80">Last-minute work commitments or meetings</p>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-tigers-eye rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-sm text-gunmetal/80">Travel delays or time zone miscalculations</p>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-tigers-eye rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-sm text-gunmetal/80">Power outages or local internet disruptions</p>
                    </li>
                  </ul>
                  <p className="text-sm text-gunmetal/80 leading-relaxed mt-4">
                    ...will <strong>not be accommodated</strong>. The session will proceed at the originally scheduled time. If you cannot attend, it will be treated as a forfeiture of the session.
                  </p>
                </div>
              </section>

              {/* 3. Consequences of Missing a Session */}
              <section className="mb-10">
                <h2 className="text-xl font-satoshi font-bold text-gunmetal mb-6">3. Consequences of Missing a Session</h2>
                <div className="space-y-4">
                  <div className="bg-red-50 border border-red-100 rounded-lg p-6">
                    <p className="text-sm text-red-800 leading-relaxed font-medium">
                      If you realize you cannot make your appointed time and request a reschedule, the request will be denied. If you subsequently fail to attend the meeting, the session is forfeited entirely. You will need to book and pay for a brand-new consultation if you wish to speak with our consultants in the future.
                    </p>
                  </div>
                </div>
              </section>

              {/* 4. Consultant Initiated Rescheduling */}
              <section className="mb-10">
                <h2 className="text-xl font-satoshi font-bold text-gunmetal mb-6">4. Consultant Initiated Rescheduling</h2>
                <div className="space-y-4">
                  <p className="text-sm text-gunmetal/80 leading-relaxed">
                    While clients are strictly bound to their chosen time, UNI 360° reserves the right to reschedule a meeting in the rare event of consultant illness, severe technical outages on our end, or unavoidable emergencies. 
                  </p>
                  <p className="text-sm text-gunmetal/80 leading-relaxed">
                    Should this happen, we will contact you immediately to arrange a mutually convenient alternative time, or we will offer a full refund if a suitable time cannot be found.
                  </p>
                </div>
              </section>

              {/* 5. Contact Us */}
              <section className="mb-10">
                <h2 className="text-xl font-satoshi font-bold text-gunmetal mb-6">5. Contact and Inquiries</h2>
                <p className="text-sm text-gunmetal/80 leading-relaxed">
                  We highly recommend resolving any doubts about your availability before submitting payment. If you have any inquiries regarding the services provided during the consultation, please contact our support team prior to booking.
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

export default CancellationReschedulingPolicy;
