import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  applications: [],
  filteredApplications: [],
  selectedApplication: null,
  loading: false,
  error: null,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    pageSize: 10,
  },
  filters: {
    university: "",
    status: "",
    agent: "",
    student: "",
    country: "",
    searchTerm: "",
    dateFrom: "",
    dateTo: "",
  },
};

const applicationsSlice = createSlice({
  name: "applications",
  initialState,
  reducers: {
    fetchApplicationsStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchApplicationsSuccess: (state, action) => {
      state.loading = false;
      state.applications = action.payload.applications;
      state.filteredApplications = action.payload.applications;
      state.pagination = action.payload.pagination;
    },
    fetchApplicationsFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    setSelectedApplication: (state, action) => {
      state.selectedApplication = action.payload;
    },
    updateApplicationStatus: (state, action) => {
      const { id, status, notes } = action.payload;
      const index = state.applications.findIndex((app) => app.id === id);
      if (index !== -1) {
        state.applications[index].status = status;
        if (notes) {
          state.applications[index].notes = notes;
        }
        state.applications[index].lastUpdated = new Date().toISOString();
      }
    },
    addApplication: (state, action) => {
      state.applications.unshift(action.payload);
      state.filteredApplications.unshift(action.payload);
    },
    deleteApplication: (state, action) => {
      state.applications = state.applications.filter(
        (app) => app.id !== action.payload
      );
      state.filteredApplications = state.filteredApplications.filter(
        (app) => app.id !== action.payload
      );
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    applyFilters: (state) => {
      let filtered = state.applications;

      if (state.filters.university) {
        filtered = filtered.filter(
          (app) => app.universityId === state.filters.university
        );
      }

      if (state.filters.status) {
        filtered = filtered.filter(
          (app) => app.status === state.filters.status
        );
      }

      if (state.filters.agent) {
        filtered = filtered.filter(
          (app) => app.agentId === state.filters.agent
        );
      }

      if (state.filters.student) {
        filtered = filtered.filter(
          (app) => app.studentId === state.filters.student
        );
      }

      if (state.filters.country) {
        filtered = filtered.filter(
          (app) => app.country === state.filters.country
        );
      }

      if (state.filters.searchTerm) {
        const searchTerm = state.filters.searchTerm.toLowerCase();
        filtered = filtered.filter(
          (app) =>
            app.studentName?.toLowerCase().includes(searchTerm) ||
            app.universityName?.toLowerCase().includes(searchTerm) ||
            app.applicationId?.toLowerCase().includes(searchTerm)
        );
      }

      if (state.filters.dateFrom) {
        filtered = filtered.filter(
          (app) =>
            new Date(app.submittedDate) >= new Date(state.filters.dateFrom)
        );
      }

      if (state.filters.dateTo) {
        filtered = filtered.filter(
          (app) => new Date(app.submittedDate) <= new Date(state.filters.dateTo)
        );
      }

      state.filteredApplications = filtered;
    },
    clearFilters: (state) => {
      state.filters = {
        university: "",
        status: "",
        agent: "",
        student: "",
        country: "",
        searchTerm: "",
        dateFrom: "",
        dateTo: "",
      };
      state.filteredApplications = state.applications;
    },
  },
});

export const {
  fetchApplicationsStart,
  fetchApplicationsSuccess,
  fetchApplicationsFailure,
  setSelectedApplication,
  updateApplicationStatus,
  addApplication,
  deleteApplication,
  setFilters,
  applyFilters,
  clearFilters,
} = applicationsSlice.actions;

export default applicationsSlice.reducer;
