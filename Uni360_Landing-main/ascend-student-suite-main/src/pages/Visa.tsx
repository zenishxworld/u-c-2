import { useState, useEffect, useCallback } from "react";
import { useOutletContext } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import jsPDF from "jspdf";

import {
  CheckCircle,
  Clock,
  FileText,
  Calendar,
  Phone,
  AlertTriangle,
  Upload,
  Download,
  ExternalLink,
  Info,
  X,
  CreditCard,
  MapPin,
  RefreshCw,
  Loader2,
  CheckSquare,
  Square,
  TrendingUp,
  Shield,
  Fingerprint,
  FileCheck,
  FileEdit,
  MailCheck,
  IdCard,
  Image as ImageIcon,
  Landmark,
  Banknote,
} from "lucide-react";

import {
  getVisaChecklist,
  getVisaTracker,
  updateVisaTracker,
  getVisaAppointments,
  getMeetingUrl,
} from "@/services/studentProfile.js";
import RazorpayButton from "@/components/RazorpayButton";
import { useAuth } from "@/contexts/AuthContext";


type Country = "DE" | "UK";

interface ContextType {
  selectedCountry: Country;
}

interface AppointmentDetails {
  date: string;
  time: string;
  location: string;
}

interface VisaStep {
  id: number;
  title: string;
  description: string;
  status: string;
  documents: string[];
  timeline: string;
  notes?: string[];
  appointmentDetails?: AppointmentDetails;
}

interface ApiAppointment {
  id: string | number;
  type?: string;
  appointmentType?: string;
  date?: string;
  scheduledDate?: string;
  time?: string;
  scheduledTime?: string;
  location?: string;
  venue?: string;
  status?: string;
  country?: string;
  notes?: string;
  confirmationNumber?: string;
  referenceNumber?: string;
  embassy?: string;
  visaCategory?: string;
  instructions?: string;
  address?: string;
  contactPhone?: string;
  contactEmail?: string;
}


const visaProcessSteps: Record<Country, VisaStep[]> = {
  DE: [
    {
      id: 4,
      title: "Health Insurance",
      description: "Obtain German health insurance coverage",
      status: "current",
      documents: ["Insurance Certificate"],
      timeline: "In Progress",
    },
    {
      id: 5,
      title: "Visa Application",
      description: "Submit complete visa application",
      status: "pending",
      documents: ["Visa Form", "Passport", "Photos"],
      timeline: "Pending",
      notes: [
        "Bring cash for visa application fee payment",
        "If you have a non-German degree, bring your original degree certificate for verification",
      ],
    },
    {
      id: 6,
      title: "Biometrics Appointment",
      description: "Attend biometrics appointment at consulate",
      status: "pending",
      documents: [],
      timeline: "Pending",
      appointmentDetails: {
        date: "2024-04-15",
        time: "10:30 AM",
        location: "German Consulate General, Mumbai",
      },
    },
    {
      id: 7,
      title: "Visa Decision",
      description: "Receive visa decision and passport",
      status: "pending",
      documents: [],
      timeline: "4-8 weeks",
    },
  ],
  UK: [
    {
      id: 2,
      title: "CAS Statement",
      description: "Obtain Confirmation of Acceptance for Studies",
      status: "completed",
      documents: ["CAS Statement"],
      timeline: "Completed",
    },
    {
      id: 3,
      title: "IHS Payment",
      description: "Pay Immigration Health Surcharge",
      status: "current",
      documents: ["IHS Payment Receipt"],
      timeline: "In Progress",
    },
    {
      id: 4,
      title: "Student Visa Application",
      description: "Submit online visa application",
      status: "pending",
      documents: ["Visa Application", "Financial Evidence"],
      timeline: "Pending",
    },
    {
      id: 5,
      title: "Biometrics Appointment",
      description: "Attend biometrics appointment",
      status: "pending",
      documents: [],
      timeline: "Pending",
      appointmentDetails: {
        date: "2024-04-15",
        time: "10:30 AM",
        location: "UK VAC, Mumbai",
      },
    },
    {
      id: 6,
      title: "Visa Decision",
      description: "Receive visa decision and BRP collection",
      status: "pending",
      documents: [],
      timeline: "3-6 weeks",
    },
  ],
};

