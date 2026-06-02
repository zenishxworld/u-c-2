import { Link } from "react-router-dom";
import { RefreshCw, ArrowLeft, CheckCircle, XCircle, Clock, Ban } from "lucide-react";

const eligible = [
  "Cancellation is requested within 24 hours of payment and no major service activity has been completed",
  "Technical error during payment that results in a failed transaction but amount deducted",
  "Duplicate payment charged for the same service",
  "Service not delivered due to a platform error on our end",
];

const ineligible = [
  "Change of plans after service initiation",
  "Visa rejection",
  "Admission rejection",
  "Delays caused by external authorities",
  "AI-generated documents or reports already downloaded",
  "Partial use of subscription or bundled services",
];

const process = [
  { step: "1", text: "Email us at support@uni360degree.com with subject: 'Refund Request — [Payment ID]'" },
  { step: "2", text: "Include your payment ID, the date of payment, and the reason for your request" },
  { step: "3", text: "Our team will review your request within 3 business days" },
  { step: "4", text: "If approved, refunds are credited to the original payment method within 5–7 business days" },
];

export default function RefundPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50/20 to-emerald-50/10">
      <div className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          <Link to="/dashboard" className="p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-600 hover:text-slate-900">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-emerald-600" />
            <span className="font-semibold text-slate-800">Refund &amp; Cancellation Policy</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        <div className="mb-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-2xl mb-6">
            <RefreshCw className="w-8 h-8 text-emerald-600" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3">Refund &amp; Cancellation Policy</h1>
          <p className="text-slate-500 text-sm">Effective Date: March 26, 2026</p>
          <p className="mt-4 text-slate-600 max-w-xl mx-auto leading-relaxed">
            We want you to be fully informed about our refund process before making any payments on the UNI360° platform.
          </p>
        </div>

        <div className="space-y-8">
          {/* General */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-100">
            <h2 className="text-lg font-semibold text-slate-900 mb-3">1. Refund Policy</h2>
            <p className="text-slate-600 leading-relaxed text-sm sm:text-base">
              Due to the nature of digital and service-based offerings, refunds are only applicable before service initiation. Once services such as SOP generation, document processing, or eligibility evaluation have started, no refunds will be provided.
            </p>
          </div>

          {/* Partial Refunds */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-100">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle className="w-5 h-5 text-emerald-500" />
              <h2 className="text-lg font-semibold text-slate-900">2. Partial Refunds — When You May Be Eligible</h2>
            </div>
            <ul className="space-y-3">
              {eligible.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm sm:text-base text-slate-600">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 mt-2 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Non-Refundable */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-100">
            <div className="flex items-center gap-2 mb-4">
              <XCircle className="w-5 h-5 text-red-500" />
              <h2 className="text-lg font-semibold text-slate-900">3. Non-Refundable Cases</h2>
            </div>
            <p className="text-slate-600 text-sm sm:text-base mb-4">No refunds will be issued for:</p>
            <ul className="space-y-3">
              {ineligible.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm sm:text-base text-slate-600">
                  <span className="w-2 h-2 rounded-full bg-red-400 mt-2 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Cancellation Policy */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-100">
            <div className="flex items-center gap-2 mb-4">
              <Ban className="w-5 h-5 text-amber-500" />
              <h2 className="text-lg font-semibold text-slate-900">4. Cancellation Policy</h2>
            </div>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              Users may cancel services by contacting our support team. Cancellation requests must be submitted via email to support@uni360degree.com. Processing time is 3–5 business days. Cancellations after 24 hours of payment will generally not be accepted.
            </p>
          </div>

          {/* Refund Process */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-100">
            <div className="flex items-center gap-2 mb-6">
              <Clock className="w-5 h-5 text-blue-500" />
              <h2 className="text-lg font-semibold text-slate-900">5. Refund Processing Time &amp; How to Request</h2>
            </div>
            <p className="text-slate-600 text-sm sm:text-base mb-6">
              Approved refunds will be processed within <strong>5–7 business days</strong> to the original payment method.
            </p>
            <div className="space-y-4">
              {process.map(({ step, text }) => (
                <div key={step} className="flex items-start gap-4">
                  <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-sm flex items-center justify-center flex-shrink-0">
                    {step}
                  </span>
                  <p className="text-sm sm:text-base text-slate-600 pt-1">{text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 sm:p-8">
            <h2 className="text-lg font-semibold text-slate-900 mb-2">6. Contact for Refunds</h2>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              For all refund or cancellation requests, please email us at{" "}
              <a href="mailto:support@uni360degree.com" className="text-emerald-700 font-medium hover:underline">
                support@uni360degree.com
              </a>{" "}
              with your payment details. Our team will respond within 3 business days.
            </p>
          </div>
        </div>

        <p className="mt-10 text-center text-sm text-slate-400">
          © {new Date().getFullYear()} UNI360°. ·{" "}
          <Link to="/cancellation" className="hover:text-emerald-600 transition-colors">Cancellation Policy</Link>
          {" · "}
          <Link to="/contact" className="hover:text-emerald-600 transition-colors">Contact Us</Link>
        </p>
      </div>
    </div>
  );
}