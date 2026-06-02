import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  universities: [],
  filteredUniversities: [],
  selectedUniversity: null,
  loading: false,
  error: null,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    pageSize: 10,
  },
  filters: {
    country: "",
    tuitionFeeMin: "",
    tuitionFeeMax: "",
    type: "",
    searchTerm: "",
  },
};

const universitiesSlice = createSlice({
  name: "universities",
  initialState,
  reducers: {
    fetchUniversitiesStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchUniversitiesSuccess: (state, action) => {
      state.loading = false;
      state.universities = action.payload.universities;
      state.filteredUniversities = action.payload.universities;
      state.pagination = action.payload.pagination;
    },
    fetchUniversitiesFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    setSelectedUniversity: (state, action) => {
      state.selectedUniversity = action.payload;
    },
    updateUniversity: (state, action) => {
      const index = state.universities.findIndex(
        (uni) => uni.id === action.payload.id
      );
      if (index !== -1) {
        state.universities[index] = action.payload;
      }
    },
    addUniversity: (state, action) => {
      state.universities.unshift(action.payload);
      state.filteredUniversities.unshift(action.payload);
    },
    deleteUniversity: (state, action) => {
      state.universities = state.universities.filter(
        (uni) => uni.id !== action.payload
      );
      state.filteredUniversities = state.filteredUniversities.filter(
        (uni) => uni.id !== action.payload
      );
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    applyFilters: (state) => {
      let filtered = state.universities;

      if (state.filters.country) {
        filtered = filtered.filter(
          (uni) => uni.country === state.filters.country
        );
      }

      if (state.filters.type) {
        filtered = filtered.filter((uni) => uni.type === state.filters.type);
      }

      if (state.filters.tuitionFeeMin) {
        filtered = filtered.filter(
          (uni) => uni.tuitionFee >= parseInt(state.filters.tuitionFeeMin)
        );
      }

      if (state.filters.tuitionFeeMax) {
        filtered = filtered.filter(
          (uni) => uni.tuitionFee <= parseInt(state.filters.tuitionFeeMax)
        );
      }

      if (state.filters.searchTerm) {
        const searchTerm = state.filters.searchTerm.toLowerCase();
        filtered = filtered.filter(
          (uni) =>
            uni.name?.toLowerCase().includes(searchTerm) ||
            uni.location?.toLowerCase().includes(searchTerm)
        );
      }

      state.filteredUniversities = filtered;
    },
    clearFilters: (state) => {
      state.filters = {
        country: "",
        tuitionFeeMin: "",
        tuitionFeeMax: "",
        type: "",
        searchTerm: "",
      };
      state.filteredUniversities = state.universities;
    },
  },
});

export const {
  fetchUniversitiesStart,
  fetchUniversitiesSuccess,
  fetchUniversitiesFailure,
  setSelectedUniversity,
  updateUniversity,
  addUniversity,
  deleteUniversity,
  setFilters,
  applyFilters,
  clearFilters,
} = universitiesSlice.actions;

export default universitiesSlice.reducer;
