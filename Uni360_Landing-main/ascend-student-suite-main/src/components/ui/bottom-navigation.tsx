import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  Home,
  FileText,
  GraduationCap,
  Plane,
  User,
  MoreHorizontal,
  CreditCard,
  FolderOpen,
  BookOpen,
  Bot,
  Settings,
  X
} from "lucide-react";
import { useState } from "react";

const primaryNavItems = [
  { title: "Dashboard", url: "/dashboard", icon: Home },
  { title: "Applications", url: "/applications", icon: FileText },
  { title: "Universities", url: "/universities", icon: GraduationCap },
  { title: "Visa", url: "/visa", icon: Plane },
  { title: "Profile", url: "/profilebuilder", icon: User },
];

const overflowNavItems = [
  { title: "Finances", url: "/finances", icon: CreditCard },
  { title: "Documents", url: "/documents", icon: FolderOpen },
  { title: "Resources", url: "/resources", icon: BookOpen },
  { title: "AI Tools", url: "/ai-tools", icon: Bot },
  { title: "Settings", url: "/settings", icon: Settings },
];

// Navigation helper function (you'll need to implement this or use your router)
const handleNavigation = (url: string) => {
  // Use your navigation method here
  window.location.href = url;
};

export function BottomNavigation() {
  const [showOverflow, setShowOverflow] = useState(false);
  const location = useLocation();

  const closeOverflow = () => setShowOverflow(false);

  return (
    <>
      {/* Mobile Bottom Navigation */}
      <nav className={cn(
        "fixed z-50 md:hidden",
        // Better positioning with more space from bottom
        "bottom-4 xs:bottom-5 sm:bottom-6",
        "left-4 right-4 xs:left-6 xs:right-6 sm:left-8 sm:right-8",
        // Safe area handling
        "pb-safe-bottom"
      )}>
        <div
          className={cn(
            "flex items-center justify-between",
            // Much larger padding for pill shape
            "px-4 py-3 xs:px-6 xs:py-4 sm:px-8 sm:py-5",
            // Glass morphism with stronger effect
            "bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl",
            "border border-gray-200/50 dark:border-gray-700/50",
            // Perfect pill shape
            "rounded-full shadow-2xl shadow-black/10 dark:shadow-black/30",
            // Full width container
            "w-full"
          )}
        >
          {primaryNavItems.map((item) => {
            const isActive = location.pathname === item.url;
            return (
              <NavLink
                key={item.url}
                to={item.url}
                className={cn(
                  "flex flex-col items-center justify-center gap-1.5 xs:gap-2",
                  "rounded-2xl transition-all duration-300 ease-out",
                  // Much larger touch targets
                  "px-3 py-2.5 xs:px-4 xs:py-3 sm:px-5 sm:py-4",
                  "min-w-[52px] min-h-[52px] xs:min-w-[60px] xs:min-h-[60px] sm:min-w-[68px] sm:min-h-[68px]",
                  "touch-manipulation flex-shrink-0 flex-1 max-w-[80px]",
                  "active:scale-95 hover:scale-105",
                  isActive
                    ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/25"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100/70 dark:hover:bg-gray-800/50"
                )}
              >
                <item.icon className={cn(
                  "flex-shrink-0",
                  // Larger icons
                  "w-6 h-6 xs:w-7 xs:h-7 sm:w-8 sm:h-8",
                  isActive && "drop-shadow-sm"
                )} />
                <span className={cn(
                  "font-semibold leading-tight text-center",
                  // Always show text, better sizing
                  "text-[10px] xs:text-[11px] sm:text-xs",
                  "line-clamp-1 max-w-full",
                  isActive && "drop-shadow-sm"
                )}>
                  {item.title}
                </span>
              </NavLink>
            );
          })}
          
          {/* More Button */}
          <button
            onClick={() => setShowOverflow(!showOverflow)}
            className={cn(
              "flex flex-col items-center justify-center gap-1.5 xs:gap-2",
              "rounded-2xl transition-all duration-300 ease-out",
              // Consistent sizing with nav items
              "px-3 py-2.5 xs:px-4 xs:py-3 sm:px-5 sm:py-4",
              "min-w-[52px] min-h-[52px] xs:min-w-[60px] xs:min-h-[60px] sm:min-w-[68px] sm:min-h-[68px]",
              "touch-manipulation flex-shrink-0 max-w-[80px]",
              "active:scale-95 hover:scale-105",
              showOverflow
                ? "bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-500/25"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100/70 dark:hover:bg-gray-800/50"
            )}
          >
            <MoreHorizontal className={cn(
              "flex-shrink-0",
              "w-6 h-6 xs:w-7 xs:h-7 sm:w-8 sm:h-8",
              showOverflow && "drop-shadow-sm"
            )} />
            <span className={cn(
              "font-semibold leading-tight text-center",
              "text-[10px] xs:text-[11px] sm:text-xs",
              "line-clamp-1",
              showOverflow && "drop-shadow-sm"
            )}>
              More
            </span>
          </button>
        </div>
      </nav>

      {/* Overflow Menu */}
      {showOverflow && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-40 md:hidden bg-black/20 backdrop-blur-sm touch-none"
            onClick={closeOverflow}
          />
          
          {/* Overflow Menu Content */}
          <div
            className={cn(
              "fixed z-50 md:hidden touch-auto",
              // Better positioning above the nav
              "bottom-24 xs:bottom-28 sm:bottom-32",
              "left-4 right-4 xs:left-6 xs:right-6 sm:left-8 sm:right-8",
              // Modern card styling with proper background
              "bg-white dark:bg-gray-800 backdrop-blur-2xl",
              "border border-gray-200 dark:border-gray-700",
              "rounded-3xl shadow-2xl shadow-black/10 dark:shadow-black/30",
              // Better padding
              "p-6 xs:p-7 sm:p-8",
              // Smooth animation
              "animate-in slide-in-from-bottom-8 duration-400",
              // Max height for scrolling
              "max-h-[65vh] overflow-y-auto"
            )}
          >
            {/* Header with close button */}
            <div className="flex justify-between items-center mb-6">
              <h3 className={cn(
                "font-bold text-gray-900 dark:text-gray-100",
                "text-xl xs:text-2xl sm:text-2xl"
              )}>
                More Options
              </h3>
              <button
                onClick={closeOverflow}
                className={cn(
                  "flex items-center justify-center",
                  "w-10 h-10 xs:w-11 xs:h-11 rounded-full",
                  "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200",
                  "hover:bg-gray-100 dark:hover:bg-gray-700",
                  "transition-all duration-200 touch-manipulation"
                )}
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Vertical list layout for overflow items (like your design) */}
            <div className="space-y-2">
              {overflowNavItems.map((item) => {
                const isActive = location.pathname === item.url;
                return (
                  <button
                    key={item.url}
                    onClick={() => {
                      closeOverflow();
                      handleNavigation(item.url);
                    }}
                    className={cn(
                      "flex items-center gap-4 w-full",
                      "rounded-xl transition-all duration-200 ease-out",
                      "px-4 py-3.5",
                      "touch-manipulation text-left",
                      "hover:bg-gray-50 dark:hover:bg-gray-700",
                      "active:scale-[0.98]",
                      isActive
                        ? "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400"
                        : "text-gray-700 dark:text-gray-200"
                    )}
                  >
                    <div className={cn(
                      "flex items-center justify-center",
                      "w-10 h-10 rounded-lg flex-shrink-0",
                      isActive 
                        ? "bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                    )}>
                      <item.icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <span className={cn(
                        "font-medium text-base",
                        isActive 
                          ? "text-amber-600 dark:text-amber-400" 
                          : "text-gray-900 dark:text-gray-100"
                      )}>
                        {item.title}
                      </span>
                    </div>
                    {isActive && (
                      <div className="w-2 h-2 bg-white rounded-full flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </>
  );
}