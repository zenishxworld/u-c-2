import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, Phone, MapPin, MessageCircle, ArrowLeft, Send, CheckCircle, Loader2 } from "lucide-react";

const contactInfo = [
  { icon: Mail,    label: "Email",    value: "support@uni360degree.com", href: "mailto:support@uni360degree.com" },
  { icon: Phone,   label: "Phone",   value: "+91 98765 43210",           href: "tel:+919876543210" },
  { icon: MapPin,  label: "Address", value: "Mumbai, India · Operations across DE & UK", href: null },
  { icon: MessageCircle, label: "WhatsApp", value: "+91 98765 43210", href: "https://wa.me/919876543210" },
];

const topics = [
  "University Application Query",
  "Visa Assistance",
  "AI Tools Support",
  "Billing / Payment Issue",
  "Technical Support",
  "Partnership Enquiry",
  "Other",
];

export default function ContactUs() {
  const [form, setForm] = useState({ name: "", email: "", topic: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.topic || !form.message) {
      setError("Please fill in all fields.");
      return;
    }
    setSubmitting(true);
    // Simulate submission (replace with real API call when ready)
    await new Promise((r) => setTimeout(r, 1500));
    setSubmitting(false);
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          <Link to="/dashboard" className="p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-600 hover:text-slate-900">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-indigo-600" />
            <span className="font-semibold text-slate-800">Contact Us</span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        {/* Hero */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-2xl mb-6">
            <MessageCircle className="w-8 h-8 text-indigo-600" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3">Get in Touch</h1>
          <p className="text-slate-600 max-w-lg mx-auto leading-relaxed">
            Have questions, need support, or want to partner with us? We'd love to hear from you. Our team typically responds within 24 hours.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Contact Info */}
          <div className="lg:col-span-2 space-y-5">
            {contactInfo.map(({ icon: Icon, label, value, href }) => (
              <div
                key={label}
                className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex items-start gap-4"
              >
                <div className="p-2.5 bg-indigo-50 rounded-xl">
                  <Icon className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">{label}</p>
                  {href ? (
                    <a href={href} target="_blank" rel="noopener noreferrer" className="text-sm text-slate-800 hover:text-indigo-600 transition-colors font-medium">
                      {value}
                    </a>
                  ) : (
                    <p className="text-sm text-slate-700 font-medium">{value}</p>
                  )}
                </div>
              </div>
            ))}

            <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-2xl p-6 text-white">
              <h3 className="font-bold text-base mb-2">Office Hours</h3>
              <div className="space-y-1 text-sm text-white/80">
                <p>Mon – Fri: 9:00 AM – 7:00 PM IST</p>
                <p>Saturday: 10:00 AM – 4:00 PM IST</p>
                <p>Sunday: Closed</p>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-100">
              {submitted ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-5">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 mb-2">Message Sent!</h2>
                  <p className="text-slate-600 text-sm max-w-xs">
                    Thank you for reaching out. We'll get back to you within 24 hours at <strong>{form.email}</strong>.
                  </p>
                  <button
                    onClick={() => { setSubmitted(false); setForm({ name: "", email: "", topic: "", message: "" }); }}
                    className="mt-6 text-indigo-600 text-sm font-medium hover:underline"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <h2 className="text-xl font-bold text-slate-900 mb-1">Send a Message</h2>
                  <p className="text-slate-500 text-sm mb-4">Fill in the form below and we'll respond shortly.</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">Full Name *</label>
                      <input
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        placeholder="Rahul Sharma"
                        className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">Email Address *</label>
                      <input
                        name="email"
                        type="email"
                        value={form.email}
                        onChange={handleChange}
                        placeholder="rahul@email.com"
                        className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Topic *</label>
                    <select
                      name="topic"
                      value={form.topic}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-white"
                    >
                      <option value="">Select a topic…</option>
                      {topics.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Message *</label>
                    <textarea
                      name="message"
                      value={form.message}
                      onChange={handleChange}
                      rows={5}
                      placeholder="Describe your question or issue in detail…"
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
                    />
                  </div>

                  {error && (
                    <p className="text-red-600 text-xs font-medium">{error}</p>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
                  >
                    {submitting ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</>
                    ) : (
                      <><Send className="w-4 h-4" /> Send Message</>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>

        <p className="mt-10 text-center text-sm text-slate-400">
          © {new Date().getFullYear()} UNI360°. · <Link to="/privacy" className="hover:text-indigo-600 transition-colors">Privacy Policy</Link> · <Link to="/terms" className="hover:text-indigo-600 transition-colors">Terms</Link>
        </p>
      </div>
    </div>
  );
}
