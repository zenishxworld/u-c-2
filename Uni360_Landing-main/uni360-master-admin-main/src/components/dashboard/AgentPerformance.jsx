import React from "react";
import { motion } from "framer-motion";
import { TrophyIcon, ChartBarIcon } from "@heroicons/react/24/outline";

const AgentPerformance = ({ data, loading }) => {
  if (loading) {
    return (
      <div className="card">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-40 mb-6"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-32"></div>
                </div>
                <div className="w-16 h-8 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <h3 className="text-base md:text-lg font-semibold text-gray-900">
          Agent Performance Leaderboard
        </h3>
        <TrophyIcon className="h-5 w-5 md:h-6 md:w-6 text-yellow-500" />
      </div>

      <div className="space-y-3 md:space-y-4">
        {data?.map((agent, index) => (
          <motion.div
            key={agent.name}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center p-3 md:p-4 rounded-lg border border-gray-100 hover:border-primary-200 hover:bg-primary-50 transition-all duration-200">
            <div className="flex-shrink-0">
              <div
                className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                  index === 0
                    ? "bg-yellow-500"
                    : index === 1
                    ? "bg-gray-400"
                    : index === 2
                    ? "bg-orange-500"
                    : "bg-gray-300"
                }`}>
                {index + 1}
              </div>
            </div>

            <div className="ml-3 md:ml-4 flex-1 min-w-0">
              <div className="flex items-center">
                <h4 className="font-medium text-gray-900 text-sm md:text-base truncate">
                  {agent.name}
                </h4>
                {index === 0 && (
                  <TrophyIcon className="h-3 w-3 md:h-4 md:w-4 text-yellow-500 ml-1 md:ml-2 flex-shrink-0" />
                )}
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 text-xs md:text-sm text-gray-600 mt-1">
                <span>{agent.applications} applications</span>
                <span className="hidden sm:inline">•</span>
                <span>{agent.conversions} conversions</span>
              </div>
            </div>

            <div className="text-right flex-shrink-0">
              <div className="text-sm md:text-lg font-bold text-gray-900">
                £{agent.revenue.toLocaleString()}
              </div>
              <div className="text-xs md:text-sm text-gray-600">
                {((agent.conversions / agent.applications) * 100).toFixed(1)}%
                rate
              </div>
            </div>
          </motion.div>
        )) || (
          <div className="text-center py-8 text-gray-500">
            No agent data available
          </div>
        )}
      </div>

      <div className="mt-4 md:mt-6 pt-3 md:pt-4 border-t border-gray-200">
        <button className="flex items-center text-primary-600 hover:text-primary-700 text-xs md:text-sm font-medium">
          <ChartBarIcon className="h-3 w-3 md:h-4 md:w-4 mr-1" />
          View Detailed Report
        </button>
      </div>
    </div>
  );
};

export default AgentPerformance;
