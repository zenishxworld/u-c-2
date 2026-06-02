import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  UserIcon,
  BuildingOfficeIcon,
  DocumentIcon,
  PaperAirplaneIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";

const AdminRequestForm = ({ onSubmit, loading = false }) => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    organization: "",
    position: "",
    experience: "",
    requestType: "",
    bio: "",
    specialization: "",
    languages: "",
    preferredRole: "",
    availability: "",
    expectedSalary: "",
    region: "",
    businessModel: "",
    currentStudents: "",
  });

  const [documents, setDocuments] = useState([]);
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    const newDocuments = files.map((file) => ({
      type: e.target.dataset.docType,
      name: file.name,
      file: file,
      url: URL.createObjectURL(file),
    }));

    setDocuments((prev) => [...prev, ...newDocuments]);
  };

  const removeDocument = (index) => {
    setDocuments((prev) => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    const newErrors = {};

    // Required fields
    if (!formData.firstName.trim())
      newErrors.firstName = "First name is required";
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    if (!formData.phone.trim()) newErrors.phone = "Phone is required";
    if (!formData.organization.trim())
      newErrors.organization = "Organization is required";
    if (!formData.position.trim()) newErrors.position = "Position is required";
    if (!formData.experience.trim())
      newErrors.experience = "Experience is required";
    if (!formData.requestType)
      newErrors.requestType = "Request type is required";
    if (!formData.bio.trim()) newErrors.bio = "Bio is required";
    if (!formData.specialization.trim())
      newErrors.specialization = "Specialization is required";
    if (!formData.languages.trim())
      newErrors.languages = "Languages are required";

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    // Request type specific validations
    if (formData.requestType === "team_member") {
      if (!formData.preferredRole.trim())
        newErrors.preferredRole = "Preferred role is required";
      if (!formData.availability)
        newErrors.availability = "Availability is required";
      if (!formData.expectedSalary.trim())
        newErrors.expectedSalary = "Expected salary is required";
    }

    if (formData.requestType === "external_admin") {
      if (!formData.region.trim()) newErrors.region = "Region is required";
      if (!formData.businessModel.trim())
        newErrors.businessModel = "Business model is required";
      if (!formData.currentStudents.trim())
        newErrors.currentStudents = "Current students info is required";
    }

    // Document validation
    if (documents.length === 0) {
      newErrors.documents = "At least one document (CV) is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      const requestData = {
        ...formData,
        languages: formData.languages.split(",").map((lang) => lang.trim()),
        documents: documents.map((doc) => ({
          type: doc.type,
          name: doc.name,
          // In real implementation, you'd upload files to server and get URLs
          url: `/uploads/${doc.name}`,
        })),
      };

      await onSubmit(requestData);
      setSubmitted(true);
    } catch (error) {
    }
  };

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md mx-auto text-center py-12">
        <CheckCircleIcon className="h-16 w-16 text-green-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Request Submitted!
        </h2>
        <p className="text-gray-600">
          Your admin request has been submitted successfully. You will receive a
          response within 2-3 business days.
        </p>
      </motion.div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white shadow-lg rounded-lg p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Admin Registration Request
          </h1>
          <p className="text-gray-600">
            Apply to join our team as an admin. Please fill out all required
            information.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Personal Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}>
            <div className="flex items-center mb-4">
              <UserIcon className="h-6 w-6 text-blue-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">
                Personal Information
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className={`w-full border rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.firstName ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {errors.firstName && (
                  <p className="text-red-500 text-sm mt-1 flex items-center">
                    <ExclamationCircleIcon className="h-4 w-4 mr-1" />
                    {errors.firstName}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className={`w-full border rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.lastName ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {errors.lastName && (
                  <p className="text-red-500 text-sm mt-1 flex items-center">
                    <ExclamationCircleIcon className="h-4 w-4 mr-1" />
                    {errors.lastName}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full border rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.email ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1 flex items-center">
                    <ExclamationCircleIcon className="h-4 w-4 mr-1" />
                    {errors.email}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className={`w-full border rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.phone ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {errors.phone && (
                  <p className="text-red-500 text-sm mt-1 flex items-center">
                    <ExclamationCircleIcon className="h-4 w-4 mr-1" />
                    {errors.phone}
                  </p>
                )}
              </div>
            </div>
          </motion.div>

          {/* Organization Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}>
            <div className="flex items-center mb-4">
              <BuildingOfficeIcon className="h-6 w-6 text-blue-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">
                Organization Information
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Organization <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="organization"
                  value={formData.organization}
                  onChange={handleInputChange}
                  className={`w-full border rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.organization ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {errors.organization && (
                  <p className="text-red-500 text-sm mt-1 flex items-center">
                    <ExclamationCircleIcon className="h-4 w-4 mr-1" />
                    {errors.organization}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Position <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="position"
                  value={formData.position}
                  onChange={handleInputChange}
                  className={`w-full border rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.position ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {errors.position && (
                  <p className="text-red-500 text-sm mt-1 flex items-center">
                    <ExclamationCircleIcon className="h-4 w-4 mr-1" />
                    {errors.position}
                  </p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Experience <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="experience"
                  placeholder="e.g., 5 years"
                  value={formData.experience}
                  onChange={handleInputChange}
                  className={`w-full border rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.experience ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {errors.experience && (
                  <p className="text-red-500 text-sm mt-1 flex items-center">
                    <ExclamationCircleIcon className="h-4 w-4 mr-1" />
                    {errors.experience}
                  </p>
                )}
              </div>
            </div>
          </motion.div>

          {/* Request Type */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Request Type
            </h2>

            <div className="space-y-4">
              <label className="flex items-start">
                <input
                  type="radio"
                  name="requestType"
                  value="team_member"
                  checked={formData.requestType === "team_member"}
                  onChange={handleInputChange}
                  className="mt-1 mr-3"
                />
                <div>
                  <div className="font-medium">Team Member</div>
                  <div className="text-sm text-gray-600">
                    Join as an internal team member with full access and
                    employee benefits
                  </div>
                </div>
              </label>

              <label className="flex items-start">
                <input
                  type="radio"
                  name="requestType"
                  value="external_admin"
                  checked={formData.requestType === "external_admin"}
                  onChange={handleInputChange}
                  className="mt-1 mr-3"
                />
                <div>
                  <div className="font-medium">External Admin</div>
                  <div className="text-sm text-gray-600">
                    Partner with us as an external admin with commission-based
                    compensation
                  </div>
                </div>
              </label>
            </div>

            {errors.requestType && (
              <p className="text-red-500 text-sm mt-2 flex items-center">
                <ExclamationCircleIcon className="h-4 w-4 mr-1" />
                {errors.requestType}
              </p>
            )}
          </motion.div>

          {/* Conditional Fields Based on Request Type */}
          {formData.requestType === "team_member" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">
                Team Member Details
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Preferred Role <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="preferredRole"
                    value={formData.preferredRole}
                    onChange={handleInputChange}
                    className={`w-full border rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.preferredRole
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                  />
                  {errors.preferredRole && (
                    <p className="text-red-500 text-sm mt-1 flex items-center">
                      <ExclamationCircleIcon className="h-4 w-4 mr-1" />
                      {errors.preferredRole}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Availability <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="availability"
                    value={formData.availability}
                    onChange={handleInputChange}
                    className={`w-full border rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.availability ? "border-red-500" : "border-gray-300"
                    }`}>
                    <option value="">Select availability</option>
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Contract">Contract</option>
                  </select>
                  {errors.availability && (
                    <p className="text-red-500 text-sm mt-1 flex items-center">
                      <ExclamationCircleIcon className="h-4 w-4 mr-1" />
                      {errors.availability}
                    </p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expected Salary <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="expectedSalary"
                    placeholder="e.g., £40,000 - £50,000"
                    value={formData.expectedSalary}
                    onChange={handleInputChange}
                    className={`w-full border rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.expectedSalary
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                  />
                  {errors.expectedSalary && (
                    <p className="text-red-500 text-sm mt-1 flex items-center">
                      <ExclamationCircleIcon className="h-4 w-4 mr-1" />
                      {errors.expectedSalary}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {formData.requestType === "external_admin" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">
                External Admin Details
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Region <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="region"
                    placeholder="e.g., Middle East & North Africa"
                    value={formData.region}
                    onChange={handleInputChange}
                    className={`w-full border rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.region ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {errors.region && (
                    <p className="text-red-500 text-sm mt-1 flex items-center">
                      <ExclamationCircleIcon className="h-4 w-4 mr-1" />
                      {errors.region}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Business Model <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="businessModel"
                    placeholder="e.g., Commission-based partnership"
                    value={formData.businessModel}
                    onChange={handleInputChange}
                    className={`w-full border rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.businessModel
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                  />
                  {errors.businessModel && (
                    <p className="text-red-500 text-sm mt-1 flex items-center">
                      <ExclamationCircleIcon className="h-4 w-4 mr-1" />
                      {errors.businessModel}
                    </p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Current Students <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="currentStudents"
                    placeholder="e.g., 300+ active students"
                    value={formData.currentStudents}
                    onChange={handleInputChange}
                    className={`w-full border rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.currentStudents
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                  />
                  {errors.currentStudents && (
                    <p className="text-red-500 text-sm mt-1 flex items-center">
                      <ExclamationCircleIcon className="h-4 w-4 mr-1" />
                      {errors.currentStudents}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Professional Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Professional Details
            </h2>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bio <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="bio"
                  rows={4}
                  value={formData.bio}
                  onChange={handleInputChange}
                  placeholder="Tell us about your background and experience..."
                  className={`w-full border rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.bio ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {errors.bio && (
                  <p className="text-red-500 text-sm mt-1 flex items-center">
                    <ExclamationCircleIcon className="h-4 w-4 mr-1" />
                    {errors.bio}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Specialization <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="specialization"
                    placeholder="e.g., UK Universities, STEM Programs"
                    value={formData.specialization}
                    onChange={handleInputChange}
                    className={`w-full border rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.specialization
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                  />
                  {errors.specialization && (
                    <p className="text-red-500 text-sm mt-1 flex items-center">
                      <ExclamationCircleIcon className="h-4 w-4 mr-1" />
                      {errors.specialization}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Languages <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="languages"
                    placeholder="e.g., English, Spanish, French (comma separated)"
                    value={formData.languages}
                    onChange={handleInputChange}
                    className={`w-full border rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.languages ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {errors.languages && (
                    <p className="text-red-500 text-sm mt-1 flex items-center">
                      <ExclamationCircleIcon className="h-4 w-4 mr-1" />
                      {errors.languages}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Documents */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}>
            <div className="flex items-center mb-4">
              <DocumentIcon className="h-6 w-6 text-blue-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">Documents</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CV/Resume <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  data-doc-type="cv"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileUpload}
                  className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Qualifications/Certifications
                </label>
                <input
                  type="file"
                  data-doc-type="qualification"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileUpload}
                  className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {formData.requestType === "external_admin" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business License
                  </label>
                  <input
                    type="file"
                    data-doc-type="business_license"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileUpload}
                    className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              {documents.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Uploaded Documents:
                  </h4>
                  <div className="space-y-2">
                    {documents.map((doc, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-gray-50 p-2 rounded">
                        <span className="text-sm text-gray-900">
                          {doc.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeDocument(index)}
                          className="text-red-600 hover:text-red-800 text-sm">
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {errors.documents && (
                <p className="text-red-500 text-sm flex items-center">
                  <ExclamationCircleIcon className="h-4 w-4 mr-1" />
                  {errors.documents}
                </p>
              )}
            </div>
          </motion.div>

          {/* Submit Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="flex justify-end pt-6 border-t">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors">
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <PaperAirplaneIcon className="h-5 w-5 mr-2" />
                  Submit Request
                </>
              )}
            </button>
          </motion.div>
        </form>
      </div>
    </div>
  );
};

export default AdminRequestForm;
