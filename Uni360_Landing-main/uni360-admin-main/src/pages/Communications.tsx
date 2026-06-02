import React, { useState, useMemo, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { createPortal } from "react-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, History, Bell, CheckCircle, Clock, RefreshCw } from "lucide-react";

// Get base URL from environment variable
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Student type based on API response
interface Student {
  id: number;
  name: string;
  email: string;
  userType: string;
  status: string;
}

// API Response types
interface StudentsResponse {
  success: boolean;
  message: string;
  data: {
    students: Student[];
    pagination?: {
      page: number;
      size: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrevious: boolean;
      currentPageItems: number;
    };
    summary: {
      totalStudents: number;
      activeStudents: number;
      pendingVerificationStudents: number;
      filtered: boolean;
    };
    timestamp: string;
  };
  timestamp: string;
}

interface NotificationResponse {
  success: boolean;
  message: string;
  data: {
    id: string;
    userId: number;
    senderId: number;
    type: string;
    title: string;
    message: string;
    contentType: string;
    status: string;
    actionUrl?: string;
    metadata: Record<string, any>;
    createdAt: string;
  };
  timestamp: string;
}

interface BroadcastResponse {
  success: boolean;
  message: string;
  data: Array<{
    id: string;
    userId: number;
    senderId: number;
    type: string;
    title: string;
    message: string;
    contentType: string;
    status: string;
    metadata: Record<string, any>;
    createdAt: string;
  }>;
  timestamp: string;
}

interface SentNotification {
  id: string;
  userId: number;
  senderId: number;
  type: string;
  title: string;
  message: string;
  contentType: string;
  status: string;
  actionUrl?: string;
  metadata: Record<string, any>;
  createdAt: string;
}

const Communications: React.FC = () => {
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [notificationType, setNotificationType] = useState("ADMIN_ANNOUNCEMENT");
  const [contentType, setContentType] = useState<"PLAIN" | "HTML">("PLAIN");
  const [actionUrl, setActionUrl] = useState("");
  const [filters, setFilters] = useState({
    name: "",
    email: "",
    status: "",
  });
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // History panel state
  const [showHistory, setShowHistory] = useState(false);
  const [sentNotifications, setSentNotifications] = useState<SentNotification[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  // Get access token from localStorage
  const getAccessToken = () => {
    try {
      return localStorage.getItem("uni_access_token");
    } catch {
      return null;
    }
  };

  // Fetch sent notifications history
  const fetchSentNotifications = useCallback(async () => {
    setHistoryLoading(true);
    setHistoryError(null);
    try {
      const token = getAccessToken();
      if (!token) throw new Error("No authentication token found.");
      const response = await fetch(`${API_BASE_URL}/api/v1/notifications/sent`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "X-Client-ID": "uniflow",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error(`Failed to fetch history: ${response.statusText}`);
      const data = await response.json();
      if (data.success && data.data?.notifications) {
        setSentNotifications(data.data.notifications);
        setTotalCount(data.data.count || data.data.notifications.length);
      } else {
        throw new Error(data.message || "Failed to retrieve notification history");
      }
    } catch (err) {
      setHistoryError(err instanceof Error ? err.message : "Failed to load history");
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    if (showHistory) fetchSentNotifications();
  }, [showHistory, fetchSentNotifications]);

   useEffect(() => {
    if (showHistory) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [showHistory]);

  // Fetch students from the API
  useEffect(() => {
    const fetchStudents = async () => {
      setLoading(true);
      setError(null);

      try {
        const token = getAccessToken();
        if (!token) {
          throw new Error("No authentication token found. Please log in.");
        }

        const response = await fetch(
          `${API_BASE_URL}/api/v1/notifications/students/dropdown`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              "X-Client-ID": "uniflow",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch students: ${response.statusText}`);
        }

        const data: StudentsResponse = await response.json();

        if (data.success && data.data.students) {
          setStudents(data.data.students);
        } else {
          throw new Error(data.message || "Failed to retrieve students");
        }
      } catch (err) {
        console.error("Error fetching students:", err);
        setError(err instanceof Error ? err.message : "Failed to load students");
        // Set empty array on error
        setStudents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, []);

  // Filter students based on search criteria
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const nameMatch = s.name.toLowerCase().includes(filters.name.toLowerCase());
      const emailMatch = s.email.toLowerCase().includes(filters.email.toLowerCase());
      const statusMatch = filters.status === "" || s.status === filters.status;
      
      return nameMatch && emailMatch && statusMatch;
    });
  }, [students, filters]);

  // Get unique statuses for filter
  const uniqueStatuses = useMemo(
    () => [...new Set(students.map((s) => s.status))].sort(),
    [students]
  );

  // Handle select all checkbox
  const selectAllState =
    filteredStudents.length > 0 &&
    selectedStudents.length === filteredStudents.length
      ? true
      : selectedStudents.length > 0
      ? "indeterminate"
      : false;

  const handleSelectAll = (checked: boolean) => {
    setSelectedStudents(checked ? filteredStudents.map((s) => s.id) : []);
  };

  const handleSelect = (id: number, checked: boolean) => {
    setSelectedStudents((prev) =>
      checked ? [...prev, id] : prev.filter((s) => s !== id)
    );
  };

  // Send notification to selected students
  const sendNotification = async () => {
    if (selectedStudents.length === 0 || !title.trim() || !content.trim()) {
      setError("Please select students and fill in all required fields");
      return;
    }

    setSending(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const token = getAccessToken();
      if (!token) {
        throw new Error("No authentication token found. Please log in.");
      }

      // If only one student selected, use single notification endpoint
      if (selectedStudents.length === 1) {
        const response = await fetch(`${API_BASE_URL}/api/v1/notifications/send`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Client-ID": "uniflow",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            recipientId: selectedStudents[0],
            type: notificationType,
            title: title.trim(),
            message: content.trim(),
            contentType,
            ...(actionUrl.trim() && { actionUrl: actionUrl.trim() }),
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to send notification: ${response.statusText}`);
        }

        const data: NotificationResponse = await response.json();

        if (!data.success) {
          throw new Error(data.message || "Failed to send notification");
        }

        setSuccessMessage(`Notification sent successfully to 1 student!`);
      } else {
        // Multiple students - use broadcast endpoint
        const response = await fetch(`${API_BASE_URL}/api/v1/notifications/broadcast`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Client-ID": "uniflow",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            recipientIds: selectedStudents,
            type: notificationType,
            title: title.trim(),
            message: content.trim(),
            contentType,
            ...(actionUrl.trim() && { actionUrl: actionUrl.trim() }),
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to broadcast notifications: ${response.statusText}`);
        }

        const data: BroadcastResponse = await response.json();

        if (!data.success) {
          throw new Error(data.message || "Failed to broadcast notifications");
        }

        setSuccessMessage(
          `Notifications sent successfully to ${selectedStudents.length} students!`
        );
      }

      // Clear form after successful send
      setSelectedStudents([]);
      setTitle("");
      setContent("");
      setActionUrl("");
      setNotificationType("ADMIN_ANNOUNCEMENT");
      setContentType("PLAIN");

      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      console.error("Error sending notification:", err);
      setError(err instanceof Error ? err.message : "Failed to send notification");
    } finally {
      setSending(false);
    }
  };

  const getTypeBadgeColor = (type: string) => {
    const map: Record<string, string> = {
      TASK_COMPLETION: "bg-green-100 text-green-800",
      ADMIN_ANNOUNCEMENT: "bg-blue-100 text-blue-800",
      SYSTEM_ALERT: "bg-red-100 text-red-800",
      APPLICATION_UPDATE: "bg-purple-100 text-purple-800",
      GENERAL: "bg-gray-100 text-gray-700",
    };
    return map[type] || "bg-gray-100 text-gray-700";
  };

  return (
    <div className="p-4 space-y-6 bg-gray-100 min-h-screen relative">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold" style={{ color: "#2C3539" }}>
          Communications
        </h1>
        <Button
          onClick={() => setShowHistory(true)}
          className="flex items-center gap-2 text-sm font-semibold"
          style={{ backgroundColor: "#2C3539", color: "white" }}
        >
          <History className="h-4 w-4" />
          History
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
          <p className="font-medium">Error</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Success Alert */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded">
          <p className="font-medium">Success</p>
          <p className="text-sm">{successMessage}</p>
        </div>
      )}

      {/* Filter Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <Input
          placeholder="Filter by Student Name"
          value={filters.name}
          onChange={(e) => setFilters({ ...filters, name: e.target.value })}
          className="bg-white shadow-md"
        />
        <Input
          placeholder="Filter by Email"
          value={filters.email}
          onChange={(e) => setFilters({ ...filters, email: e.target.value })}
          className="bg-white shadow-md"
        />
        <Select
          value={filters.status === "" ? "all" : filters.status}
          onValueChange={(value) =>
            setFilters({ ...filters, status: value === "all" ? "" : value })
          }
        >
          <SelectTrigger className="bg-white">
            <SelectValue placeholder="Filter by Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {uniqueStatuses.map((status) => (
              <SelectItem key={status} value={status}>
                {status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        {loading ? (
          <div className="p-8 text-center text-gray-500">
            Loading students...
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <Checkbox
                    checked={selectAllState}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>Student Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>User Type</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-gray-500">
                    {students.length === 0
                      ? "No students available"
                      : "No students found matching filters"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredStudents.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedStudents.includes(student.id)}
                        onCheckedChange={(checked) =>
                          handleSelect(student.id, checked as boolean)
                        }
                      />
                    </TableCell>
                    <TableCell className="font-medium">{student.name}</TableCell>
                    <TableCell>{student.email}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {student.userType}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          student.status === "ACTIVE"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {student.status}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Selected Students Count */}
      {selectedStudents.length > 0 && (
        <div className="text-sm text-gray-600 bg-blue-50 px-4 py-2 rounded">
          {selectedStudents.length} student{selectedStudents.length !== 1 ? "s" : ""}{" "}
          selected
        </div>
      )}

      {/* Notification Form */}
      <div className="space-y-4 bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold text-gray-900">
          Create Notification
        </h2>

        {/* Notification Type */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">
            Notification Type
          </Label>
          <Select value={notificationType} onValueChange={setNotificationType}>
            <SelectTrigger className="bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ADMIN_ANNOUNCEMENT">Admin Announcement</SelectItem>
              <SelectItem value="SYSTEM_ALERT">System Alert</SelectItem>
              <SelectItem value="APPLICATION_UPDATE">Application Update</SelectItem>
              <SelectItem value="GENERAL">General</SelectItem>
            </SelectContent>
          </Select>
        </div>

        

        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="title" className="text-sm font-medium text-gray-700">
            Notification Title <span className="text-red-500">*</span>
          </Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter notification title..."
            className="bg-white shadow-md"
          />
        </div>

        {/* Content */}
        <div className="space-y-2">
          <Label htmlFor="content" className="text-sm font-medium text-gray-700">
            Notification Content <span className="text-red-500">*</span>
          </Label>
          <Textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Enter notification content..."
            className="bg-white shadow-md min-h-[120px]"
          />
        </div>

        {/* Action URL (Optional) */}
        <div className="space-y-2">
          <Label htmlFor="actionUrl" className="text-sm font-medium text-gray-700">
            Action URL (Optional)
          </Label>
          <Input
            id="actionUrl"
            value={actionUrl}
            onChange={(e) => setActionUrl(e.target.value)}
            placeholder="/applications/123"
            className="bg-white shadow-md"
          />
          <p className="text-xs text-gray-500">
            Optional link for users to take action (e.g., view application)
          </p>
        </div>

        {/* Send Button */}
        <Button
          onClick={sendNotification}
          disabled={
            selectedStudents.length === 0 ||
            !title.trim() ||
            !content.trim() ||
            sending ||
            loading
          }
          style={{ backgroundColor: "#E08D3C", color: "white" }}
          className="w-full hover:opacity-90 disabled:opacity-50"
        >
          {sending
            ? "Sending..."
            : `Send Notification to ${selectedStudents.length} Selected Student${
                selectedStudents.length !== 1 ? "s" : ""
              }`}
        </Button>
      </div>

      {/* History Slide-Over Panel */}
      {showHistory && createPortal(
        <>
          {/* Backdrop */}
          <div
             className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99998]"
            onClick={() => setShowHistory(false)}
          />
          {/* Panel */}
                    <div className="fixed top-0 right-0 h-full w-full max-w-lg bg-white shadow-2xl z-[99999] flex flex-col">
            {/* Panel Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200" style={{ backgroundColor: "#2C3539" }}>
              <div className="flex items-center gap-3">
                <Bell className="h-5 w-5 text-white" />
                <div>
                  <h2 className="text-lg font-semibold text-white">Sent Notifications</h2>
                  <p className="text-xs text-gray-300">{totalCount} total notifications sent</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={fetchSentNotifications}
                  disabled={historyLoading}
                  className="p-2 rounded-lg hover:bg-white/20 text-white transition-colors"
                  title="Refresh"
                >
                  <RefreshCw className={`h-4 w-4 ${historyLoading ? 'animate-spin' : ''}`} />
                </button>
                <button
                  onClick={() => setShowHistory(false)}
                  className="p-2 rounded-lg hover:bg-white/20 text-white transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Panel Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
              {historyLoading ? (
                <div className="flex flex-col items-center justify-center h-64 gap-3 text-gray-500">
                  <RefreshCw className="h-8 w-8 animate-spin text-orange-400" />
                  <p className="text-sm">Loading notification history...</p>
                </div>
              ) : historyError ? (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-sm">
                  <p className="font-medium">Failed to load history</p>
                  <p className="mt-1">{historyError}</p>
                  <button
                    onClick={fetchSentNotifications}
                    className="mt-2 text-red-600 underline text-xs"
                  >
                    Try again
                  </button>
                </div>
              ) : sentNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 gap-3 text-gray-400">
                  <Bell className="h-12 w-12 opacity-30" />
                  <p className="text-sm font-medium">No notifications sent yet</p>
                </div>
              ) : (
                sentNotifications.map((n) => (
                  <div
                    key={n.id}
                    className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <p className="text-sm font-semibold text-gray-900 leading-snug flex-1">{n.title}</p>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${getTypeBadgeColor(n.type)}`}>
                        {n.type.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mb-3 leading-relaxed">{n.message}</p>
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 inline-block"/>
                          Recipient #{n.userId}
                        </span>
                        {n.status === 'UNREAD' ? (
                          <span className="flex items-center gap-1 text-amber-600">
                            <Clock className="h-3 w-3" />
                            Unread
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-green-600">
                            <CheckCircle className="h-3 w-3" />
                            {n.status}
                          </span>
                        )}
                      </div>
                      <span className="text-gray-400">
                        {new Date(n.createdAt).toLocaleString('en-IN', {
                          day: '2-digit', month: 'short', year: 'numeric',
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </span>
                    </div>
                    {n.metadata?.stageName && (
                      <div className="mt-2 pt-2 border-t border-gray-100 text-xs text-gray-400">
                        Stage: <span className="font-medium text-gray-600">{n.metadata.stageName.replace(/_/g, ' ')}</span>
                        {n.metadata?.applicationId && (
                          <span className="ml-3">App: <span className="font-medium text-gray-600 font-mono">{(n.metadata.applicationId as string).slice(0, 8)}…</span></span>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      , document.body)}
    </div>
  );
};

export default Communications;