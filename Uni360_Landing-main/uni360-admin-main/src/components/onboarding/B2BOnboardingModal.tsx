import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  CheckCircle, 
  Lock, 
  User, 
  Phone, 
  Building, 
  MapPin, 
  Globe,
  Shield,
  Award
} from "lucide-react";
import { useToast } from "../../hooks/use-toast";

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

const getAuthToken = () => {
  try {
    return localStorage.getItem("uni_access_token");
  } catch {
    return null;
  }
};

const registerAdmin = async (data: any) => {
  const token = getAuthToken();
  const headers: any = {
    "Content-Type": "application/json",
    "X-Client-ID": "uniflow",
  };
  
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  console.log("🚀 API Request:", {
    url: `${API_BASE_URL}/api/v1/auth/register/admin`,
    headers,
    payload: data
  });

  const response = await fetch(`${API_BASE_URL}/api/v1/auth/register/admin`, {
    method: "POST",
    headers,
    body: JSON.stringify(data),
  });

  const result = await response.json();

  console.log("📥 API Response:", { status: response.status, result });

  if (!response.ok) {
    throw new Error(result.message || "Registration failed");
  }

  return result;
};

type Props = {
  open: boolean;
  onClose: () => void;
};

const roles = ["COUNSELOR", "ADMIN", "MANAGER"];
const specializations = [
  { value: "BACHELOR", label: "Bachelor" },
  { value: "MASTERS", label: "Masters" },
  { value: "GENERAL", label: "General" },
  { value: "PHD", label: "PhD" },
  { value: "DIPLOMA", label: "Diploma" }
];

const countries = [
  { code: "DE", name: "Germany" },
  { code: "UK", name: "United Kingdom" },
  { code: "US", name: "United States" },
  { code: "CA", name: "Canada" },
  { code: "AU", name: "Australia" },
  { code: "FR", name: "France" },
  { code: "IT", name: "Italy" },
  { code: "ES", name: "Spain" }
];

