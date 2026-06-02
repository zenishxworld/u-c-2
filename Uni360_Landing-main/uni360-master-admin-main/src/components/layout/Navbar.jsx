import React, { useRef, useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  BellIcon,
  UserCircleIcon,
  ChevronDownIcon,
  MagnifyingGlassIcon,
  Bars3Icon,
} from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from "framer-motion";
import {
  toggleNotifications,
  toggleProfileMenu,
  markAllNotificationsRead,
  toggleSidebar,
} from "../../store/slices/uiSlice";
import { logout } from "../../store/slices/authSlice";
import { useNavigate } from "react-router-dom";
import GlobalSearch from "../GlobalSearch";

const Navbar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const { notifications, notificationsOpen, profileMenuOpen } = useSelector(
    (state) => state.ui
  );
  const { user } = useSelector((state) => state.auth);

  const notificationRef = useRef(null);
  const profileRef = useRef(null);

  const unreadNotifications = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        if (notificationsOpen) dispatch(toggleNotifications());
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        if (profileMenuOpen) dispatch(toggleProfileMenu());
      }
    };

    const handleKeyDown = (event) => {
      // Open search with Ctrl+K or Cmd+K
      if ((event.ctrlKey || event.metaKey) && event.key === "k") {
        event.preventDefault();
        setSearchOpen(true);
      }
      // Close search with Escape
      if (event.key === "Escape") {
        setSearchOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [notificationsOpen, profileMenuOpen, dispatch]);

  const handleMarkAllRead = () => {
    dispatch(markAllNotificationsRead());
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 border-b z-50 h-16 text-white max-w-full overflow-hidden" style={{ backgroundColor: "hsl(195, 20%, 19%)", borderColor: "hsl(195, 20%, 25%)" }}>
      <div className="px-2 sm:px-4 lg:px-8 max-w-full">
        <div className="flex justify-between items-center h-16 max-w-full">
          {/* Left side - Logo */}
          <div className="flex items-center min-w-0">
            {/* Mobile menu button */}
            <button
              onClick={() => dispatch(toggleSidebar())}
              className="lg:hidden p-1.5 sm:p-2 text-gray-300 hover:text-white focus:outline-none focus:text-white transition-colors duration-150 mr-2 sm:mr-3 flex-shrink-0"
              title="Toggle menu">
              <Bars3Icon className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>

            <button
              onClick={() => navigate("/dashboard")}
              className="flex-shrink-0 flex items-center min-w-0 -ml-6 sm:-ml-4 hover:opacity-80 transition-opacity duration-200 focus:outline-none focus:opacity-80"
            >
              {/* Custom Logo Image */}
              <img
                src="/assets/White_uni360.png"
                alt="UNI360 Logo"
                className="h-10 w-10 sm:h-12 sm:w-12 lg:h-14 lg:w-14 flex-shrink-0 object-contain mt-1 -mr-1"
              />
              <span className="text-base sm:text-lg lg:text-xl font-bold truncate">
                UNI360°
              </span>
            </button>
          </div>

          {/* Right side - Controls */}
          <div className="flex items-center space-x-1 sm:space-x-2 lg:space-x-4 flex-shrink-0">
            {/* Global Search */}
            <button
              onClick={() => setSearchOpen(true)}
              className="p-1.5 sm:p-2 text-gray-300 hover:text-white focus:outline-none focus:text-white transition-colors duration-150 flex-shrink-0"
              title="Search (Ctrl+K)">
              <MagnifyingGlassIcon className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>

            {/* Profile Menu */}
            <div className="relative flex-shrink-0" ref={profileRef}>
              <button
                onClick={() => dispatch(toggleProfileMenu())}
                className="flex items-center space-x-1 sm:space-x-2 p-1 sm:p-2 text-white hover:text-gray-100 rounded-lg transition-colors min-w-0">
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt="Profile"
                    className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 rounded-full flex-shrink-0"
                  />
                ) : (
                  <UserCircleIcon className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 flex-shrink-0" />
                )}
                <span className="hidden sm:block text-xs sm:text-sm font-medium truncate max-w-16 sm:max-w-24 lg:max-w-none">
                  {user?.name || "Master Admin"}
                </span>
                <ChevronDownIcon className="hidden sm:block h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              </button>

              <AnimatePresence>
                {profileMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    className="fixed top-16 right-2 sm:right-4 lg:right-8 z-[9999] w-48 sm:w-52 bg-white rounded-lg shadow-xl border border-gray-200 py-2"
                    style={{
                      boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                    }}>
                    <button
                      onClick={() => {
                        navigate("/settings");
                        dispatch(toggleProfileMenu());
                      }}
                      className="block w-full text-left px-3 sm:px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 whitespace-nowrap">
                      Account Settings
                    </button>
                    <hr className="my-1" />
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-3 sm:px-4 py-3 text-sm text-red-600 hover:bg-red-50 whitespace-nowrap">
                      Logout
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Global Search Modal */}
      <GlobalSearch isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </nav>
  );
};

export default Navbar;