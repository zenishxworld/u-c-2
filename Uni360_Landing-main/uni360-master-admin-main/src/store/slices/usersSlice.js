import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  users: [],
  filteredUsers: [],
  selectedUser: null,
  loading: false,
  error: null,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    pageSize: 10,
  },
  filters: {
    role: "",
    status: "",
    country: "",
    searchTerm: "",
  },
};

const usersSlice = createSlice({
  name: "users",
  initialState,
  reducers: {
    fetchUsersStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchUsersSuccess: (state, action) => {
      state.loading = false;
      state.users = action.payload.users;
      state.filteredUsers = action.payload.users;
      state.pagination = action.payload.pagination;
    },
    fetchUsersFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    setSelectedUser: (state, action) => {
      state.selectedUser = action.payload;
    },
    updateUser: (state, action) => {
      const index = state.users.findIndex(
        (user) => user.id === action.payload.id
      );
      if (index !== -1) {
        state.users[index] = action.payload;
      }
    },
    addUser: (state, action) => {
      state.users.unshift(action.payload);
      state.filteredUsers.unshift(action.payload);
    },
    deleteUser: (state, action) => {
      state.users = state.users.filter((user) => user.id !== action.payload);
      state.filteredUsers = state.filteredUsers.filter(
        (user) => user.id !== action.payload
      );
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    applyFilters: (state) => {
      let filtered = state.users;

      if (state.filters.role) {
        filtered = filtered.filter((user) => user.role === state.filters.role);
      }

      if (state.filters.status) {
        filtered = filtered.filter(
          (user) => user.status === state.filters.status
        );
      }

      if (state.filters.country) {
        filtered = filtered.filter(
          (user) => user.country === state.filters.country
        );
      }

      if (state.filters.searchTerm) {
        const searchTerm = state.filters.searchTerm.toLowerCase();
        filtered = filtered.filter(
          (user) =>
            user.name?.toLowerCase().includes(searchTerm) ||
            user.email?.toLowerCase().includes(searchTerm) ||
            user.uuid?.toLowerCase().includes(searchTerm)
        );
      }

      state.filteredUsers = filtered;
    },
    clearFilters: (state) => {
      state.filters = {
        role: "",
        status: "",
        country: "",
        searchTerm: "",
      };
      state.filteredUsers = state.users;
    },
  },
});

export const {
  fetchUsersStart,
  fetchUsersSuccess,
  fetchUsersFailure,
  setSelectedUser,
  updateUser,
  addUser,
  deleteUser,
  setFilters,
  applyFilters,
  clearFilters,
} = usersSlice.actions;

export default usersSlice.reducer;