const SuccessModal: React.FC<{ 
  open: boolean; 
  data: any;
}> = ({ open, data }) => {
  const navigate = useNavigate();
  
  useEffect(() => {
  if (open) {
    const timer = setTimeout(() => {
      navigate("/login", { replace: true });
    }, 5000);
    return () => clearTimeout(timer);
  }
}, [open, navigate]);

  const handleGoToLogin = () => {
  // Always navigate to /login regardless of what the API returns
  // since that's the only login route defined in your React Router
  navigate("/login", { replace: true });

  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-md" />
          <motion.div
            initial={{ y: 24, scale: 0.98, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 24, scale: 0.98, opacity: 0 }}
            className="relative w-full max-w-lg rounded-2xl border border-border bg-white/90 backdrop-blur-xl shadow-2xl"
          >
            <div className="p-8 text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              
              <h2 className="text-2xl font-semibold mb-3">{data?.message || "Registration Successful!"}</h2>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
                <h3 className="font-medium text-blue-900 mb-2">Next Steps:</h3>
                <p className="text-sm text-blue-700 mb-3">{data?.data?.nextSteps}</p>
                <p className="text-sm text-blue-700 italic">{data?.data?.welcomeMessage}</p>
              </div>

              {data?.data?.requiresEmailVerification && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                  <p className="text-sm text-amber-700">
                    📧 <strong>Email Verification Required</strong><br />
                    Please check your email and verify your account before logging in.
                  </p>
                </div>
              )}

              <div className="space-y-3 mb-6 text-left">
                <div className="flex items-center gap-2 text-sm">
                  <User className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600">Username:</span>
                  <span className="font-medium">{data?.data?.username}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Shield className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600">User Type:</span>
                  <span className="font-medium">{data?.data?.userType}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600">Status:</span>
                  <span className="font-medium text-amber-600">{data?.data?.status}</span>
                </div>
              </div>

              {data?.data?.loginUrl && (
                <p className="text-sm text-gray-500 mb-4">
                  Redirecting to login in 5 seconds...
                </p>
              )}

              <button
                onClick={handleGoToLogin}
                className="w-full rounded-lg bg-gradient-to-r from-[#E08D3C] to-[#9DB4C0] text-white py-3 font-medium hover:shadow-lg transition-all"
              >
                Go to Login
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export const B2BOnboardingModal: React.FC<Props> = ({ open, onClose }) => {
  const location = useLocation();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Get username and email from navigation state
  const initialUsername = location.state?.username || "";
  const initialEmail = location.state?.email || "";

  // Debug log
  useEffect(() => {
    console.log("📧 Received state:", { initialUsername, initialEmail });
  }, [initialUsername, initialEmail]);

  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    phoneNumber: "",
    employeeId: "",
    role: "COUNSELOR" as string,
    specialization: [] as string[],
    specializationCountries: [] as string[],
    privacyPolicyAccepted: false,
    termsOfServiceAccepted: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [successData, setSuccessData] = useState<any>(null);

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError("");
  };

  const toggleArrayValue = (field: 'specialization' | 'specializationCountries', value: string) => {
    setFormData(prev => {
      const currentArray = prev[field];
      const newArray = currentArray.includes(value)
        ? currentArray.filter(item => item !== value)
        : [...currentArray, value];
      return { ...prev, [field]: newArray };
    });
    setError("");
  };

  const validateForm = () => {
    if (!initialUsername || !initialEmail) {
      setError("Username and email are required from previous step");
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return false;
    }
    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long");
      return false;
    }
    if (formData.specialization.length === 0) {
      setError("Please select at least one specialization");
      return false;
    }
    if (formData.specializationCountries.length === 0) {
      setError("Please select at least one country");
      return false;
    }
    if (!formData.privacyPolicyAccepted || !formData.termsOfServiceAccepted) {
      setError("Please accept both Privacy Policy and Terms of Service");
      return false;
    }
    return true;
  };

  const canSubmit = useMemo(() => {
    return (
      formData.password &&
      formData.confirmPassword &&
      formData.firstName &&
      formData.lastName &&
      formData.phoneNumber &&
      formData.employeeId &&
      formData.role &&
      formData.specialization.length > 0 &&
      formData.specializationCountries.length > 0 &&
      formData.privacyPolicyAccepted &&
      formData.termsOfServiceAccepted
    );
  }, [formData]);

  const handleSubmit = async () => {
    console.log("🔥 Submit button clicked");
    
    if (!validateForm()) {
      console.log("❌ Validation failed:", error);
      toast({
        title: "Validation Error",
        description: error,
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    setError("");

    // Format the payload exactly as API expects
    const payload = {
      username: initialUsername,
      email: initialEmail,
      password: formData.password,
      confirmPassword: formData.confirmPassword,
      firstName: formData.firstName,
      lastName: formData.lastName,
      phoneNumber: formData.phoneNumber,
      employeeId: formData.employeeId,
      role: formData.role,
      specialization: formData.specialization.join(","),
      specializationCountries: formData.specializationCountries.join(","),
      privacyPolicyAccepted: formData.privacyPolicyAccepted,
      termsOfServiceAccepted: formData.termsOfServiceAccepted,
    };

    console.log("📤 Submitting payload:", payload);

    try {
      const response = await registerAdmin(payload);
      
      console.log("✅ Registration successful:", response);
      
      setSuccessData(response);
      setShowSuccess(true);

      toast({
        title: "Success!",
        description: response.message || "Admin registered successfully",
      });
    } catch (err: any) {
      console.error("❌ Registration error:", err);
      const errorMsg = err.message || "Registration failed. Please try again.";
      setError(errorMsg);
      toast({
        title: "Registration Failed",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {open && !showSuccess && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-black/50 backdrop-blur-md" />

            <motion.div
              initial={{ y: 24, scale: 0.98, opacity: 0 }}
              animate={{ y: 0, scale: 1, opacity: 1 }}
              exit={{ y: 24, scale: 0.98, opacity: 0 }}
              className="relative w-full max-w-4xl my-8 rounded-2xl border border-border bg-white/90 backdrop-blur-xl shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="p-8">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#E08D3C] to-[#9DB4C0] flex items-center justify-center">
                    <Shield className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold">Complete Admin Registration</h2>
                    <p className="text-sm text-gray-600">
                      Registering as: <span className="font-medium text-[#E08D3C]">{initialEmail}</span>
                    </p>
                  </div>
                </div>

                {error && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {error}
                  </div>
                )}

                <div className="space-y-8">
                  {/* Security Information */}
                  <div className="bg-red-50/50 rounded-lg p-6">
                    <h3 className="text-lg font-medium mb-4 text-gray-900 flex items-center gap-2">
                      <Lock className="w-5 h-5" />
                      Security Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Password *
                        </label>
                        <input
                          type="password"
                          className="w-full text-sm rounded-md border bg-white px-3 py-2 focus:ring-2 focus:ring-[#E08D3C]/20 focus:border-[#E08D3C] transition-colors"
                          value={formData.password}
                          onChange={(e) => updateField("password", e.target.value)}
                          required
                          minLength={8}
                          placeholder="Minimum 8 characters"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Confirm Password *
                        </label>
                        <input
                          type="password"
                          className="w-full text-sm rounded-md border bg-white px-3 py-2 focus:ring-2 focus:ring-[#E08D3C]/20 focus:border-[#E08D3C] transition-colors"
                          value={formData.confirmPassword}
                          onChange={(e) => updateField("confirmPassword", e.target.value)}
                          required
                          placeholder="Re-enter password"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Personal Information */}
                  <div className="bg-blue-50/50 rounded-lg p-6">
                    <h3 className="text-lg font-medium mb-4 text-gray-900 flex items-center gap-2">
                      <User className="w-5 h-5" />
                      Personal Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">First Name *</label>
                        <input
                          className="w-full text-sm rounded-md border bg-white px-3 py-2 focus:ring-2 focus:ring-[#E08D3C]/20 focus:border-[#E08D3C] transition-colors"
                          value={formData.firstName}
                          onChange={(e) => updateField("firstName", e.target.value)}
                          required
                          placeholder="Enter first name"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Last Name *</label>
                        <input
                          className="w-full text-sm rounded-md border bg-white px-3 py-2 focus:ring-2 focus:ring-[#E08D3C]/20 focus:border-[#E08D3C] transition-colors"
                          value={formData.lastName}
                          onChange={(e) => updateField("lastName", e.target.value)}
                          required
                          placeholder="Enter last name"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          <Phone className="w-3 h-3 inline mr-1" />
                          Phone Number *
                        </label>
                        <input
                          type="tel"
                          placeholder="+1234567890"
                          className="w-full text-sm rounded-md border bg-white px-3 py-2 focus:ring-2 focus:ring-[#E08D3C]/20 focus:border-[#E08D3C] transition-colors"
                          value={formData.phoneNumber}
                          onChange={(e) => updateField("phoneNumber", e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Organization Details */}
                  <div className="bg-green-50/50 rounded-lg p-6">
                    <h3 className="text-lg font-medium mb-4 text-gray-900 flex items-center gap-2">
                      <Building className="w-5 h-5" />
                      Organization Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Employee ID *</label>
                        <input
                          placeholder="EMP001"
                          className="w-full text-sm rounded-md border bg-white px-3 py-2 focus:ring-2 focus:ring-[#E08D3C]/20 focus:border-[#E08D3C] transition-colors"
                          value={formData.employeeId}
                          onChange={(e) => updateField("employeeId", e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Role *</label>
                        <select
                          className="w-full text-sm rounded-md border bg-white px-3 py-2 focus:ring-2 focus:ring-[#E08D3C]/20 focus:border-[#E08D3C] transition-colors"
                          value={formData.role}
                          onChange={(e) => updateField("role", e.target.value)}
                          required
                        >
                          {roles.map(role => (
                            <option key={role} value={role}>{role}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Specialization */}
                  <div className="bg-purple-50/50 rounded-lg p-6">
                    <h3 className="text-lg font-medium mb-4 text-gray-900 flex items-center gap-2">
                      <Award className="w-5 h-5" />
                      Specialization & Countries
                    </h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-2">
                          Specialization * (Select one or more)
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {specializations.map(spec => (
                            <label
                              key={spec.value}
                              className={`flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                                formData.specialization.includes(spec.value)
                                  ? 'border-[#E08D3C] bg-orange-50'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={formData.specialization.includes(spec.value)}
                                onChange={() => toggleArrayValue('specialization', spec.value)}
                                className="w-4 h-4"
                              />
                              <span className="text-sm font-medium">{spec.label}</span>
                            </label>
                          ))}
                        </div>
                        {formData.specialization.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {formData.specialization.map(spec => (
                              <span
                                key={spec}
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-[#E08D3C]/10 text-[#E08D3C] font-medium"
                              >
                                {specializations.find(s => s.value === spec)?.label}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-2">
                          <Globe className="w-3 h-3 inline mr-1" />
                          Specialization Countries * (Select one or more)
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {countries.map(country => (
                            <label
                              key={country.code}
                              className={`flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                                formData.specializationCountries.includes(country.code)
                                  ? 'border-[#9DB4C0] bg-blue-50'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={formData.specializationCountries.includes(country.code)}
                                onChange={() => toggleArrayValue('specializationCountries', country.code)}
                                className="w-4 h-4"
                              />
                              <span className="text-sm font-medium">{country.name}</span>
                            </label>
                          ))}
                        </div>
                        {formData.specializationCountries.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {formData.specializationCountries.map(code => (
                              <span
                                key={code}
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-[#9DB4C0]/10 text-[#9DB4C0] font-medium"
                              >
                                {countries.find(c => c.code === code)?.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Agreement */}
                  <div className="bg-orange-50/50 rounded-lg p-6">
                    <h3 className="text-lg font-medium mb-3 text-gray-900">Terms & Conditions</h3>
                    <div className="space-y-3">
                      <label className="flex items-start gap-3 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.privacyPolicyAccepted}
                          onChange={(e) => updateField("privacyPolicyAccepted", e.target.checked)}
                          className="mt-0.5 w-4 h-4"
                        />
                        <span className="text-gray-700">
                          I accept the <span className="font-medium text-[#E08D3C]">Privacy Policy</span> *
                        </span>
                      </label>
                      <label className="flex items-start gap-3 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.termsOfServiceAccepted}
                          onChange={(e) => updateField("termsOfServiceAccepted", e.target.checked)}
                          className="mt-0.5 w-4 h-4"
                        />
                        <span className="text-gray-700">
                          I accept the <span className="font-medium text-[#E08D3C]">Terms of Service</span> *
                        </span>
                      </label>
                    </div>
                  </div>

                  <div className="flex gap-4 justify-end pt-4 border-t">
                    <button
                      type="button"
                      onClick={() => navigate(-1)}
                      className="px-6 py-2.5 rounded-md border border-gray-300 text-sm font-medium hover:bg-gray-50 transition-colors"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={!canSubmit || isSubmitting}
                      className="px-8 py-2.5 rounded-md bg-gradient-to-r from-[#E08D3C] to-[#9DB4C0] text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all flex items-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Registering...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          <span>Complete Registration</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <SuccessModal open={showSuccess} data={successData} />
    </>
  );
};