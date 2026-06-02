import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  commissions: [],
  filteredCommissions: [],
  revenueReports: [],
  loading: false,
  error: null,
  summary: {
    totalCommissions: 0,
    pendingCommissions: 0,
    paidCommissions: 0,
    totalRevenue: 0,
  },
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    pageSize: 10,
  },
  filters: {
    university: "",
    agent: "",
    status: "", // pending, paid, cancelled
    dateFrom: "",
    dateTo: "",
    searchTerm: "",
  },
};

const commissionsSlice = createSlice({
  name: "commissions",
  initialState,
  reducers: {
    fetchCommissionsStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchCommissionsSuccess: (state, action) => {
      state.loading = false;
      state.commissions = action.payload.commissions;
      state.filteredCommissions = action.payload.commissions;
      state.summary = action.payload.summary;
      state.pagination = action.payload.pagination;
    },
    fetchCommissionsFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    updateCommissionStatus: (state, action) => {
      const { id, status, paidDate } = action.payload;
      const index = state.commissions.findIndex(
        (commission) => commission.id === id
      );
      if (index !== -1) {
        state.commissions[index].status = status;
        if (paidDate) {
          state.commissions[index].paidDate = paidDate;
        }
      }
    },
    addCommission: (state, action) => {
      state.commissions.unshift(action.payload);
      state.filteredCommissions.unshift(action.payload);
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    applyFilters: (state) => {
      let filtered = state.commissions;

      if (state.filters.university) {
        filtered = filtered.filter(
          (commission) => commission.universityId === state.filters.university
        );
      }

      if (state.filters.agent) {
        filtered = filtered.filter(
          (commission) => commission.agentId === state.filters.agent
        );
      }

      if (state.filters.status) {
        filtered = filtered.filter(
          (commission) => commission.status === state.filters.status
        );
      }

      if (state.filters.searchTerm) {
        const searchTerm = state.filters.searchTerm.toLowerCase();
        filtered = filtered.filter(
          (commission) =>
            commission.universityName?.toLowerCase().includes(searchTerm) ||
            commission.agentName?.toLowerCase().includes(searchTerm) ||
            commission.studentName?.toLowerCase().includes(searchTerm)
        );
      }

      if (state.filters.dateFrom) {
        filtered = filtered.filter(
          (commission) =>
            new Date(commission.createdDate) >= new Date(state.filters.dateFrom)
        );
      }

      if (state.filters.dateTo) {
        filtered = filtered.filter(
          (commission) =>
            new Date(commission.createdDate) <= new Date(state.filters.dateTo)
        );
      }

      state.filteredCommissions = filtered;
    },
    clearFilters: (state) => {
      state.filters = {
        university: "",
        agent: "",
        status: "",
        dateFrom: "",
        dateTo: "",
        searchTerm: "",
      };
      state.filteredCommissions = state.commissions;
    },
    fetchRevenueReports: (state, action) => {
      state.revenueReports = action.payload;
    },
  },
});

export const {
  fetchCommissionsStart,
  fetchCommissionsSuccess,
  fetchCommissionsFailure,
  updateCommissionStatus,
  addCommission,
  setFilters,
  applyFilters,
  clearFilters,
  fetchRevenueReports,
} = commissionsSlice.actions;

export default commissionsSlice.reducer;
