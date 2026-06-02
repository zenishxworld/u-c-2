import React, { useEffect, useState, useCallback } from "react";
import { Bell, Settings, User, LogOut, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppSelector, useAppDispatch } from "../../hooks/useRedux";
import { logout } from "../../store/slices/authSlice";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { useNavigate } from "react-router-dom";
import { getAuthUser, shouldBlurShell, clearAuth } from "../../lib/onboarding";
import { clearTokens } from "../../utils/tokenStore";
import { api } from "../../services/api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ApiNotification {
  id: string;
  userId: number;
  senderId: number;
  type: string;        // "SYSTEM_ALERT" | "TASK_COMPLETION" | etc.
  title: string;
  message: string;
  contentType: string; // "PLAIN" | "HTML"
  status: string;      // "UNREAD" | "READ"
  metadata: Record<string, any>;
  createdAt: string;
}

// Map real API fields → UI shape
function normaliseNotification(n: ApiNotification) {
  const uiType = ((): "success" | "warning" | "info" => {
    const t = (n.type ?? "").toUpperCase();
    if (t === "TASK_COMPLETION") return "success";
    if (t === "SYSTEM_ALERT")   return "warning";
    return "info";
  })();

  return {
    id:        n.id,
    title:     n.title ?? "Notification",
    message:   n.message ?? "",
    type:      uiType,
    read:      n.status === "READ",
    timestamp: n.createdAt ?? new Date().toISOString(),
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

export const Navbar: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const reduxUser = useAppSelector((s) => s.auth.user);

  const [showNotifications, setShowNotifications] = useState(false);
  const [blur, setBlur] = useState(shouldBlurShell());
  const [selectedNotification, setSelectedNotification] = useState<ReturnType<typeof normaliseNotification> | null>(null);

  // ── Notification state ────────────────────────────────────────────────────
  const [notificationsList, setNotificationsList] = useState<ReturnType<typeof normaliseNotification>[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [notificationsError, setNotificationsError] = useState<string | null>(null);

  // ── Fetch from GET /api/v1/notifications ─────────────────────────────────
  const fetchNotifications = useCallback(async () => {
    setLoadingNotifications(true);
    setNotificationsError(null);
    try {
      const response = await api.get("/api/v1/notifications");
      // Shape: { success, message, data: { count, notifications: [...] } }
      const raw: ApiNotification[] = response.data?.data?.notifications ?? [];
      setNotificationsList(raw.map(normaliseNotification));
    } catch (err: any) {
      console.error("Error fetching notifications:", err);
      setNotificationsError(err?.response?.data?.message ?? err?.message ?? "Failed to load notifications");
    } finally {
      setLoadingNotifications(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // ── Mark a single notification as read ───────────────────────────────────
  const markOneRead = useCallback(async (id: string) => {
    try {
      await api.patch(`/api/v1/notifications/${id}/read`);
    } catch (err) {
      console.warn("Could not mark notification as read:", err);
    }
    // Always update locally so UI reflects immediately
    setNotificationsList((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  // ── Derived values ────────────────────────────────────────────────────────
  const unreadCount = notificationsList.filter((n) => !n.read).length;

  // ── Shell blur ────────────────────────────────────────────────────────────
  useEffect(() => {
    const update = () => setBlur(shouldBlurShell());
    window.addEventListener("b2b-onboarding-change", update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener("b2b-onboarding-change", update);
      window.removeEventListener("storage", update);
    };
  }, []);

  // ── Close panel on outside click ──────────────────────────────────────────
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!showNotifications) return;
      const target = event.target as HTMLElement;
      const panel = document.querySelector("[data-notification-panel]");
      const btn = document.querySelector("[data-notification-button]");
      if (panel && !panel.contains(target) && btn && !btn.contains(target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showNotifications]);

  // ── Auth user info ────────────────────────────────────────────────────────
  const authUser = getAuthUser();
  const name = authUser?.name ?? reduxUser?.name ?? "User";
  const avatar = authUser?.avatarUrl ?? reduxUser?.profileImage ?? "";

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleNotificationClick = (notification: ReturnType<typeof normaliseNotification>) => {
    setSelectedNotification(notification);
    setShowNotifications(false);
    if (!notification.read) {
      markOneRead(notification.id as string);
    }
  };

  const handleLogout = () => {
    clearTokens();
    clearAuth();
    dispatch(logout());
    navigate("/login", { replace: true });
  };

  // ── Dot colour helper ─────────────────────────────────────────────────────
  const dotClass = (type: string) => {
    if (type === "success") return "bg-green-400 shadow-green-400/50";
    if (type === "warning") return "bg-yellow-400 shadow-yellow-400/50";
    return "bg-blue-400 shadow-blue-400/50";
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      <motion.nav
        className={`sticky top-0 z-50 w-full bg-transparent border-0 shadow-none ${blur ? "blur-[2px]" : ""}`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        role="navigation"
        aria-label="Primary"
      >
        <div className="relative flex items-center justify-end px-6 py-4">
          <div className="flex items-center space-x-3">

            {/* ── Notifications ────────────────────────────────────────── */}
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowNotifications((s) => !s)}
                className="
                  text-foreground/80 hover:text-foreground
                  hover:bg-white/20 dark:hover:bg-white/10
                  backdrop-blur-sm border border-white/10
                  transition-all duration-200 hover:scale-105
                  relative rounded-xl
                "
                aria-haspopup="dialog"
                aria-expanded={showNotifications}
                aria-label="Notifications"
                data-notification-button
              >
                {/* Spinner overlay while loading */}
                {loadingNotifications ? (
                  <span className="h-5 w-5 rounded-full border-2 border-foreground/30 border-t-foreground/80 animate-spin" />
                ) : (
                  <Bell className="h-5 w-5" />
                )}

                {unreadCount > 0 && (
                  <Badge
                    className="
                      absolute -top-1 -right-1 h-5 w-5 p-0
                      flex items-center justify-center text-xs
                      bg-gradient-to-r from-red-500 to-pink-500
                      hover:from-red-600 hover:to-pink-600
                      border-2 border-white/20 shadow-lg animate-pulse
                    "
                  >
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </Badge>
                )}
              </Button>

              {/* ── Dropdown panel ───────────────────────────────────── */}
              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    className="
                      absolute right-0 mt-3 w-80
                      bg-white/10 dark:bg-black/20
                      backdrop-blur-xl backdrop-saturate-150
                      border border-white/20 dark:border-white/10
                      rounded-2xl shadow-[0_8px_32px_0_rgba(31,38,135,0.37)]
                      z-50 overflow-hidden
                    "
                    data-notification-panel
                  >
                    {/* Header */}
                    <div className="p-4 border-b border-white/10 bg-gradient-to-r from-white/5 to-transparent">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-foreground/90">
                          Notifications
                          {unreadCount > 0 && (
                            <span className="ml-2 text-xs font-normal text-foreground/50">
                              ({unreadCount} unread)
                            </span>
                          )}
                        </h3>
                      </div>
                    </div>

                    {/* Body */}
                    <div className="max-h-96 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                      {/* Loading skeleton */}
                      {loadingNotifications && (
                        <div className="p-4 space-y-3">
                          {[1, 2, 3].map((i) => (
                            <div key={i} className="flex items-start space-x-3 animate-pulse">
                              <div className="w-2 h-2 rounded-full bg-white/20 mt-2 shrink-0" />
                              <div className="flex-1 space-y-2">
                                <div className="h-3 bg-white/20 rounded w-2/3" />
                                <div className="h-2 bg-white/10 rounded w-full" />
                                <div className="h-2 bg-white/10 rounded w-1/3" />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Error state */}
                      {!loadingNotifications && notificationsError && (
                        <div className="p-6 text-center">
                          <p className="text-xs text-red-400/80 mb-2">{notificationsError}</p>
                          <button
                            onClick={fetchNotifications}
                            className="text-xs text-foreground/60 hover:text-foreground underline"
                          >
                            Try again
                          </button>
                        </div>
                      )}

                      {/* Empty state */}
                      {!loadingNotifications && !notificationsError && notificationsList.length === 0 && (
                        <div className="p-6 text-center text-foreground/60 text-sm">
                          No notifications
                        </div>
                      )}

                      {/* Notification items */}
                      {!loadingNotifications && !notificationsError &&
                        notificationsList.slice(0, 10).map((notification) => (
                          <motion.div
                            key={notification.id}
                            onClick={() => handleNotificationClick(notification)}
                            className={`
                              p-4 border-b border-white/5 last:border-0
                              hover:bg-white/10 dark:hover:bg-white/5
                              cursor-pointer transition-all duration-200
                              ${!notification.read ? "bg-white/5 dark:bg-white/5" : ""}
                            `}
                            whileHover={{ backgroundColor: "rgba(255,255,255,0.1)", x: 2 }}
                          >
                            <div className="flex items-start space-x-3">
                              <div className={`w-2 h-2 rounded-full mt-2 shadow-lg shrink-0 ${dotClass(notification.type)}`} />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-medium text-sm text-foreground/90 truncate">
                                    {notification.title}
                                  </h4>
                                  {!notification.read && (
                                    <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-blue-400" />
                                  )}
                                </div>
                                <p className="text-xs text-foreground/70 mt-1 line-clamp-2">
                                  {notification.message}
                                </p>
                                <p className="text-xs text-foreground/50 mt-1">
                                  {new Date(notification.timestamp).toLocaleDateString(undefined, {
                                    month: "short",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        ))
                      }
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ── Profile Menu ─────────────────────────────────────────── */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="
                    text-foreground/80 hover:text-foreground
                    hover:bg-white/20 dark:hover:bg-white/10
                    backdrop-blur-sm border border-white/10
                    transition-all duration-200 hover:scale-105
                    rounded-xl overflow-hidden
                  "
                  aria-haspopup="menu"
                >
                  {avatar ? (
                    <div className="relative">
                      <img
                        src={avatar}
                        alt={`${name} profile`}
                        className="w-8 h-8 rounded-lg object-cover"
                      />
                      <div className="absolute inset-0 rounded-lg ring-2 ring-white/20" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                      <User className="h-5 w-5" />
                    </div>
                  )}
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align="end"
                className="
                  w-48 bg-white/10 dark:bg-black/20
                  backdrop-blur-xl backdrop-saturate-150
                  border border-white/20 dark:border-white/10
                  rounded-xl shadow-[0_8px_32px_0_rgba(31,38,135,0.37)]
                "
              >
                <DropdownMenuItem
                  onClick={() => navigate("/settings")}
                  className="hover:bg-orange-100/25 dark:hover:bg-orange-400/15 text-foreground/90 hover:text-foreground"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Account Settings
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="hover:bg-red-500/20 text-foreground/80 hover:text-red-400"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

          </div>
        </div>
      </motion.nav>

      {/* ── Notification Detail Modal ─────────────────────────────────────── */}
      <AnimatePresence>
        {selectedNotification && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedNotification(null)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]"
            />

            <div className="fixed inset-0 flex items-center justify-center z-[70] px-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-2xl"
              >
                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden">
                  {/* Modal Header */}
                  <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <div className={`w-3 h-3 rounded-full mt-1.5 shadow-lg ${dotClass(selectedNotification.type)}`} />
                        <div>
                          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                            {selectedNotification.title}
                          </h2>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {new Date(selectedNotification.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedNotification(null)}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                      >
                        <X className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>

                  {/* Modal Content */}
                  <div className="p-6 max-h-96 overflow-y-auto">
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Message
                        </h3>
                        <p className="text-gray-900 dark:text-gray-100">
                          {selectedNotification.message}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Modal Footer */}
                  <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex justify-end space-x-3">
                    <Button
                      variant="ghost"
                      onClick={() => setSelectedNotification(null)}
                      className="hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                    >
                      Close
                    </Button>
                    
                  </div>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};