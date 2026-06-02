import { Link } from "react-router-dom";
import { GraduationCap, Mail, Phone, MapPin, Globe, Twitter, Linkedin, Instagram } from "lucide-react";
import UniLogo from "/assets/Uni360-logo.png";

const footerLinks = {
  legal: [
    { label: "Privacy Policy",              to: "/privacy" },
    { label: "Terms & Conditions",          to: "/terms" },
    { label: "Refund & Cancellation",       to: "/refund" },
     { label: "Cancellation Policy",  to: "/cancellation" },
  ],
  explore: [
    { label: "Pricing",                     to: "/pricing" },
    { label: "Universities",                to: "/universities" },
    { label: "AI Tools",                    to: "/ai-tools" },
    { label: "Resources",                   to: "/resources" },
  ],
};

const socials = [
  { icon: Globe,     href: "https://uni360degree.com",                    label: "Website" },
  { icon: Linkedin,  href: "https://linkedin.com/company/uni360degree",   label: "LinkedIn" },
  { icon: Twitter,   href: "https://twitter.com/uni360degree",            label: "Twitter" },
  { icon: Instagram, href: "https://instagram.com/uni360degree",          label: "Instagram" },
];

export function Footer() {
  return (
    <footer className="mt-16 border-t border-border/60 bg-background/70 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 sm:py-10 md:py-14">
        <div className="flex flex-col lg:grid lg:grid-cols-4 gap-8 lg:gap-10">

          {/* Brand */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/dashboard" className="flex items-center w-fit hover:opacity-80 transition-opacity -ml-1 sm:-ml-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 rounded-lg flex items-end justify-center pb-1 mt-1 sm:mt-2">
                <img src={UniLogo} alt="Uni360 Logo" className="w-8 h-8 sm:w-10 sm:h-10 md:w-14 md:h-14 object-contain" />
              </div>
              <span className="font-bold text-xl sm:text-xl md:text-2xl text-foreground ml-1 sm:-ml-3 mt-1 sm:mt-0">
                UNI360°
              </span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
              Your all-in-one student portal for international university applications,
              visa guidance, AI-powered tools, and financial planning — built to get you
              to your dream university faster.
            </p>

            {/* Contact info */}
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-primary/70 flex-shrink-0" />
                <a href="mailto:support@uni360degree.com" className="hover:text-primary transition-colors">
                  support@uni360degree.com
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-primary/70 flex-shrink-0" />
                <span>+91 98765 43210</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary/70 flex-shrink-0" />
                <span>India · Germany · United Kingdom</span>
              </div>
            </div>

            {/* Socials */}
            <div className="flex items-center gap-3 pt-1">
              {socials.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="p-2 rounded-lg border border-border/60 text-muted-foreground hover:text-primary hover:border-primary/40 hover:bg-primary/5 transition-all duration-200"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2 grid grid-cols-2 gap-6 sm:gap-10 pt-2 sm:pt-0">
            {/* Legal */}
            <div className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground tracking-wide uppercase">Legal</h4>
            <ul className="space-y-2.5">
              {footerLinks.legal.map(({ label, to }) => (
                <li key={to}>
                  <Link
                    to={to}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Explore */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground tracking-wide uppercase">Explore</h4>
            <ul className="space-y-2.5">
              {footerLinks.explore.map(({ label, to }) => (
                <li key={to}>
                  <Link
                    to={to}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 sm:mt-10 pt-6 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground text-center sm:text-left">
          <p>© {new Date().getFullYear()} UNI360°. All rights reserved.</p>
          
        </div>
      </div>
    </footer>
  );
}