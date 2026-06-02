import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { getAllQueries } from "../../services/queryService";
import { NavLink, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { toggleSidebar, setSidebarOpen } from "../../store/slices/uiSlice";
import {
  HomeIcon,
  UsersIcon,
  AcademicCapIcon,
  DocumentTextIcon,
  BanknotesIcon,
  CreditCardIcon,
  ChartBarIcon,
  FolderIcon,
  ChatBubbleLeftRightIcon,
  CogIcon,
  UserPlusIcon,
  BellIcon,
} from "@heroicons/react/24/outline";

const Sidebar = () => {
  const dispatch = useDispatch();
  const location = useLocation();

  const [activeQueryCount, setActiveQueryCount] = useState(0);

  // Safe selectors with fallbacks (avoid destructuring from possibly-undefined)
  const sidebarOpen =
    useSelector((state) => state.ui?.sidebarOpen) ?? false;

  const stats =
    useSelector((state) => state.adminRequests?.stats) ?? { pending: 0 };

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: HomeIcon },
    { name: "User Management", href: "/users", icon: UsersIcon },
    { name: "Universities", href: "/universities", icon: AcademicCapIcon },
    { name: "Applications", href: "/applications", icon: DocumentTextIcon },
    { name: "Commissions", href: "/commissions", icon: BanknotesIcon },
    { name: "Payments", href: "/payments", icon: CreditCardIcon },
    { name: "Reports & Analytics", href: "/reports", icon: ChartBarIcon },
    { name: "Queries", href: "/queries", icon: ChatBubbleLeftRightIcon, badge: activeQueryCount > 0 ? activeQueryCount : null },
    { name: "Notifications", href: "/notifications", icon: BellIcon },
    { name: "Leads", href: "/leads", icon: UserPlusIcon },
    { name: "Settings", href: "/settings", icon: CogIcon },
  ];

  const toggleSidebarOpen = () => {
    dispatch(toggleSidebar());
  };

  const fetchActiveQueries = React.useCallback(async () => {
    try {
      const response = await getAllQueries();
      const list = response?.data ?? (Array.isArray(response) ? response : []);
      // Count only OPEN queries
      const activeCount = list.filter(q => (q.status ?? "").toUpperCase() === "OPEN").length;
      setActiveQueryCount(activeCount);
    } catch (error) {
    }
  }, []);

  useEffect(() => {
    fetchActiveQueries();
  }, [location.pathname, fetchActiveQueries]);

  // Refresh immediately when queries are opened/replied/closed from the Queries page
  useEffect(() => {
    const handler = () => fetchActiveQueries();
    window.addEventListener('queriesUpdated', handler);
    return () => window.removeEventListener('queriesUpdated', handler);
  }, [fetchActiveQueries]);

  // Handle responsive behavior
  useEffect(() => {
    const handleResize = () => {
      if (typeof window !== "undefined" && window.innerWidth >= 1024) {
        // Desktop: keep sidebar open
        dispatch(setSidebarOpen(true));
      } else {
        // Mobile/Tablet: keep sidebar closed by default
        dispatch(setSidebarOpen(false));
      }
    };

    // Set initial state
    handleResize();

    // Listen for window resize
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [dispatch]);

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={toggleSidebarOpen}
        />
      )}

      {/* Sidebar */}
      <motion.div
        animate={{
          x: sidebarOpen ? 0 : -256,
          width: 256,
        }}
        initial={{
          x:
            typeof window !== "undefined" && window.innerWidth >= 1024
              ? 0
              : -256,
          width: 256,
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className={`fixed left-0 top-16 h-[calc(100vh-4rem)] border-r z-50 overflow-hidden shadow-lg desktop-sidebar ${sidebarOpen ? "mobile-sidebar-visible" : "mobile-sidebar-hidden"
          }`}
        style={{
          backgroundColor: "hsl(195, 20%, 19%)",
          borderColor: "hsl(195, 20%, 25%)",
          '--remove-close-button': 'none'
        }}
      >
        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4">
          <div className="space-y-1 pr-3">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  onClick={() => {
                    // Close sidebar on mobile when clicking a link
                    if (typeof window !== "undefined" && window.innerWidth < 1024) {
                      dispatch(toggleSidebar());
                    }
                  }}
                  className={`sidebar-link ${isActive ? "active" : ""
                    } group relative`}
                  title={!sidebarOpen ? item.name : ""}
                >
                  <item.icon className="h-6 w-6 flex-shrink-0" />
                  <motion.span
                    animate={{
                      opacity: 1,
                    }}
                    transition={{ duration: 0.2 }}
                    className="ml-3 text-sm font-medium flex-1"
                  >
                    {item.name}
                  </motion.span>

                  {/* Badge for notifications */}
                  {item.badge && (
                    <span className="bg-[#f29c38] text-white font-bold text-xs rounded-full h-5 min-w-[1.25rem] px-1 flex items-center justify-center ml-auto">
                      {item.badge}
                    </span>
                  )}

                  {/* Tooltip for collapsed sidebar */}
                  {!sidebarOpen && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                      {item.name}
                      {item.badge && ` (${item.badge})`}
                    </div>
                  )}
                </NavLink>
              );
            })}
          </div>
        </nav>
      </motion.div>
    </>
  );
};

export default Sidebar;