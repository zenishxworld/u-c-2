import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  MagnifyingGlassIcon,
  UserIcon,
  DocumentTextIcon,
  AcademicCapIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

// Mock data for global search
const mockSearchData = {
  students: [
    { id: 1, name: "John Doe", email: "john.doe@example.com", type: "student" },
    {
      id: 2,
      name: "Jane Smith",
      email: "jane.smith@example.com",
      type: "student",
    },
    {
      id: 3,
      name: "Alice Johnson",
      email: "alice.johnson@example.com",
      type: "student",
    },
    {
      id: 4,
      name: "Bob Wilson",
      email: "bob.wilson@example.com",
      type: "student",
    },
  ],
  applications: [
    {
      id: 1,
      studentName: "John Doe",
      university: "University of Manchester",
      program: "Computer Science MSc",
      type: "application",
    },
    {
      id: 2,
      studentName: "Jane Smith",
      university: "Imperial College London",
      program: "Data Science MSc",
      type: "application",
    },
    {
      id: 3,
      studentName: "Alice Johnson",
      university: "University of Edinburgh",
      program: "Business MBA",
      type: "application",
    },
    {
      id: 4,
      studentName: "Bob Wilson",
      university: "Technical University of Munich",
      program: "Engineering PhD",
      type: "application",
    },
  ],
  universities: [
    {
      id: 1,
      name: "University of Manchester",
      country: "United Kingdom",
      type: "university",
    },
    {
      id: 2,
      name: "Imperial College London",
      country: "United Kingdom",
      type: "university",
    },
    {
      id: 3,
      name: "University of Edinburgh",
      country: "United Kingdom",
      type: "university",
    },
    {
      id: 4,
      name: "Technical University of Munich",
      country: "Germany",
      type: "university",
    },
  ],
};

