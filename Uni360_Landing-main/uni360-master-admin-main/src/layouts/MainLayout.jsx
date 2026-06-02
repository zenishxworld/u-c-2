import React, { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import Navbar from "../components/layout/Navbar";
import Sidebar from "../components/layout/Sidebar";
import ToastContainer from "../components/ToastContainer";
import { removeToast } from "../store/slices/toastSlice";

const MainLayout = () => {
  const dispatch = useDispatch();
  const { toasts } = useSelector((state) => state.toast);
  const { sidebarOpen } = useSelector((state) => state.ui);

  // Auto-remove toasts after their duration
  useEffect(() => {
    toasts.forEach((toast) => {
      const timer = setTimeout(() => {
        dispatch(removeToast(toast.id));
      }, toast.duration);

      return () => clearTimeout(timer);
    });
  }, [toasts, dispatch]);

  const handleCloseToast = (toastId) => {
    dispatch(removeToast(toastId));
  };

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      {/* Navbar */}
      <Navbar />

      <div className="flex overflow-x-hidden">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content */}
        <main className="flex-1 pt-16 lg:ml-64 transition-all duration-300 min-w-0">
          <div className="p-3 sm:p-4 lg:p-6 max-w-full">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onClose={handleCloseToast} />
    </div>
  );
};

export default MainLayout;
