import { Link } from "react-router-dom";
import { Shield, ArrowLeft } from "lucide-react";

const sections = [
  {
    title: "1. Information We Collect",
    body: `We may collect the following types of information: Personal details such as name, email address, and phone number; Academic information including qualifications, documents, and eligibility details; Visa-related data such as passport details, APS documents, and application data; Payment details — transaction information processed securely via third-party providers; and Usage data including device info, IP address, and browser type.`,
  },
  {
    title: "2. How We Use Your Information",
    body: `We use your data to: provide eligibility checks and university recommendations; process visa-related workflows (APS, SOP, documentation); enable account access and dashboard functionality; improve platform performance and user experience; and communicate updates, notifications, and support.`,
  },
  {
    title: "3. Payment Processing",
    body: `We do not store your card or banking details. All payments are processed securely through third-party payment gateways.`,
  },
  {
    title: "4. Data Sharing",
    body: `We may share data with: trusted service providers (payment gateways, hosting, analytics); universities or partners (only when required for your application); and legal authorities if required by law.`,
  },
  {
    title: "5. Data Security",
    body: `We implement appropriate technical and organizational measures to protect your data against unauthorized access, misuse, or disclosure.`,
  },
  {
    title: "6. Data Retention",
    body: `We retain your data only as long as necessary for service delivery and legal compliance.`,
  },
  {
    title: "7. Your Rights",
    body: `You have the right to access your data, request correction or deletion, and withdraw consent at any time by contacting us at support@uni360degree.com.`,
  },
  {
    title: "8. Cookies",
    body: `We use cookies to enhance user experience and analyze traffic. You can control cookie settings through your browser, though disabling them may affect some platform features.`,
  },
  {
    title: "9. Changes to This Policy",
    body: `We may update this policy from time to time. Continued use of the platform after changes are posted indicates acceptance of the updated policy.`,
  },
  {
    title: "10. Contact Us",
    body: `For any questions, contact us at:\nEmail: support@uni360degree.com\nPhone: +91 98765 43210\nLocations: India · Germany · United Kingdom`,
  },
];

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          <Link to="/dashboard" className="p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-600 hover:text-slate-900">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            <span className="font-semibold text-slate-800">Privacy Policy</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        {/* Hero */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-2xl mb-6">
            <Shield className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3">Privacy Policy</h1>
          <p className="text-slate-500 text-sm">Effective Date: March 26, 2026</p>
          <p className="mt-4 text-slate-600 max-w-xl mx-auto leading-relaxed">
            At UNI360°, we value your privacy and are committed to protecting your personal data. This Privacy Policy explains how we collect, use, and safeguard your information when you use our platform.
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-8">
          {sections.map((s) => (
            <div key={s.title} className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-100">
              <h2 className="text-lg font-semibold text-slate-900 mb-3">{s.title}</h2>
              <p className="text-slate-600 leading-relaxed text-sm sm:text-base whitespace-pre-line">{s.body}</p>
            </div>
          ))}
        </div>

        <p className="mt-10 text-center text-sm text-slate-400">
          © {new Date().getFullYear()} UNI360°. All rights reserved. ·{" "}
          <Link to="/terms" className="hover:text-blue-600 transition-colors">Terms & Conditions</Link>
          {" · "}
          <Link to="/refund" className="hover:text-blue-600 transition-colors">Refund Policy</Link>
        </p>
      </div>
    </div>
  );
}