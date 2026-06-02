import { Link } from "react-router-dom";
import { FileText, ArrowLeft } from "lucide-react";

const sections = [
  {
    title: "1. Services",
    body: `UNI360 provides: study abroad guidance; eligibility assessment; document handling (APS, SOP, visa process); and AI-powered recommendations. We do not guarantee admission or visa approval.`,
  },
  {
    title: "2. User Responsibilities",
    body: `You agree to: provide accurate and complete information; not misuse the platform; and maintain confidentiality of your account credentials.`,
  },
  {
    title: "3. Payments",
    body: `All payments must be made through approved payment methods. Pricing is displayed transparently on the platform. Services will begin only after successful payment.`,
  },
  {
    title: "4. Service Limitations",
    body: `UNI360 acts as a facilitator and guide. Final decisions are made by universities, government authorities, and visa officers. We do not guarantee any specific outcome for applications or visa processes.`,
  },
  {
    title: "5. Intellectual Property",
    body: `All platform content, design, and features are owned by UNI360 and may not be copied or reused without prior written permission.`,
  },
  {
    title: "6. Account Suspension",
    body: `We reserve the right to suspend or terminate accounts if false information is provided or if the platform is misused in any way.`,
  },
  {
    title: "7. Limitation of Liability",
    body: `UNI360 is not responsible for visa rejection, admission denial, or delays caused by third parties including universities, government bodies, or payment processors.`,
  },
  {
    title: "8. Termination",
    body: `We may terminate your access to the platform at any time if these terms are violated, with or without notice at our discretion.`,
  },
  {
    title: "9. Governing Law",
    body: `These terms are governed by the laws of India. Any disputes arising from the use of the platform shall be subject to the jurisdiction of the courts of India.`,
  },
  {
    title: "10. Contact",
    body: `For any queries regarding these Terms & Conditions, please contact us at:\nEmail: support@uni360degree.com\nPhone: +91 98765 43210`,
  },
];

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50/20 to-amber-50/10">
      <div className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          <Link to="/dashboard" className="p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-600 hover:text-slate-900">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-orange-600" />
            <span className="font-semibold text-slate-800">Terms &amp; Conditions</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        <div className="mb-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-2xl mb-6">
            <FileText className="w-8 h-8 text-orange-600" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3">Terms &amp; Conditions</h1>
          <p className="text-slate-500 text-sm">Effective Date: March 26, 2026</p>
          <p className="mt-4 text-slate-600 max-w-xl mx-auto leading-relaxed">
            By accessing and using UNI360°, you agree to the following terms. Please read them carefully before using our platform.
          </p>
        </div>

        <div className="space-y-8">
          {sections.map((s) => (
            <div key={s.title} className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-100">
              <h2 className="text-lg font-semibold text-slate-900 mb-3">{s.title}</h2>
              <p className="text-slate-600 leading-relaxed text-sm sm:text-base whitespace-pre-line">{s.body}</p>
            </div>
          ))}
        </div>

        <p className="mt-10 text-center text-sm text-slate-400">
          © {new Date().getFullYear()} UNI360°. ·{" "}
          <Link to="/privacy" className="hover:text-orange-600 transition-colors">Privacy Policy</Link>
          {" · "}
          <Link to="/refund" className="hover:text-orange-600 transition-colors">Refund Policy</Link>
        </p>
      </div>
    </div>
  );
}