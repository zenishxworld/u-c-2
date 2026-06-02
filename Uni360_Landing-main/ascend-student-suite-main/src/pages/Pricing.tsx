import { Link } from "react-router-dom";
import {
  ArrowLeft, Check, Shield, Zap, FileText, Globe, Home,
  CreditCard, BookOpen, ClipboardList, Users, AlertCircle,
  GraduationCap, Star
} from "lucide-react";

// ─── Service breakdown data ─────────────────────────────────────────────────
const services = [
  {
    icon: Globe,
    title: "Visa Guidance",
    tag: "VISA",
    tagColor: "bg-blue-100 text-blue-700",
    items: [
      { label: "Student Visa Checklist (DE & UK)", price: "Free" },
      { label: "Visa appointment booking tracker", price: "Free" },
      { label: "Consulate fee payment (Razorpay)", price: "₹1*" },
      { label: "1-on-1 Visa consultation session", price: "Contact us" },
    ],
  },
  {
    icon: FileText,
    title: "AI Document Studio",
    tag: "AI TOOLS",
    tagColor: "bg-orange-100 text-orange-700",
    items: [
      { label: "Statement of Purpose (SOP)", price: "₹299" },
      { label: "Letter of Recommendation (LOR)", price: "₹499" },
      { label: "Cover Letter Generator", price: "₹499" },
    ],
  },
  {
    icon: GraduationCap,
    title: "University Applications",
    tag: "UNIVERSITIES",
    tagColor: "bg-emerald-100 text-emerald-700",
    items: [
      { label: "University shortlisting (DE & UK)", price: "Free" },
      { label: "Course matching & favourites", price: "Free" },
      { label: "Application processing fee", price: "₹1*" },
      { label: "Application status tracker", price: "Free" },
    ],
  },
  {
    icon: Home,
    title: "Blocked Account & Finances",
    tag: "FINANCES",
    tagColor: "bg-purple-100 text-purple-700",
    items: [
      { label: "Blocked account guidance (DE)", price: "Free" },
      { label: "Coracle / Deutsche Bank walkthrough", price: "Free" },
      { label: "Monthly budget planner", price: "Free" },
      { label: "Finances tracker", price: "Free" },
    ],
  },
  {
    icon: ClipboardList,
    title: "APS & Academic Recognition",
    tag: "VISA",
    tagColor: "bg-blue-100 text-blue-700",
    items: [
      { label: "APS certificate guidance (DE)", price: "Free" },
      { label: "Document checklist & tracker", price: "Free" },
      { label: "Transcript preparation tips", price: "Free" },
    ],
  },
  {
    icon: BookOpen,
    title: "Profile & Documents",
    tag: "PROFILE",
    tagColor: "bg-amber-100 text-amber-700",
    items: [
      { label: "Profile builder (9 steps)", price: "Free" },
      { label: "Document vault (upload & store)", price: "Free" },
      { label: "Profile completion tracker", price: "Free" },
    ],
  },
];

const transparency = [
  {
    icon: Shield,
    title: "₹1 Processing Fee — Only",
    body: "The only payment you make on UNI360° is a ₹1 Razorpay processing fee — for university applications and visa consulate access. This is a one-time verification charge, not an application cost.",
  },
  {
    icon: CreditCard,
    title: "Razorpay — Secure & Transparent",
    body: "All payments are processed via Razorpay, India's most trusted payment gateway. You receive an instant receipt with your Payment ID, Order ID, and verified status. No hidden subscriptions or auto-debits.",
  },
  {
    icon: AlertCircle,
    title: "No Hidden Charges",
    body: "University application fees, visa fees, and consulate charges are paid directly to the respective institution — not to UNI360°. We never collect institutional fees on your behalf.",
  },
  {
    icon: Users,
    title: "University Fees Are Separate",
    body: "The actual university application fee (e.g. €75 for TU Munich) is paid directly on the university portal. UNI360° only charges ₹1 to verify your intent and unlock the application flow.",
  },
];

const feeNote = "* ₹1 = 100 paise. This is the platform processing fee charged by UNI360° via Razorpay for verification. Real visa/university fees are paid directly to official institutions.";

