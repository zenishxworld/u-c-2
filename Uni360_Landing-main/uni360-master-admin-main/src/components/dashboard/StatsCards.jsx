import React from "react";
import { motion } from "framer-motion";
import {
  UsersIcon,
  DocumentTextIcon,
  AcademicCapIcon,
  BanknotesIcon,
} from "@heroicons/react/24/outline";

const StatsCards = ({ stats, loading }) => {
  const statsData = [
    {
      name: "Total Students",
      value: stats?.totalStudents || 0,
      icon: UsersIcon,
      color: "bg-primary-500",
      bgColor: "bg-primary-50",
      textColor: "text-blue-600",
    },
    {
      name: "Active Applications",
      value: stats?.totalApplications || 0,
      icon: DocumentTextIcon,
      color: "bg-green-500",
      bgColor: "bg-green-50",
      textColor: "text-green-600",
    },
    {
      name: "Partner Universities",
      value: stats?.totalUniversities || 0,
      icon: AcademicCapIcon,
      color: "bg-primary-500",
      bgColor: "bg-primary-50",
      textColor: "text-primary-600",
    },
    {
      name: "Total Revenue",
      value: `£${(stats?.totalRevenue || 0).toLocaleString()}`,
      icon: BanknotesIcon,
      color: "bg-primary-500",
      bgColor: "bg-primary-50",
      textColor: "text-primary-600",
    },
  ];

  const cardVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        {[...Array(4)].map((_, index) => (
          <div key={index} className="card animate-pulse">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="h-3 sm:h-4 bg-gray-200 rounded w-20 sm:w-24 mb-2"></div>
                <div className="h-6 sm:h-8 bg-gray-200 rounded w-12 sm:w-16"></div>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-200 rounded-lg flex-shrink-0"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
      {statsData.map((stat, index) => (
        <motion.div
          key={stat.name}
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: index * 0.1 }}
          className="card hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1 truncate">
                {stat.name}
              </p>
              <p className="text-lg sm:text-2xl lg:text-3xl font-bold text-gray-900 truncate">
                {stat.value}
              </p>
            </div>
            <div
              className={`p-2 sm:p-3 rounded-lg ${stat.bgColor} flex-shrink-0 ml-2 sm:ml-3`}>
              <stat.icon
                className={`h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 ${stat.textColor}`}
              />
            </div>
          </div>
          <div className="mt-2 sm:mt-3 lg:mt-4">
            <div className="flex items-center">
              <div className="flex-1">
                <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2">
                  <motion.div
                    className={`h-1.5 sm:h-2 rounded-full ${stat.color}`}
                    initial={{ width: 0 }}
                    animate={{ width: "75%" }}
                    transition={{ delay: 0.5 + index * 0.1, duration: 0.8 }}
                  />
                </div>
              </div>
              <span className="ml-2 text-xs sm:text-sm text-green-600 font-medium">
                +12%
              </span>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default StatsCards;
