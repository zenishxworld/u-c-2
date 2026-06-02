import { Link } from "react-router-dom";
import { Ban, ArrowLeft, Clock, Mail, AlertCircle } from "lucide-react";

const steps = [
  { step: "1", text: "Email us at support@uni360degree.com with the subject: 'Cancellation Request — [Payment ID]'" },
  { step: "2", text: "Include your payment ID, the service you wish to cancel, and the reason for cancellation" },
  { step: "3", text: "Our support team will review and confirm receipt within 1 business day" },
  { step: "4", text: "Processing and confirmation of cancellation will be completed within 3–5 business days" },
];

const nonCancellable = [
  "Services already initiated or completed (SOP generation, document processing, eligibility evaluation)",
  "University application fees once submitted to the institution",
  "AI-generated documents or reports already downloaded or accessed",
  "Visa consultation sessions that have already been confirmed",
  "Subscription services after the current billing cycle has begun",
];

export default function CancellationPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-rose-50/20 to-pink-50/10">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          <Link to="/dashboard" className="p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-600 hover:text-slate-900">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <Ban className="w-5 h-5 text-rose-600" />
            <span className="font-semibold text-slate-800">Cancellation Policy</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        {/* Hero */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-rose-100 rounded-2xl mb-6">
            <Ban className="w-8 h-8 text-rose-600" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3">Cancellation Policy</h1>
          <p className="text-slate-500 text-sm">Effective Date: March 26, 2026</p>
          <p className="mt-4 text-slate-600 max-w-xl mx-auto leading-relaxed">
            Please read our cancellation policy carefully before using any paid services on the UNI360° platform.
          </p>
        </div>

        <div className="space-y-8">
          {/* General */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-100">
            <h2 className="text-lg font-semibold text-slate-900 mb-3">General Policy</h2>
            <p className="text-slate-600 leading-relaxed text-sm sm:text-base">
              Users may request cancellation of a service by contacting our support team. Cancellation requests must be submitted via email and are subject to the timeline and conditions outlined below. Cancellations are not automatically processed — they require review and confirmation from our team.
            </p>
          </div>

          {/* Timeline */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 sm:p-8">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-5 h-5 text-amber-600" />
              <h2 className="text-lg font-semibold text-slate-900">Cancellation Window</h2>
            </div>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              Cancellation requests must be submitted within <strong>24 hours</strong> of payment for consideration. Requests submitted after this window will generally not be accepted. For subscription-based services, cancellations take effect at the end of the current billing cycle.
            </p>
          </div>

          {/* How to cancel */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-100">
            <div className="flex items-center gap-2 mb-6">
              <Mail className="w-5 h-5 text-blue-500" />
              <h2 className="text-lg font-semibold text-slate-900">How to Request Cancellation</h2>
            </div>
            <div className="space-y-4">
              {steps.map(({ step, text }) => (
                <div key={step} className="flex items-start gap-4">
                  <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-sm flex items-center justify-center flex-shrink-0">
                    {step}
                  </span>
                  <p className="text-sm sm:text-base text-slate-600 pt-1">{text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Non-cancellable */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-100">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <h2 className="text-lg font-semibold text-slate-900">Services That Cannot Be Cancelled</h2>
            </div>
            <ul className="space-y-3">
              {nonCancellable.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm sm:text-base text-slate-600">
                  <span className="w-2 h-2 rounded-full bg-red-400 mt-2 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Processing time */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-100">
            <h2 className="text-lg font-semibold text-slate-900 mb-3">Processing Time</h2>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              Once a cancellation request is approved, processing is completed within <strong>3–5 business days</strong>. If a refund is applicable under our{" "}
              <Link to="/refund" className="text-rose-600 hover:underline font-medium">Refund Policy</Link>, it will be credited to the original payment method within 5–7 business days of approval.
            </p>
          </div>

          {/* Contact */}
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 sm:p-8">
            <h2 className="text-lg font-semibold text-slate-900 mb-2">Contact for Cancellations</h2>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              To submit a cancellation request, email us at{" "}
              <a href="mailto:support@uni360degree.com" className="text-rose-700 font-medium hover:underline">
                support@uni360degree.com
              </a>
              . Please include your payment ID and the service you wish to cancel. Our team will respond within 1 business day.
            </p>
          </div>
        </div>

        <p className="mt-10 text-center text-sm text-slate-400">
          © {new Date().getFullYear()} UNI360°. ·{" "}
          <Link to="/refund" className="hover:text-rose-600 transition-colors">Refund Policy</Link>
          {" · "}
          <Link to="/privacy" className="hover:text-rose-600 transition-colors">Privacy Policy</Link>
          {" · "}
          <Link to="/terms" className="hover:text-rose-600 transition-colors">Terms & Conditions</Link>
        </p>
      </div>
    </div>
  );
}