import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  payments: [],
  filteredPayments: [],
  loading: false,
  error: null,
  summary: {
    totalPayments: 0,
    completedPayments: 0,
    pendingPayments: 0,
    failedPayments: 0,
    totalAmount: 0,
  },
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    pageSize: 10,
  },
  filters: {
    status: "", // pending, completed, failed
    type: "", // application_fee, service_fee, tuition
    student: "",
    dateFrom: "",
    dateTo: "",
    searchTerm: "",
  },
};

const paymentsSlice = createSlice({
  name: "payments",
  initialState,
  reducers: {
    fetchPaymentsStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchPaymentsSuccess: (state, action) => {
      state.loading = false;
      state.payments = action.payload.payments;
      state.filteredPayments = action.payload.payments;
      state.summary = action.payload.summary;
      state.pagination = action.payload.pagination;
    },
    fetchPaymentsFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    updatePaymentStatus: (state, action) => {
      const { id, status, notes } = action.payload;
      const index = state.payments.findIndex((payment) => payment.id === id);
      if (index !== -1) {
        state.payments[index].status = status;
        if (notes) {
          state.payments[index].notes = notes;
        }
        state.payments[index].lastUpdated = new Date().toISOString();
      }
    },
    addPayment: (state, action) => {
      state.payments.unshift(action.payload);
      state.filteredPayments.unshift(action.payload);
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    applyFilters: (state) => {
      let filtered = state.payments;

      if (state.filters.status) {
        filtered = filtered.filter(
          (payment) => payment.status === state.filters.status
        );
      }

      if (state.filters.type) {
        filtered = filtered.filter(
          (payment) => payment.type === state.filters.type
        );
      }

      if (state.filters.student) {
        filtered = filtered.filter(
          (payment) => payment.studentId === state.filters.student
        );
      }

      if (state.filters.searchTerm) {
        const searchTerm = state.filters.searchTerm.toLowerCase();
        filtered = filtered.filter(
          (payment) =>
            payment.studentName?.toLowerCase().includes(searchTerm) ||
            payment.transactionId?.toLowerCase().includes(searchTerm) ||
            payment.description?.toLowerCase().includes(searchTerm)
        );
      }

      if (state.filters.dateFrom) {
        filtered = filtered.filter(
          (payment) =>
            new Date(payment.createdDate) >= new Date(state.filters.dateFrom)
        );
      }

      if (state.filters.dateTo) {
        filtered = filtered.filter(
          (payment) =>
            new Date(payment.createdDate) <= new Date(state.filters.dateTo)
        );
      }

      state.filteredPayments = filtered;
    },
    clearFilters: (state) => {
      state.filters = {
        status: "",
        type: "",
        student: "",
        dateFrom: "",
        dateTo: "",
        searchTerm: "",
      };
      state.filteredPayments = state.payments;
    },
  },
});

export const {
  fetchPaymentsStart,
  fetchPaymentsSuccess,
  fetchPaymentsFailure,
  updatePaymentStatus,
  addPayment,
  setFilters,
  applyFilters,
  clearFilters,
} = paymentsSlice.actions;

export default paymentsSlice.reducer;