const GlobalSearch = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const searchInputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }

    setIsLoading(true);

    // Simulate API delay
    const searchTimeout = setTimeout(() => {
      const searchQuery = query.toLowerCase();
      const searchResults = [];

      // Search students
      mockSearchData.students.forEach((student) => {
        if (
          student.name.toLowerCase().includes(searchQuery) ||
          student.email.toLowerCase().includes(searchQuery)
        ) {
          searchResults.push(student);
        }
      });

      // Search applications
      mockSearchData.applications.forEach((application) => {
        if (
          application.studentName.toLowerCase().includes(searchQuery) ||
          application.university.toLowerCase().includes(searchQuery) ||
          application.program.toLowerCase().includes(searchQuery)
        ) {
          searchResults.push(application);
        }
      });

      // Search universities
      mockSearchData.universities.forEach((university) => {
        if (
          university.name.toLowerCase().includes(searchQuery) ||
          university.country.toLowerCase().includes(searchQuery)
        ) {
          searchResults.push(university);
        }
      });

      setResults(searchResults.slice(0, 10)); // Limit to 10 results
      setIsLoading(false);
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [query]);

  const handleResultClick = (result) => {
    switch (result.type) {
      case "student":
        navigate(`/users/${result.id}`);
        break;
      case "application":
        navigate(`/applications/${result.id}`);
        break;
      case "university":
        navigate(`/universities`);
        break;
      default:
        break;
    }
    onClose();
  };

  const getResultIcon = (type) => {
    switch (type) {
      case "student":
        return <UserIcon className="h-5 w-5 text-blue-500" />;
      case "application":
        return <DocumentTextIcon className="h-5 w-5 text-green-500" />;
      case "university":
        return <AcademicCapIcon className="h-5 w-5 text-primary-500" />;
      default:
        return <MagnifyingGlassIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getResultTitle = (result) => {
    switch (result.type) {
      case "student":
        return result.name;
      case "application":
        return `${result.studentName} - ${result.university}`;
      case "university":
        return result.name;
      default:
        return "";
    }
  };

  const getResultSubtitle = (result) => {
    switch (result.type) {
      case "student":
        return result.email;
      case "application":
        return result.program;
      case "university":
        return result.country;
      default:
        return "";
    }
  };

  const getResultTypeLabel = (type) => {
    switch (type) {
      case "student":
        return "Student";
      case "application":
        return "Application";
      case "university":
        return "University";
      default:
        return "";
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center pt-4 sm:pt-20 px-2 sm:px-4"
        onClick={onClose}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
          className="bg-white/95 backdrop-blur-lg rounded-lg sm:rounded-xl shadow-2xl border border-gray-200/50 max-w-sm sm:max-w-lg w-full max-h-[50vh] sm:max-h-80 overflow-hidden"
          onClick={(e) => e.stopPropagation()}>
          {/* Search Input */}
          <div className="border-b border-gray-100/80 p-2 sm:p-3">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-md sm:rounded-lg opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 blur-sm"></div>
              <div className="relative bg-gray-50/80 rounded-md sm:rounded-lg border border-gray-200/50 group-focus-within:border-blue-300/50 group-focus-within:bg-white/90 transition-all duration-300 group-focus-within:shadow-md">
                <MagnifyingGlassIcon className="absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-300" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search students, applications..."
                  className="w-full pl-8 sm:pl-9 pr-8 sm:pr-9 py-2 sm:py-2.5 border-0 bg-transparent text-sm font-medium text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-0 rounded-md sm:rounded-lg"
                />
                <button
                  onClick={onClose}
                  className="absolute right-2 sm:right-2.5 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-all duration-200">
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Search Results */}
          <div className="max-h-48 sm:max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
            {isLoading ? (
              <div className="p-3 sm:p-4 text-center">
                <div className="inline-block animate-spin rounded-full h-4 sm:h-5 w-4 sm:w-5 border-2 border-blue-600 border-t-transparent"></div>
                <p className="mt-2 text-xs font-medium text-gray-600">Searching...</p>
              </div>
            ) : results.length > 0 ? (
              <div className="divide-y divide-gray-100/80">
                {results.map((result, index) => (
                  <motion.button
                    key={`${result.type}-${result.id}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    onClick={() => handleResultClick(result)}
                    className="w-full text-left p-2.5 sm:p-3 hover:bg-gradient-to-r hover:from-blue-50/80 hover:to-purple-50/80 focus:bg-gradient-to-r focus:from-blue-50/80 focus:to-purple-50/80 focus:outline-none transition-all duration-200 group">
                    <div className="flex items-center space-x-2.5 sm:space-x-3">
                      <div className="flex-shrink-0 p-1 sm:p-1.5 rounded-md bg-white shadow-sm group-hover:shadow-md transition-shadow duration-200">
                        {getResultIcon(result.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-xs sm:text-sm font-semibold text-gray-900 truncate group-hover:text-gray-800">
                            {getResultTitle(result)}
                          </p>
                          <span className="ml-1.5 sm:ml-2 inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 shadow-sm">
                            {getResultTypeLabel(result.type)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 truncate mt-0.5">
                          {getResultSubtitle(result)}
                        </p>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            ) : query.trim().length >= 2 ? (
              <div className="p-3 sm:p-4 text-center">
                <div className="mx-auto h-8 sm:h-10 w-8 sm:w-10 rounded-full bg-gray-100 flex items-center justify-center mb-2">
                  <MagnifyingGlassIcon className="h-4 sm:h-5 w-4 sm:w-5 text-gray-400" />
                </div>
                <p className="text-xs sm:text-sm font-medium text-gray-900">No results found</p>
                <p className="text-xs text-gray-500 mt-1">
                  Try different search terms
                </p>
              </div>
            ) : (
              <div className="p-3 sm:p-4 text-center">
                <div className="mx-auto h-8 sm:h-10 w-8 sm:w-10 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center mb-2">
                  <MagnifyingGlassIcon className="h-4 sm:h-5 w-4 sm:w-5 text-blue-500" />
                </div>
                <p className="text-xs sm:text-sm font-medium text-gray-900">Start searching</p>
                <p className="text-xs text-gray-500 mt-1">
                  Type 2+ characters
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default GlobalSearch;