import React from "react";
import { motion } from "framer-motion";
import { BellIcon, CheckIcon } from "@heroicons/react/24/outline";

const NotificationsPanel = ({ notifications, loading }) => {
  if (loading) {
    return (
      <div className="card">
        <div className="animate-pulse">
          <div className="h-4 sm:h-6 bg-gray-200 rounded w-24 sm:w-32 mb-3 sm:mb-4"></div>
          <div className="space-y-3 sm:space-y-4">
            {[...Array(3)].map((_, index) => (
              <div
                key={index}
                className="border-l-4 border-gray-200 pl-3 sm:pl-4">
                <div className="h-3 sm:h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-2 sm:h-3 bg-gray-200 rounded w-16 sm:w-20"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3 sm:mb-4 lg:mb-6">
        <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900">
          Latest Notifications
        </h3>
        <BellIcon className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-gray-400 flex-shrink-0" />
      </div>

      <div className="space-y-2 sm:space-y-3 lg:space-y-4 max-h-40 sm:max-h-48 lg:max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300">
        {notifications?.length > 0 ? (
          notifications.map((notification, index) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`border-l-4 pl-2 sm:pl-3 lg:pl-4 py-1.5 sm:py-2 ${
                notification.read ? "border-gray-300" : "border-primary-500"
              }`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-xs sm:text-sm ${
                      notification.read
                        ? "text-gray-600"
                        : "text-gray-900 font-medium"
                    } leading-relaxed break-words`}>
                    {notification.message}
                  </p>
                  <p className="text-xs text-gray-500 mt-1 whitespace-nowrap">
                    {notification.time}
                  </p>
                </div>
                {notification.read && (
                  <CheckIcon className="h-3 w-3 md:h-4 md:w-4 text-green-500 flex-shrink-0" />
                )}
              </div>
            </motion.div>
          ))
        ) : (
          <div className="text-center py-6 md:py-8 text-gray-500">
            <BellIcon className="h-8 w-8 md:h-12 md:w-12 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">No notifications</p>
          </div>
        )}
      </div>

      {notifications?.length > 0 && (
        <div className="mt-4 md:mt-6 pt-3 md:pt-4 border-t border-gray-200">
          <button className="text-primary-600 hover:text-primary-700 text-xs md:text-sm font-medium w-full text-left sm:text-center hover:underline transition-colors">
            View All Notifications
          </button>
        </div>
      )}
    </div>
  );
};

export default NotificationsPanel;
