import { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  Home,
  FileText,
  GraduationCap,
  Plane,
  CreditCard,
  FolderOpen,
  BookOpen,
  Bot,
  MessageCircle,
  Settings,
  LogOut,
  MoreHorizontal,
  X,
  User
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const navigationItems = [
  { title: "Dashboard", url: "/dashboard", icon: Home },
  { title: "Documents", url: "/documents", icon: FolderOpen },
  { title: "Universities", url: "/universities", icon: GraduationCap },
  { title: "Applications", url: "/applications", icon: FileText },
  { title: "AI Tools", url: "/ai-tools", icon: Bot },
  { title: "Finances", url: "/finances", icon: CreditCard },
  { title: "Visa", url: "/visa", icon: Plane },
  { title: "Resources", url: "/resources", icon: BookOpen },
];

// Primary navigation items for mobile (most important ones) - ensuring Dashboard is first
const primaryNavItems = [
  { title: "Dashboard", url: "/dashboard", icon: Home },
  { title: "Documents", url: "/documents", icon: FolderOpen },
  { title: "Universities", url: "/universities", icon: GraduationCap },
  { title: "Applications", url: "/applications", icon: FileText },
];

export function FloatingSidebar() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleSignOut = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
      navigate('/login');
    }
  };

  const toggleMobileMenu = () => setShowMobileMenu(!showMobileMenu);
  const closeMobileMenu = () => setShowMobileMenu(false);

  return (
    <>
      {/* Desktop/Tablet Floating Sidebar - Only visible on lg screens and above */}
      <aside
        className={cn(
          "fixed left-6 top-[calc(50vh+32px)] -translate-y-1/2 z-50",
          "hidden lg:flex flex-col",
          "backdrop-blur-xl border-2 border-blue-200/50",
          "shadow-[0_20px_50px_-12px_rgba(196,223,240,0.4)] transition-all duration-300 ease-out",
          "rounded-2xl overflow-hidden",
          "h-fit max-h-[calc(100vh-6rem)]",
          isExpanded ? "w-72" : "w-16"
        )}
        style={{ background: "linear-gradient(160deg, rgba(224,240,250,0.95) 0%, rgba(240,247,253,0.95) 100%)" }}
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
      >
        {/* Navigation Items */}
        <nav className="flex-1 p-2 overflow-y-auto scrollbar-hide">
          <div className="space-y-1">
            {navigationItems.map((item) => {
              const isActive = location.pathname === item.url;
              return (
                <NavLink
                  key={item.url}
                  to={item.url}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-xl",
                    "transition-all duration-200 ease-out",
                    "group relative overflow-hidden",
                    "whitespace-nowrap",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-soft"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  <span
                    className={cn(
                      "font-medium transition-all duration-300 ease-out",
                      isExpanded 
                        ? "opacity-100 translate-x-0 delay-100" 
                        : "opacity-0 -translate-x-2 delay-0"
                    )}
                  >
                    {item.title}
                  </span>
                  {isActive && (
                    <div className="absolute inset-0 bg-gradient-primary opacity-10 rounded-xl" />
                  )}
                </NavLink>
              );
            })}
          </div>
        </nav>

        {/* Desktop Profile Section */}
        <div className="border-t border-border/50 p-2 flex-shrink-0">
          <NavLink
            to="/profilebuilder"
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-xl",
              "transition-all duration-200 ease-out",
              "text-muted-foreground hover:text-foreground hover:bg-muted",
              "whitespace-nowrap",
              location.pathname === "/profilebuilder" && "bg-primary text-primary-foreground shadow-soft"
            )}
          >
            <User className="w-5 h-5 flex-shrink-0" />
            <span
              className={cn(
                "font-medium transition-all duration-300 ease-out",
                isExpanded 
                  ? "opacity-100 translate-x-0 delay-100" 
                  : "opacity-0 -translate-x-2 delay-0"
              )}
            >
              Profile Builder
            </span>
          </NavLink>
          
          <button
            onClick={handleSignOut}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 rounded-xl",
              "transition-all duration-200 ease-out",
              "text-muted-foreground hover:text-destructive hover:bg-destructive/10",
              "whitespace-nowrap"
            )}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <span
              className={cn(
                "font-medium transition-all duration-300 ease-out",
                isExpanded 
                  ? "opacity-100 translate-x-0 delay-100" 
                  : "opacity-0 -translate-x-2 delay-0"
              )}
            >
              Sign Out
            </span>
          </button>
        </div>
      </aside>

      {/* Mobile navigation removed — handled by hamburger drawer in AppLayout */}
    </>
  );
}