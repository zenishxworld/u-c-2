import React, { useEffect, useState } from "react";
import {
  Home,
  GraduationCap,
  FileText,
  Upload,
  CreditCard,
  Calendar,
  Bot,
  Clock,
  LogOut,
  Building2,
} from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "../ui/sidebar";
import { useAppSelector, useAppDispatch } from "../../hooks/useRedux";
import { logout } from "../../store/slices/authSlice";
import { getAuthUser, shouldBlurShell, clearAuth } from "../../lib/onboarding";
import { clearTokens } from "../../utils/tokenStore"; // ✅ ADD THIS IMPORT

/** PURE "chat" icon (no speech bubble) for Communications */
const ChatLinesIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    aria-label="Chat"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.75}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <circle cx="6.5" cy="7.5" r="1" />
    <line x1="9" y1="7.5" x2="18" y2="7.5" />
    <circle cx="6.5" cy="12" r="1" />
    <line x1="9" y1="12" x2="18" y2="12" />
    <circle cx="6.5" cy="16.5" r="1" />
    <line x1="9" y1="16.5" x2="18" y2="16.5" />
  </svg>
);

/** COMMUNITY/PEOPLE icon for Support (two heads + shoulders) */
const CommunityIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    aria-label="Community"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.75}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <circle cx="8" cy="7.5" r="3" />
    <path d="M2.5 18.5a6 6 0 0 1 11 0" />
    <circle cx="16.5" cy="9" r="2.6" />
    <path d="M12.5 20a5.5 5.5 0 0 1 9 0" />
  </svg>
);

const navigationItems = [
  { title: "Dashboard", url: "/dashboard", icon: Home },
  { title: "Universities", url: "/universities", icon: Building2 },
  { title: "Applications", url: "/applications", icon: FileText },
  { title: "Documents", url: "/documents", icon: Upload },
  { title: "History", url: "/history", icon: Clock },
  { title: "Payments", url: "/payments", icon: CreditCard },
  { title: "Appointments", url: "/appointments", icon: Calendar },
  { title: "Students", url: "/students", icon: GraduationCap },
  { title: "Support", url: "/support", icon: CommunityIcon },
  { title: "Communications", url: "/communications", icon: ChatLinesIcon },
  { title: "AI Tools", url: "/ai-tools", icon: Bot },
  { title: "Resources", url: "/resources", icon: Calendar },
];

export const AppSidebar: React.FC = () => {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const reduxUser = useAppSelector((s) => s.auth.user);
  const authUser = getAuthUser();

  const [blur, setBlur] = useState(shouldBlurShell());
  const [supportCount, setSupportCount] = useState(0);

  useEffect(() => {
    const fetchSupportCount = async () => {
      try {
        const token = localStorage.getItem('uni_access_token');
        if (!token) return;
        const res = await fetch(
          `${(import.meta.env?.VITE_API_BASE_URL || '').replace(/\/+$/, '')}/api/v1/admin/queries`,
          { headers: { Authorization: `Bearer ${token}`, 'X-Client-ID': 'uniflow' } }
        );
        if (!res.ok) return;
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          // Count queries that have a reply
          setSupportCount(json.data.filter((q: any) => q.reply).length);
        }
      } catch { /* silent */ }
    };
    fetchSupportCount();
  }, []);

  useEffect(() => {
    const update = () => setBlur(shouldBlurShell());
    window.addEventListener("b2b-onboarding-change", update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener("b2b-onboarding-change", update);
      window.removeEventListener("storage", update);
    };
  }, []);

  const displayName = authUser?.name ?? reduxUser?.name ?? "User";
  const avatar = authUser?.avatarUrl ?? reduxUser?.profileImage ?? "";

  const currentPath = location.pathname;
  const isActive = (path: string) =>
    (path === "/dashboard" && currentPath === "/") ||
    currentPath === path ||
    currentPath.startsWith(path + "/");

  // ✅ FIXED LOGOUT FUNCTION - Now clears everything!
  const handleLogout = () => {
    console.log("🚨 Logout clicked - Starting cleanup...");
    
    // ✅ 1. Clear localStorage (tokens, user data)
    clearTokens();
    console.log("✅ localStorage cleared");
    
    // ✅ 2. Clear custom auth (onboarding lib)
    clearAuth();
    console.log("✅ Custom auth cleared");
    
    // ✅ 3. Update Redux state
    dispatch(logout());
    console.log("✅ Redux state updated");
    
    // ✅ 4. Redirect to login
    navigate("/login", { replace: true });
    console.log("✅ Redirecting to login");
  };

  return (
    <Sidebar className={collapsed ? "w-16" : "w-64"} collapsible="icon">
      <SidebarContent className="bg-sidebar min-h-screen flex flex-col">
        {/* Header Section */}
        {!collapsed && (
          <motion.div
            className={`p-4 lg:p-3 border-b border-sidebar-border transition flex-shrink-0 ${
              blur ? "blur-sm md:blur-md pointer-events-none select-none" : ""
            }`}
            initial={{ opacity: 0, y: -18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
          >
            <div className="flex items-center gap-3">
              {avatar ? (
                <img src={avatar} alt="Profile" className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <div className="w-10 h-10 uni-gradient-primary rounded-full grid place-items-center">
                  <span className="text-white font-bold text-sm">{displayName.charAt(0)}</span>
                </div>
              )}
              <h3 className="text-sidebar-foreground font-medium text-sm truncate">{displayName}</h3>
            </div>
          </motion.div>
        )}

        {/* Navigation Section - Flexible grow */}
        <div className={`flex-1 overflow-y-hidden ${blur ? "blur-sm md:blur-md pointer-events-none select-none" : ""}`}>
          <div className="py-2 md:py-4 lg:py-2">
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navigationItems.map((item, iIdx) => {
                    const Icon = item.icon as React.ComponentType<any>;
                    const active = isActive(item.url);
                    return (
                      <SidebarMenuItem key={item.title}>
                        <motion.div
                          initial={{ opacity: 0, x: -18 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{
                            delay: iIdx * 0.04,
                            type: "spring",
                            stiffness: 300,
                            damping: 30,
                          }}
                        >
                          <SidebarMenuButton asChild>
                            <NavLink
                              to={item.url}
                              className={({ isActive: linkActive }) => `
                                flex items-center px-4 py-3 lg:py-2.5 mx-2 rounded-lg transition-all duration-200 cursor-pointer
                                ${
                                  active || linkActive
                                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                                }
                                ${collapsed ? "justify-center" : "justify-start"}
                              `}
                              end={item.url === "/dashboard"}
                            >
                              <>
                                <Icon className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
                                {!collapsed && (
                                  <span className="ml-3 font-medium text-sm flex items-center gap-2">
                                    {item.title}
                                    {item.title === 'Support' && supportCount > 0 && (
                                      <span className="ml-auto text-xs font-bold px-1.5 py-0.5 rounded-full bg-orange-400 text-white leading-none">
                                        {supportCount}
                                      </span>
                                    )}
                                  </span>
                                )}
                                {collapsed && item.title === 'Support' && supportCount > 0 && (
                                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-orange-400" />
                                )}
                              </>
                            </NavLink>
                          </SidebarMenuButton>
                        </motion.div>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </div>
        </div>

        {/* Logout Section - Fixed and always clickable */}
        <div className="mt-auto px-3 py-4">
          <button
            onClick={handleLogout}
            className={`w-full flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm
                        bg-primary text-white hover:bg-primary/80 hover:text-white transition
                        relative z-50`}
            style={{ pointerEvents: 'auto' }}
          >
            <LogOut className="w-4 h-4" />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
};