const visaDocumentChecklist: Record<Country, { category: string; items: string[] }[]> = {
  DE: [
    {
      category: "Identity & Travel",
      items: [
        "Valid passport (min. 6 months validity beyond stay)",
        "2 recent biometric passport photos (35x45mm)",
        "Copy of all previous passports (if any)",
      ],
    },
    {
      category: "University & Admission",
      items: [
        "Original university admission letter",
        "Blocked account proof (€11,208 minimum – e.g. Deutsche Bank or Fintiba)",
        "Proof of university enrolment / acceptance",
        "Previous academic certificates & transcripts (originals + copies)",
        "APS certificate (if graduated from India/China/Vietnam)",
      ],
    },
    {
      category: "Financial",
      items: [
        "Blocked account certificate showing required funds",
        "Bank statements (last 3–6 months)",
        "Scholarship letter (if applicable)",
        "Sponsor's financial proof + affidavit of support (if sponsor-funded)",
      ],
    },
    {
      category: "Health Insurance",
      items: [
        "German public health insurance confirmation (e.g. TK, DAK, AOK)",
        "Travel insurance for entry (valid until German insurance kicks in)",
      ],
    },
    {
      category: "Application Forms",
      items: [
        "Completed national visa application form (signed)",
        "Visa fee payment: €75 (cash or demand draft)",
        "Cover letter explaining study plan and return intention",
      ],
    },
    {
      category: "Accommodation",
      items: [
        "Proof of accommodation in Germany (dorm offer letter or rental agreement)",
      ],
    },
  ],
  UK: [
    {
      category: "Identity & Travel",
      items: [
        "Valid passport (must be valid for the entire course duration)",
        "2 recent passport-size photos (45x35mm, white background)",
        "Previous passports (if any)",
      ],
    },
    {
      category: "University & CAS",
      items: [
        "CAS (Confirmation of Acceptance for Studies) number from university",
        "Unconditional offer letter from UKVI-licensed university",
        "Academic transcripts and degree certificates",
        "English language test result (IELTS Academic – 6.0+ typically)",
      ],
    },
    {
      category: "Financial",
      items: [
        "Bank statements showing required funds held for 28 consecutive days",
        "Required funds: £1,334/month for up to 9 months in London; £1,023/month outside London",
        "Tuition fee funds (first year) if not already paid",
        "Official financial sponsorship letter (if sponsored)",
      ],
    },
    {
      category: "Immigration Health Surcharge (IHS)",
      items: [
        "IHS payment reference number (paid online before applying)",
        "IHS amount: £776/year for students",
      ],
    },
    {
      category: "Application",
      items: [
        "Completed UK Student Visa online application (gov.uk)",
        "Visa application fee: £490 (paid online)",
        "ATAS clearance certificate (for certain STEM subjects)",
        "TB test certificate (if required for your country)",
        "Parental consent letter (if under 18)",
      ],
    },
    {
      category: "Additional",
      items: [
        "Proof of accommodation in the UK (university-provided or rental)",
        "Personal statement / study plan letter",
      ],
    },
  ],
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const getStepIcon = (title: string, status: string) => {
  const t = title.toLowerCase();
  if (t.includes('health') || t.includes('ihs')) return Shield;
  if (t.includes('biometric')) return Fingerprint;
  if (t.includes('application')) return FileEdit;
  if (t.includes('cas')) return FileCheck;
  if (t.includes('decision')) return MailCheck;

  switch (status) {
    case "completed":
      return CheckCircle;
    case "current":
      return Clock;
    default:
      return AlertTriangle;
  }
};

const getStepColor = (status: string) => {
  switch (status) {
    case "completed":
      return "text-green-600 bg-green-100";
    case "current":
      return "text-blue-600 bg-blue-100";
    default:
      return "text-gray-400 bg-gray-100";
  }
};

const statusColor: Record<string, string> = {
  confirmed: "bg-green-100 text-green-700",
  pending: "bg-yellow-100 text-yellow-700",
  completed: "bg-blue-100 text-blue-700",
  cancelled: "bg-red-100 text-red-700",
};

const getChecklistIcon = (item: string) => {
  const text = item.toLowerCase();
  if (text.includes("passport") || text.includes("id ")) return IdCard;
  if (text.includes("cas") || text.includes("admission") || text.includes("offer")) return FileCheck;
  if (text.includes("financial") || text.includes("bank") || text.includes("funds")) return Landmark;
  if (text.includes("fee") || text.includes("payment")) return Banknote;
  if (text.includes("insurance") || text.includes("health") || text.includes("ihs")) return Shield;
  if (text.includes("photo")) return ImageIcon;
  if (text.includes("accommodation") || text.includes("dorm") || text.includes("rental")) return MapPin;
  if (text.includes("application") || text.includes("form")) return FileEdit;
  return FileText;
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function Visa() {
  const { user } = useAuth();
  const { selectedCountry } = useOutletContext<ContextType>();

  // Process-timeline — computed after derived values are set (see below)

  // ── Meeting URL state ───────────────────────────────────────────
  const [meetingUrl, setMeetingUrl]     = useState<string>("https://meet.google.com/bqr-dcwn-wka");
  const [meetingLabel, setMeetingLabel] = useState<string>("Join Video Call Now");
  const [meetingActive, setMeetingActive] = useState<boolean>(true);

  // ── Checklist state ─────────────────────────────────────────────
  const [checklistItems, setChecklistItems] = useState<string[]>([]);
  const [checklistTitle, setChecklistTitle] = useState<string>("");
  const [checklistLoading, setChecklistLoading] = useState(false);

  // ── Tracker state ───────────────────────────────────────────────
  const [trackerId, setTrackerId] = useState<string | null>(null);
  const [completedItems, setCompletedItems] = useState<number[]>([]);
  const [trackerStatus, setTrackerStatus] = useState<string>("NOT_STARTED");
  const [totalItems, setTotalItems] = useState(0);
  const [progressPercent, setProgressPercent] = useState(0);
  const [trackerLoading, setTrackerLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // ── Appointments state ──────────────────────────────────────────
  const [appointments, setAppointments] = useState<ApiAppointment[]>([]);
  const [apptLoading, setApptLoading] = useState(false);

  // ── API availability flags (null = pending, false = 404, true = live) ──────
  const [checklistApiAvailable, setChecklistApiAvailable] = useState<boolean | null>(null);
  const [trackerApiAvailable, setTrackerApiAvailable]     = useState<boolean | null>(null);
  const [apptApiAvailable, setApptApiAvailable]           = useState<boolean | null>(null);

  // ── Popup ───────────────────────────────────────────────────────
  const [isDemandDraftPopupOpen, setIsDemandDraftPopupOpen] = useState(false);

  // ── Payment state (persisted across refreshes per country) ──────
  // Stores which countries the user has already paid: { DE: true, UK: false } etc.
  const [paidCountries, setPaidCountries] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem("visa_fee_paid_countries");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const hasPaidForCurrentCountry = !!paidCountries[selectedCountry];
  // Show Pay Now only if current country is NOT paid
  // AND the OTHER country has NOT already been paid (each payment is per-country)
  const shouldShowPayButton = !hasPaidForCurrentCountry;

  const markCountryAsPaid = (country: string) => {
    setPaidCountries((prev) => {
      const updated = { ...prev, [country]: true };
      try {
        localStorage.setItem("visa_fee_paid_countries", JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // ── Fetch helpers ───────────────────────────────────────────────

  // localStorage key per country for offline persistence
  const lsKey = `visa_tracker_${selectedCountry}`;

  // fetchTracker is the single source of truth:
  // it returns checklistItems + completedItems + progress all at once.
  // resetOnNull=true (default) → on null, loads from localStorage (initial load / country switch)
  // resetOnNull=false         → on null, keeps current state   (re-sync after PUT)
  const fetchTracker = useCallback(async (resetOnNull = true) => {
    setTrackerLoading(true);
    try {
      const res = await getVisaTracker(selectedCountry);
      if (res === null) {
        // API not live
        setTrackerApiAvailable(false);
        if (resetOnNull) {
          // Load from localStorage so checked items survive page refresh
          try {
            const saved = localStorage.getItem(lsKey);
            if (saved) {
              const parsed = JSON.parse(saved);
              setCompletedItems(parsed.completedItems ?? []);
              setTrackerStatus(parsed.status ?? "NOT_STARTED");
              setProgressPercent(parsed.progressPercent ?? 0);
            } else {
              setCompletedItems([]);
              setTrackerStatus("NOT_STARTED");
              setProgressPercent(0);
            }
          } catch {
            setCompletedItems([]);
            setTrackerStatus("NOT_STARTED");
            setProgressPercent(0);
          }
          setTrackerId(null);
          setTotalItems(0);
        }
        // resetOnNull=false → keep whatever the user toggled locally
        return;
      }
      const data = res?.data ?? res;
      setTrackerApiAvailable(true);
      setTrackerId(data?.trackerId ?? null);
      const serverCompleted = Array.isArray(data?.completedItems) ? data.completedItems : [];
// Only use server value if it has items OR localStorage has nothing saved
const lsSaved = localStorage.getItem(lsKey);
const localCompleted = lsSaved ? (JSON.parse(lsSaved).completedItems ?? []) : [];
setCompletedItems(serverCompleted.length > 0 ? serverCompleted : localCompleted);
      setTrackerStatus(data?.status ?? "NOT_STARTED");
      setTotalItems(data?.totalItems ?? 0);
      setProgressPercent(data?.progressPercent ?? 0);
      // Checklist items come from tracker (primary source)
      if (Array.isArray(data?.checklistItems)) {
        setChecklistItems(data.checklistItems);
      }
      // API is live — clear localStorage since server is now authoritative
      localStorage.removeItem(lsKey);
    } catch {
      setTrackerApiAvailable(false);
      // On error, also fall back to localStorage
      try {
        const saved = localStorage.getItem(lsKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          setCompletedItems(parsed.completedItems ?? []);
          setTrackerStatus(parsed.status ?? "NOT_STARTED");
          setProgressPercent(parsed.progressPercent ?? 0);
        } else {
          setCompletedItems([]);
          setTrackerStatus("NOT_STARTED");
          setProgressPercent(0);
        }
      } catch {
        setCompletedItems([]);
        setTrackerStatus("NOT_STARTED");
        setProgressPercent(0);
      }
      setTrackerId(null);
      setTotalItems(0);
    } finally {
      setTrackerLoading(false);
    }
  }, [selectedCountry, lsKey]);

  // fetchChecklist runs in parallel — provides title + overrides items if checklist API has extra data
  const fetchChecklist = useCallback(async () => {
    setChecklistLoading(true);
    try {
      const res = await getVisaChecklist(selectedCountry);
      if (res === null) {
        setChecklistApiAvailable(false);
        return; // items already set (or not) by tracker
      }
      const data = res?.data ?? res;
      setChecklistApiAvailable(true);
      // Title
      if (data?.title) setChecklistTitle(data.title);
      // Override items with checklist API if it returns them
      if (data?.items) {
        const items: string[] =
          typeof data.items === "string" ? JSON.parse(data.items) : data.items;
        if (items.length > 0) setChecklistItems(items);
      }
    } catch {
      setChecklistApiAvailable(false);
    } finally {
      setChecklistLoading(false);
    }
  }, [selectedCountry]);

  const fetchAppointments = useCallback(async () => {
    setApptLoading(true);
    try {
      const res = await getVisaAppointments();
      if (res === null) {
        setApptApiAvailable(false);
        setAppointments([]);
        return;
      }
      const data = res?.data ?? res;
      setApptApiAvailable(true);
      setAppointments(Array.isArray(data) ? data : []);
    } catch {
      setApptApiAvailable(false);
      setAppointments([]);
    } finally {
      setApptLoading(false);
    }
  }, []);

  const fetchMeetingUrl = useCallback(async () => {
    try {
      const res = await getMeetingUrl("VISA");
      if (res === null) return; // API not live — keep fallback
      const data = res?.data ?? res;
      if (data?.url)     setMeetingUrl(data.url);
      if (data?.label)   setMeetingLabel(data.label);
      if (data?.isActive !== undefined) setMeetingActive(Boolean(data.isActive));
    } catch {
      // keep fallback values on error
    }
  }, []);

  // Re-fetch when country changes — reset all state first so no stale data flashes
  useEffect(() => {
    // Clear previous country's data
    setChecklistItems([]);
    setChecklistTitle("");
    setCompletedItems([]);
    setTrackerStatus("NOT_STARTED");
    setTotalItems(0);
    setProgressPercent(0);
    setTrackerId(null);
    setAppointments([]);
    setChecklistApiAvailable(null);
    setTrackerApiAvailable(null);
    setApptApiAvailable(null);

    fetchTracker();    // tracker first — it populates checklistItems + progress
    fetchChecklist();  // provides title override if checklist API is live
    fetchAppointments();
    fetchMeetingUrl(); // load meeting link for the help card
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCountry]);

  // ── Toggle item & auto-save ─────────────────────────────────────

  const toggleItem = async (index: number) => {
    const isChecked = completedItems.includes(index);
    const newCompleted = isChecked
      ? completedItems.filter((i) => i !== index)
      : [...completedItems, index];

    const newTotal = checklistItems.length || totalItems;
    const newPercent = newTotal > 0 ? Math.round((newCompleted.length / newTotal) * 100) : 0;
    const newStatus =
      newCompleted.length === 0
        ? "NOT_STARTED"
        : newCompleted.length >= newTotal
        ? "COMPLETED"
        : "IN_PROGRESS";

    // Optimistic update
    setCompletedItems(newCompleted);
    setProgressPercent(newPercent);
    setTrackerStatus(newStatus);

    setSaving(true);
    try {
      const saveResult = await updateVisaTracker({
        country: selectedCountry,
        completed_items: newCompleted,
        status: newStatus,
        notes: "",
      });
      if (saveResult !== null) {
  // API is live — keep optimistic state, just clear localStorage
  // Don't re-fetch as the server may not return completedItems correctly
  localStorage.removeItem(lsKey);
  localStorage.setItem(lsKey, JSON.stringify({
    completedItems: newCompleted,
    status: newStatus,
    progressPercent: newPercent,
  }));
} else {
        // API offline — persist to localStorage so state survives page refresh
        localStorage.setItem(lsKey, JSON.stringify({
          completedItems: newCompleted,
          status: newStatus,
          progressPercent: newPercent,
        }));
      }
    } catch {
      // Real network/server error — revert optimistic update
      setCompletedItems(completedItems);
      setProgressPercent(progressPercent);
      setTrackerStatus(trackerStatus);
    } finally {
      setSaving(false);
    }
  };

  // ── Animation variants ──────────────────────────────────────────

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } },
  };

  const itemVariant = { hidden: { x: -20, opacity: 0 }, show: { x: 0, opacity: 1 } };

  // ── Handlers ────────────────────────────────────────────────────

  const handleGoogleMeetClick = () => {
    window.open(meetingUrl, "_blank", "noopener,noreferrer");
  };

  const handleDemandDraftDownload = () => {
    const link = document.createElement("a");
    link.href = "/files/dd-mumbai-data.pdf";
    link.download = "demand-draft-form.pdf";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Derived display values — all from API state
  const displayItems = checklistItems;                          // purely from API
  const displayTotal = totalItems || checklistItems.length;     // tracker.totalItems wins
  const displayCompleted = completedItems.length;
  const displayPercent =
    displayTotal > 0
      ? Math.round((displayCompleted / displayTotal) * 100)
      : progressPercent; // use server value if local total unknown

  const apiLoading = trackerLoading || checklistLoading;
  const apiAvailable = trackerApiAvailable === true || checklistApiAvailable === true;

  // ── displaySteps: driven by checklist when API is live, else static ────────
  // Status logic: completed → completed | first pending → current | rest → pending
  const firstPendingIdx = checklistItems.length > 0
    ? checklistItems.findIndex((_, idx) => !completedItems.includes(idx))
    : -1;

  const displaySteps: VisaStep[] = checklistItems.length > 0
    ? checklistItems.map((item, idx) => {
        const isCompleted = completedItems.includes(idx);
        const isCurrent   = !isCompleted && idx === firstPendingIdx;
        const status      = isCompleted ? "completed" : isCurrent ? "current" : "pending";
        return {
          id: idx,
          title: item,
          description: isCompleted
            ? "This step has been completed."
            : isCurrent
            ? "This is your current step. Mark it complete in the checklist above."
            : "This step is pending completion of previous steps.",
          status,
          documents: [],
          timeline: isCompleted ? "Completed" : isCurrent ? "In Progress" : "Pending",
        };
      })
    : visaProcessSteps[selectedCountry]; // fallback to static when API offline

  // ── Render ───────────────────────────────────────────────────────

  return (
    <motion.div
      className="space-y-6 sm:space-y-8 px-4 sm:px-0"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* Header */}
      <motion.div
        className="text-center sm:text-left"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-4">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Visa Process</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Track your student visa application for{" "}
            {selectedCountry === "DE" ? "Germany" : "United Kingdom"}
          </p>
        </div>
      </motion.div>

      {/* ── VISA DOCUMENT CHECKLIST CARD ─────────────────────────────── */}
      <motion.section
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.03 }}
        className="space-y-4"
      >
        <h2 className="text-xl sm:text-2xl font-semibold">
          Visa Prep Checklist –{" "}
          {selectedCountry === "DE" ? "Germany Student Visa" : "UK Student Visa"}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {visaDocumentChecklist[selectedCountry].map((section) => (
            <Card key={section.category} className="p-4 sm:p-5 bg-white/70 backdrop-blur-sm border-2 border-[#C4DFF0]/50 shadow-sm hover:shadow-[0_20px_50px_-12px_rgba(224,141,60,0.2)] hover:border-[#E08D3C]/50 transition-all duration-500" style={{ background: "linear-gradient(160deg, #f0f7fd 0%, #ffffff 60%, #e6f3fb 100%)" }}>
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-4 h-4 text-primary flex-shrink-0" />
                <h3 className="font-semibold text-sm sm:text-base">{section.category}</h3>
              </div>
              <ul className="space-y-2">
                {section.items.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground leading-snug">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </motion.section>

      {/* ── CHECKLIST & PROGRESS TRACKER ─────────────────────────────── */}
      <motion.section
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.05 }}
        className="space-y-4"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl font-semibold">
            {checklistTitle || `${selectedCountry === "UK" ? "UK" : "Germany"} Student Visa Checklist`}
          </h2>
          <div className="flex items-center gap-2">
            {saving && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Loader2 className="w-3 h-3 animate-spin" /> Saving…
              </span>
            )}
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0"
              onClick={() => { fetchChecklist(); fetchTracker(); }}
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Progress bar */}
        {apiLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground text-sm py-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading checklist from server…
          </div>
        ) : !apiAvailable ? (
          /* Both APIs returned 404 — backend not live yet */
          <Card className="p-5 border-2 border-dashed border-gray-200/80 bg-white/40 backdrop-blur-sm text-center">
            <p className="text-sm text-muted-foreground">
              Checklist data is not available yet. It will appear here once your advisor configures it.
            </p>
          </Card>
        ) : (
          <>
            {/* Summary bar */}
            <Card className="p-4 sm:p-5 bg-white/70 backdrop-blur-sm border-2 border-amber-200/50 shadow-sm hover:shadow-[0_20px_50px_-12px_rgba(224,141,60,0.2)] hover:border-[#E08D3C]/50 transition-all duration-500" style={{ background: "linear-gradient(160deg, #fffcf0 0%, #ffffff 60%, #fff8e6 100%)" }}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">Overall Progress</span>
                  <Badge
                    variant="outline"
                    className={cn(
                      "rounded-full text-xs capitalize",
                      trackerStatus === "COMPLETED"
                        ? "border-green-400 text-green-700 bg-green-50"
                        : trackerStatus === "IN_PROGRESS"
                        ? "border-blue-400 text-blue-700 bg-blue-50"
                        : "border-gray-300 text-gray-500"
                    )}
                  >
                    {trackerStatus.replace(/_/g, " ")}
                  </Badge>
                </div>
                <span className="text-sm font-semibold text-primary">
                  {displayCompleted} / {displayTotal} completed
                </span>
              </div>

              {/* Bar */}
              <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                <motion.div
                  className="h-2.5 rounded-full bg-primary"
                  initial={{ width: 0 }}
                  animate={{ width: `${displayPercent}%` }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                />
              </div>
              <p className="text-right text-xs text-muted-foreground mt-1">{displayPercent}%</p>
            </Card>

            {/* Checklist items — 3-column responsive grid */}
            {displayItems.length > 0 ? (
              <motion.div
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
                variants={container}
                initial="hidden"
                animate="show"
              >
                {displayItems.map((item, idx) => {
                  const checked = completedItems.includes(idx);
                  return (
                    <motion.div key={idx} variants={itemVariant}>
                      <Card
                        className={cn(
                          "p-3 sm:p-4 flex items-start gap-3 cursor-pointer transition-all duration-500 h-full bg-white/70 backdrop-blur-sm border-2 border-gray-200/80 shadow-sm hover:shadow-[0_20px_50px_-12px_rgba(224,141,60,0.2)] hover:border-[#E08D3C]/50",
                          checked && "bg-green-50/70 border-green-300/50 shadow-[0_10px_30px_-10px_rgba(34,197,94,0.2)]"
                        )}
                        onClick={() => toggleItem(idx)}
                      >
                        {checked ? (
                          <CheckSquare className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        ) : (
                          <Square className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1 min-w-0 flex items-center gap-2">
                          {(() => {
                            const ItemIcon = getChecklistIcon(item);
                            return <ItemIcon className={cn("w-4 h-4 flex-shrink-0", checked ? "text-green-500" : "text-primary/70")} />;
                          })()}
                          <span
                            className={cn(
                              "text-sm leading-snug block",
                              checked && "line-through text-muted-foreground"
                            )}
                          >
                            {item}
                          </span>
                          {checked && (
                            <Badge className="mt-1.5 rounded-full text-xs bg-green-100 text-green-700 border-0">
                              Done
                            </Badge>
                          )}
                        </div>
                      </Card>
                    </motion.div>
                  );
                })}
              </motion.div>
            ) : (
              !apiLoading && (
                <p className="text-sm text-muted-foreground italic">
                  No checklist items returned by the server yet.
                </p>
              )
            )}
          </>
        )}
      </motion.section>

      {/* ── PROCESS TIMELINE ─────────────────────────────────────────────── */}
      <motion.section
        className="space-y-4 sm:space-y-6"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div className="flex items-center gap-3">
          <h2 className="text-xl sm:text-2xl font-semibold">Visa Process Steps</h2>
          {checklistItems.length > 0 && (
            <Badge variant="outline" className="rounded-full text-xs">
              {completedItems.length}/{checklistItems.length} done
            </Badge>
          )}
        </div>

        <motion.div
          className="space-y-3 sm:space-y-4"
          variants={container}
          initial="hidden"
          animate="show"
        >
          {displaySteps.map((step, index) => {
            const StepIcon = getStepIcon(step.title, step.status);
            const isLast = index === displaySteps.length - 1;

            return (
              <motion.div key={step.id} variants={itemVariant} className="relative">
                <Card
                  className={cn(
                    "p-4 sm:p-6 transition-all duration-500 bg-white/70 backdrop-blur-sm border-2",
                    step.status === "current"
                      ? "border-[#E08D3C] shadow-[0_20px_50px_-12px_rgba(224,141,60,0.3)]"
                      : "border-gray-200/80 hover:border-[#E08D3C]/50 hover:shadow-[0_20px_50px_-12px_rgba(224,141,60,0.2)]"
                  )}
                >
                  <div className="flex items-start gap-3 sm:gap-4">
                    {/* Icon */}
                    <div
                      className={cn(
                        "w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0",
                        getStepColor(step.status)
                      )}
                    >
                      <StepIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col gap-2 mb-3">
                        <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2">
                          <h3 className="font-semibold text-base sm:text-lg pr-2">{step.title}</h3>
                          <Badge
                            variant={step.status === "completed" ? "default" : "outline"}
                            className="rounded-full text-xs w-fit"
                          >
                            {step.timeline}
                          </Badge>
                        </div>
                      </div>

                      <p className="text-sm sm:text-base text-muted-foreground mb-4 leading-relaxed">
                        {step.description}
                      </p>

                      {step.documents.length > 0 && (
                        <div className="space-y-2 mb-4">
                          <span className="text-xs sm:text-sm font-medium">Required Documents:</span>
                          <div className="flex flex-wrap gap-1 sm:gap-2">
                            {step.documents.map((doc) => (
                              <Badge key={doc} variant="outline" className="text-xs flex items-center gap-1">
                                <FileText className="w-3 h-3" />
                                <span className="hidden xs:inline">{doc}</span>
                                <span className="xs:hidden">{doc.split(" ")[0]}</span>
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {step.notes && step.notes.length > 0 && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 mb-4">
                          <div className="flex items-start gap-2 mb-2">
                            <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                            <span className="text-xs sm:text-sm font-medium text-blue-800">
                              Important Notes:
                            </span>
                          </div>
                          <ul className="space-y-1 ml-6">
                            {step.notes.map((note, noteIndex) => (
                              <li key={noteIndex} className="text-xs sm:text-sm text-blue-700 leading-relaxed">
                                • {note}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {step.appointmentDetails && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4 mb-4">
                          <div className="flex items-start gap-2 mb-2">
                            <Calendar className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <span className="text-xs sm:text-sm font-medium text-green-800">
                              Appointment Scheduled:
                            </span>
                          </div>
                          <div className="ml-6 space-y-1">
                            <p className="text-xs sm:text-sm text-green-700">
                              <strong>Date:</strong> {step.appointmentDetails.date} at{" "}
                              {step.appointmentDetails.time}
                            </p>
                            <p className="text-xs sm:text-sm text-green-700">
                              <strong>Location:</strong> {step.appointmentDetails.location}
                            </p>
                          </div>
                        </div>
                      )}

                      {step.status === "current" && (
  <div className="flex justify-end gap-2 mt-2">
    <label className="cursor-pointer">
      <input
        type="file"
        className="hidden"
        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          // TODO: wire to your upload API here
          console.log("Uploading file:", file.name, "for step:", step.title);
          alert(`"${file.name}" selected for "${step.title}". Wire to your upload API.`);
          e.target.value = "";
        }}
      />
      
    </label>
  </div>
)}
                    </div>
                  </div>
                </Card>

                {!isLast && (
                  <div
                    className={cn(
                      "absolute left-6 sm:left-9 top-16 sm:top-20 w-0.5 h-4 sm:h-6 transition-colors",
                      step.status === "completed" ? "bg-green-200" : "bg-gray-200"
                    )}
                  />
                )}
              </motion.div>
            );
          })}
        </motion.div>
      </motion.section>

      {/* ── APPOINTMENTS (from API) ───────────────────────────────────── */}
      <motion.section
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="space-y-4"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl font-semibold">Embassy Appointments</h2>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0"
            onClick={fetchAppointments}
            title="Refresh appointments"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>

        {apptLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading appointments…
          </div>
        ) : apptApiAvailable === false ? (
          <Card className="p-4 text-sm text-muted-foreground italic border-2 border-dashed border-gray-200/80 bg-white/40 backdrop-blur-sm text-center">
            Appointment data is not available yet from the server.
          </Card>
        ) : appointments.filter((appt) => { const r = (appt.country ?? '').toUpperCase().trim(); const n = r === 'GERMANY' ? 'DE' : r === 'UNITED KINGDOM' ? 'UK' : r; return n === selectedCountry; }).length === 0 ? (
          <Card className="p-4 text-sm text-muted-foreground italic border-2 border-dashed border-gray-200/80 bg-white/40 backdrop-blur-sm">
            No embassy appointments scheduled for {selectedCountry === 'DE' ? 'Germany' : 'United Kingdom'} yet.
          </Card>
        ) : (
          <motion.div className="space-y-3" variants={container} initial="hidden" animate="show">
            {appointments.filter((appt) => { const r = (appt.country ?? '').toUpperCase().trim(); const n = r === 'GERMANY' ? 'DE' : r === 'UNITED KINGDOM' ? 'UK' : r; return n === selectedCountry; }).map((appt) => {
  const apptType     = appt.type ?? appt.appointmentType ?? "Appointment";
  const apptDate     = appt.date ?? appt.scheduledDate ?? (appt as any).appointmentDate ?? (appt as any).scheduled_date ?? "—";
  const apptTime     = appt.time ?? appt.scheduledTime ?? (appt as any).appointmentTime ?? (appt as any).scheduled_time ?? "";
  const apptLocation = appt.location ?? appt.venue ?? appt.address ?? "—";
  const apptStatus   = (appt.status ?? "pending").toLowerCase();
  const apptCountry  = appt.country ?? "";
  
  const apptEmbassy  = appt.embassy ?? "";
  const apptCategory = appt.visaCategory ?? "";
  const apptInstr    = appt.instructions ?? "";
  const apptPhone    = appt.contactPhone ?? "";
  const apptEmail    = appt.contactEmail ?? "";

  return (
    <motion.div key={appt.id} variants={itemVariant}>
      <Card className="p-4 sm:p-5 bg-white/70 backdrop-blur-sm border-2 border-green-200/50 shadow-sm hover:shadow-[0_20px_50px_-12px_rgba(224,141,60,0.2)] hover:border-[#E08D3C]/50 transition-all duration-500" style={{ background: "linear-gradient(160deg, #f0fdf4 0%, #ffffff 60%, #e6fcf5 100%)" }}>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">

          {/* Left side */}
          <div className="flex items-start gap-3 flex-1">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Calendar className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 space-y-1">

              {/* Title row */}
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-semibold text-sm sm:text-base">{apptType}</h4>
                {apptCountry && (
                  <Badge variant="outline" className="text-xs rounded-full">{apptCountry}</Badge>
                )}
                {apptCategory && (
                  <Badge variant="outline" className="text-xs rounded-full">{apptCategory}</Badge>
                )}
              </div>

              {/* Date & time */}
              {/* Date & time */}
              <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-primary" />
                  <strong className="text-foreground">{apptDate}</strong>
                </span>
                {apptTime && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-primary" />
                    <strong className="text-foreground">{apptTime}</strong>
                  </span>
                )}
              </div>

              {/* Location */}
              <div className="flex items-start gap-1 text-xs text-muted-foreground">
                <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" />
                <span>{apptLocation}</span>
              </div>

              {/* Embassy */}
              {apptEmbassy && (
                <p className="text-xs text-muted-foreground">
                  <strong>Embassy:</strong> {apptEmbassy}
                </p>
              )}

              

              {/* Contact details */}
              {(apptPhone || apptEmail) && (
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  {apptPhone && (
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3" />{apptPhone}
                    </span>
                  )}
                  {apptEmail && <span>{apptEmail}</span>}
                </div>
              )}

              {/* Notes */}
              {appt.notes && (
                <p className="text-xs text-muted-foreground italic">{appt.notes}</p>
              )}

              {/* Instructions */}
              {apptInstr && (
                <div className="mt-2 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 text-xs text-blue-800">
                  <Info className="w-3 h-3 inline mr-1" />
                  {apptInstr}
                </div>
              )}

            </div>
          </div>

          {/* Status badge + meeting link stacked on the right */}
          <div className="flex flex-col items-end gap-2 self-start">
            <Badge
              className={cn(
                "rounded-full text-xs capitalize w-fit",
                statusColor[apptStatus] ?? "bg-gray-100 text-gray-600"
              )}
            >
              {apptStatus}
            </Badge>
            {meetingActive && (
              <Button
                size="sm"
                className="bg-green-500 hover:bg-green-600 text-white rounded-full text-xs"
                onClick={handleGoogleMeetClick}
              >
                <Phone className="w-3 h-3 mr-1.5" />
                {meetingLabel}
              </Button>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
})}
          </motion.div>
        )}
      </motion.section>

      {/* ── VISA APPOINTMENT FEE (DE + UK) ──────────────────────────── */}
      {(selectedCountry === "DE" || selectedCountry === "UK") && (
        <motion.section
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.25 }}
        >
          <Card className="p-6 border-2 border-orange-300 bg-white/70 backdrop-blur-sm shadow-sm hover:shadow-[0_20px_50px_-12px_rgba(249,115,22,0.2)] hover:border-[#E08D3C]/50 transition-all duration-500" style={{ background: "linear-gradient(160deg, #fff7ed 0%, #ffffff 60%, #ffedd5 100%)" }}>
            <div className="flex flex-col gap-6">
              <div>
                <h3 className="font-semibold text-lg mb-2">
                  Visa Processing Fee
                </h3>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Due: 2024-04-20
                  </div>
                  <div className="text-xl font-bold text-primary">
                    {selectedCountry === "UK" ? "£490" : "€75"}
                  </div>
                </div>
              </div>

              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg shadow-sm">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 mt-1 flex-shrink-0" />
                  <div className="text-sm text-amber-900 leading-relaxed space-y-3 w-full">
                    {selectedCountry === "UK" ? (
                      <>
                        <p>
                          <strong className="text-amber-950 text-base block mb-2">Important Notice Regarding Visa Payments</strong>
                        </p>
                        <ul className="list-disc pl-5 space-y-2">
                          <li><strong>Platform Payment:</strong> The payment you are completing on this portal is strictly for our dedicated <strong>Visa Processing and Consultancy Services</strong>.</li>
                          <li><strong>Official Application Fee:</strong> You are required to pay the official UK Visa Application Fee (approximately <strong>£490</strong>) directly at the designated Visa Application Office on the day of your appointment.</li>
                          <li><strong>Payment Methods:</strong> The Visa Office accepts secure payments via Bank Transfer, UPI, and other standard digital payment methods.</li>
                          <li><strong>Health Surcharge:</strong> Please remember that the Immigration Health Surcharge (IHS) must also be paid separately prior to your final application submission.</li>
                        </ul>
                      </>
                    ) : (
                      <>
                        <p>
                          <strong className="text-amber-950 text-base block mb-2">Important Notice Regarding Visa Payments</strong>
                        </p>
                        <ul className="list-disc pl-5 space-y-2">
                          <li><strong>Platform Payment:</strong> The payment you are completing on this portal is strictly for our dedicated <strong>Visa Processing and Consultancy Services</strong>.</li>
                          <li><strong>Official Application Fee:</strong> You are required to pay the official German Embassy Visa Application Fee (currently <strong>€75</strong>) directly at the VFS Global center on the day of your appointment.</li>
                          <li><strong>Payment Methods:</strong> The VFS Global office accepts secure payments via Bank Transfer, UPI, Demand Draft, and other standard digital payment methods.</li>
                        </ul>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 border-t border-orange-200/50 pt-4 mt-2">
                {hasPaidForCurrentCountry ? (
                  <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-50 border border-green-200 text-green-700 text-sm font-medium">
                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                    Payment done for {selectedCountry === "UK" ? "UK" : "Germany"}
                  </div>
                ) : (
                <RazorpayButton
                  amount={100}
                  label="Pay ₹1 Now"
                  description={selectedCountry === "UK" ? "UK Visa Application Fee" : "Visa Appointment Fee"}
                  notes={{ purpose: selectedCountry === "UK" ? "UK Visa Application Fee" : "Visa Appointment Fee", section: "VISA" }}
                  receipt={`visa_fee_${selectedCountry}_${Date.now()}`}
                  paymentType="APPOINTMENT_FEE"
                  className="rounded-pill"
                  onSuccess={async (paymentData) => {
  console.log('[Visa] Payment verified:', paymentData);
  markCountryAsPaid(selectedCountry);

  // ── Generate & auto-download PDF receipt ──────────────────────
  const receiptLines = [
    "========================================",
    "         PAYMENT RECEIPT",
    "========================================",
    `Date       : ${new Date().toLocaleString()}`,
    `Country    : ${selectedCountry === "UK" ? "United Kingdom" : "Germany"}`,
    `Purpose    : ${selectedCountry === "UK" ? "UK Visa Application Fee" : "Visa Appointment Fee"}`,
    `Amount     : ${selectedCountry === "UK" ? "£490" : "€80"}`,
    `Transaction ID : ${paymentData?.paymentId ?? paymentData?.razorpay_payment_id ?? "N/A"}`,
    `Payment ID : ${paymentData?.paymentId ?? paymentData?.razorpay_payment_id ?? "N/A"}`,
    `Order ID   : ${paymentData?.orderId ?? paymentData?.razorpay_order_id ?? "N/A"}`,
    `Status     : Verified ✓`,
    "========================================",
    "   Keep this receipt for your records.",
    "========================================",
  ].join("\n");

 // ── Fetch full payment details from Razorpay via your backend ──
let paymentDetails: any = {};
try {
  const res = await fetch(
    `https://backend.uni360degree.com/api/v1/payment/details/${paymentData?.razorpay_payment_id}`,
    { headers: { "Content-Type": "application/json" } }
  );
  const json = await res.json();
  paymentDetails = json?.data ?? {};
} catch {
  // fallback to what Razorpay returned directly
  paymentDetails = paymentData ?? {};
}

const doc = new jsPDF();
const pageW = 210;

// ── Logo ───────────────────────────────────────────────────────
const logo = new Image();
logo.src = "/assets/Uni360-logo.png";
await new Promise((res) => { logo.onload = res; logo.onerror = res; });
try { doc.addImage(logo, "PNG", 14, 10, 28, 14); } catch {}

// ── Company name & contact (top right) ────────────────────────
doc.setFontSize(9);
doc.setFont("helvetica", "normal");
doc.setTextColor(100, 100, 100);
doc.text("Uni360", pageW - 14, 14, { align: "right" });
doc.text("support@uni360degree.com", pageW - 14, 19, { align: "right" });
doc.text("https://uni360degree.com", pageW - 14, 24, { align: "right" });

// ── Divider ────────────────────────────────────────────────────
doc.setDrawColor(220, 220, 220);
doc.line(14, 30, pageW - 14, 30);

// ── Title ──────────────────────────────────────────────────────
doc.setFontSize(18);
doc.setFont("helvetica", "bold");
doc.setTextColor(30, 30, 30);
doc.text("Payment Receipt", pageW / 2, 46, { align: "center" });

// ── Receipt No & Date ──────────────────────────────────────────
doc.setFontSize(10);
doc.setFont("helvetica", "normal");
doc.setTextColor(60, 60, 60);
doc.text(`Receipt No: `, 14, 58);
doc.setFont("helvetica", "bold");
doc.text(paymentData?.paymentId ?? paymentData?.razorpay_payment_id ?? "N/A", 38, 58);

doc.setFont("helvetica", "normal");
doc.text(`Date: `, 14, 65);
doc.setFont("helvetica", "bold");
doc.text(new Date().toLocaleString(), 26, 65);

// ── Divider ────────────────────────────────────────────────────
doc.setDrawColor(220, 220, 220);
doc.line(14, 71, pageW - 14, 71);

// ── Table header ───────────────────────────────────────────────
doc.setFillColor(240, 240, 245);
doc.rect(14, 75, 182, 10, "F");
doc.setFontSize(10);
doc.setFont("helvetica", "bold");
doc.setTextColor(100, 100, 100);
doc.text("Details", 60, 82, { align: "center" });
doc.text("Information", 150, 82, { align: "center" });

// ── Table rows ─────────────────────────────────────────────────
const rows: [string, string][] = [
  ["Received From",              (user?.name || user?.fullName || user?.firstName || paymentDetails?.name) ?? paymentDetails?.email ?? paymentDetails?.contact ?? "Student"],
  ["Amount Paid",                `₹${((paymentDetails?.amount ?? paymentData?.amount ?? 100) / 100).toFixed(2)}`],
  ["Payment Method",             paymentDetails?.method ?? "Online (Razorpay)"],
  ["Transaction ID",             paymentData?.paymentId ?? paymentData?.razorpay_payment_id ?? "N/A"],
  ["Payment ID",                 paymentData?.paymentId ?? paymentData?.razorpay_payment_id ?? "N/A"],
  ["Order ID",                   paymentData?.orderId ?? paymentData?.razorpay_order_id ?? "N/A"],
  ["Description of Services",    selectedCountry === "UK" ? "UK Visa Application Fee" : "Visa Appointment Fee"],
  ["Status",                     "Verified ✓"],
];

let y = 92;
rows.forEach(([label, value], i) => {
  if (i % 2 === 0) {
    doc.setFillColor(250, 250, 255);
    doc.rect(14, y - 5, 182, 10, "F");
  }
  doc.setDrawColor(230, 230, 230);
  doc.rect(14, y - 5, 182, 10);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80, 80, 80);
  doc.text(label, 18, y);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(label === "Status" ? 22 : 30, label === "Status" ? 163 : 30, label === "Status" ? 74 : 30);
  doc.text(value, 100, y);
  y += 10;
});

// ── Divider ────────────────────────────────────────────────────
doc.setDrawColor(220, 220, 220);
doc.line(14, y + 4, pageW - 14, y + 4);

// ── Issued by & thank you ──────────────────────────────────────
doc.setFontSize(10);
doc.setFont("helvetica", "normal");
doc.setTextColor(60, 60, 60);
doc.text("Issued by: ", 14, y + 14);
doc.setFont("helvetica", "bold");
doc.text("Uni360", 36, y + 14);

doc.setFont("helvetica", "italic");
doc.setTextColor(120, 120, 120);
doc.text("Thank you for your payment!", 14, y + 22);

// ── Save ───────────────────────────────────────────────────────
doc.save(`visa_payment_receipt_${selectedCountry}_${paymentData?.paymentId ?? paymentData?.razorpay_payment_id ?? Date.now()}.pdf`);
  // ── Then open the portal ───────────────────────────────────────
  window.open(
    selectedCountry === "UK"
      ? "https://apply.visas4uk.com/apply-uk-visa/"
      : "https://india.diplo.de/in-en/ueber-uns/mumbai",
    "_blank"
  );
}}
                  onFailure={(err) => console.error('[Visa] Payment failed:', err)}
                />
                )}
                {selectedCountry === "DE" && (
                  <Button
                    variant="outline"
                    className="rounded-pill"
                    onClick={handleDemandDraftDownload}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Demand Draft Form
                  </Button>
                )}
                {selectedCountry === "UK" && (
                  <Button
                    variant="outline"
                    className="rounded-pill"
                    onClick={() => window.open("https://www.gov.uk/healthcare-immigration-application", "_blank")}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Pay IHS Separately
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </motion.section>
      )}

      {/* ── HELP CARD (dynamic meeting URL) ───────────────────────────── */}
      <motion.section
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.35 }}
      >
      </motion.section>
    </motion.div>
  );
}