// ─── Component ───────────────────────────────────────────────────────────────
export default function Pricing() {
  return (
    <div className="min-h-screen bg-[hsl(219,25%,98%)]">
      {/* ── Sticky header ── */}
      <div className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          <Link
            to="/dashboard"
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-[#E08D3C]" />
            <span className="font-semibold text-[#2C3539]">Pricing</span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-16">

        {/* ── Hero ── */}
        <div className="text-center mb-14">
          {/* gradient pill */}
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium mb-6 text-white"
                style={{ background: "linear-gradient(135deg,#E08D3C,#C4DFF0)" }}>
            <Zap className="w-3.5 h-3.5" />
            Transparent & honest pricing
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#2C3539] mb-4 leading-tight">
            Everything You Need —<br />
            <span className="text-[#E08D3C]">Almost All Free</span>
          </h1>
          <p className="text-slate-500 max-w-xl mx-auto leading-relaxed">
            UNI360° gives you powerful tools to manage your entire study-abroad journey.
            The platform is free. A ₹1 Razorpay verification fee applies only at specific
            payment checkpoints — nothing else.
          </p>
        </div>

        {/* ── Summary badge ── */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14">
          {[
            { value: "₹1", label: "Max you ever pay us" },
            { value: "100%", label: "Razorpay secured" },
            { value: "0", label: "Hidden charges" },
          ].map(({ value, label }) => (
            <div
              key={label}
              className="flex flex-col items-center bg-white border border-slate-200 rounded-2xl px-8 py-5 shadow-sm min-w-[140px]"
            >
              <span className="text-3xl font-extrabold text-[#E08D3C]">{value}</span>
              <span className="text-xs text-slate-500 mt-1 text-center">{label}</span>
            </div>
          ))}
        </div>

        {/* ── Service Breakdown ── */}
        <h2 className="text-xl font-bold text-[#2C3539] mb-6">
          Full Service Breakdown
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-14">
          {services.map((svc) => (
            <div
              key={svc.title}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
            >
              {/* card header */}
              <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100"
                   style={{ background: "linear-gradient(120deg,#fff 60%,rgba(196,223,240,.18))" }}>
                <div className="p-2 rounded-lg" style={{ background: "rgba(224,141,60,.12)" }}>
                  <svc.icon className="w-4 h-4 text-[#E08D3C]" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-[#2C3539] text-sm">{svc.title}</p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${svc.tagColor}`}>
                  {svc.tag}
                </span>
              </div>
              {/* items */}
              <div className="divide-y divide-slate-50">
                {svc.items.map(({ label, price }) => (
                  <div key={label} className="flex items-center justify-between px-5 py-3 text-sm">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                      {label}
                    </div>
                    <span
                      className={`font-semibold text-xs ml-4 flex-shrink-0 ${
                        price === "Free"
                          ? "text-emerald-600"
                          : price.startsWith("₹")
                          ? "text-[#E08D3C]"
                          : "text-slate-400 italic"
                      }`}
                    >
                      {price}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Fee asterisk note */}
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 mb-14 text-sm text-amber-800">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-600" />
          <p>{feeNote}</p>
        </div>

        {/* ── Razorpay Transparency ── */}
        <h2 className="text-xl font-bold text-[#2C3539] mb-6">
          Payment Transparency
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-14">
          {transparency.map(({ icon: Icon, title, body }) => (
            <div key={title} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex gap-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "linear-gradient(135deg,#E08D3C22,#C4DFF040)" }}
              >
                <Icon className="w-5 h-5 text-[#E08D3C]" />
              </div>
              <div>
                <h3 className="font-semibold text-[#2C3539] text-sm mb-1">{title}</h3>
                <p className="text-slate-500 text-xs leading-relaxed">{body}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Payment flow visual ── */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sm:p-8 mb-14">
          <h2 className="text-lg font-bold text-[#2C3539] mb-6 text-center">
            How the ₹1 Payment Works
          </h2>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-0 sm:gap-0">
            {[
              { step: "1", label: "Click Pay ₹1", sub: "On university apply or visa access button" },
              { step: "2", label: "Razorpay Opens", sub: "UPI, Card, Net Banking — your choice" },
              { step: "3", label: "Backend Verifies", sub: "HMAC-SHA256 signature check" },
              { step: "4", label: "Receipt Generated", sub: "PDF auto-downloaded instantly" },
              { step: "5", label: "Proceed", sub: "Application or consulate page unlocks" },
            ].map(({ step, label, sub }, i, arr) => (
              <div key={step} className="flex items-center">
                <div className="flex flex-col items-center text-center w-28 sm:w-32">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm mb-2"
                    style={{ background: "linear-gradient(135deg,#E08D3C,#C4DFF0)" }}
                  >
                    {step}
                  </div>
                  <p className="text-xs font-semibold text-[#2C3539]">{label}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">{sub}</p>
                </div>
                {i < arr.length - 1 && (
                  <div className="hidden sm:block w-6 h-0.5 bg-gradient-to-r from-[#E08D3C] to-[#C4DFF0] mx-1 flex-shrink-0" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div
          className="rounded-2xl p-8 text-center text-white"
          style={{ background: "linear-gradient(135deg,#2C3539 0%,#3d4f57 60%,#4a6470 100%)" }}
        >
          <h2 className="text-2xl font-extrabold mb-2">Ready to Start?</h2>
          <p className="text-white/70 mb-6 text-sm">
            Your entire study-abroad journey, powered by AI — free to begin.
          </p>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 px-8 py-3 rounded-full font-semibold text-[#2C3539] bg-white hover:bg-slate-50 transition-colors shadow-lg"
          >
            <Zap className="w-4 h-4 text-[#E08D3C]" />
            Go to Dashboard
          </Link>
        </div>

        {/* Footer links */}
        <p className="mt-10 text-center text-sm text-slate-400">
          © {new Date().getFullYear()} UNI360°. ·{" "}
          <Link to="/privacy" className="hover:text-[#E08D3C] transition-colors">Privacy Policy</Link>
          {" · "}
          <Link to="/terms" className="hover:text-[#E08D3C] transition-colors">Terms</Link>
          {" · "}
          <Link to="/refund" className="hover:text-[#E08D3C] transition-colors">Refund Policy</Link>
        </p>
      </div>
    </div>
  );
}