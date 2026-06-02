import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as adminAPI from '../../services/adminService';

// Async thunks for API calls
export const fetchAdmins = createAsyncThunk(
  'adminRequests/fetchAdmins',
  async (params, { rejectWithValue }) => {
    try {
      const response = await adminAPI.fetchAdmins(params);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchAdminFilters = createAsyncThunk(
  'adminRequests/fetchAdminFilters',
  async (params, { rejectWithValue }) => {
    try {
      const response = await adminAPI.fetchAdminFilters(params);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchAdminPermissions = createAsyncThunk(
  'adminRequests/fetchAdminPermissions',
  async (adminUuid, { rejectWithValue }) => {
    try {
      const response = await adminAPI.fetchAdminPermissions(adminUuid);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const updateAdminPermissions = createAsyncThunk(
  'adminRequests/updateAdminPermissions',
  async ({ adminUuid, permissionsData }, { rejectWithValue }) => {
    try {
      const ipAddress = await adminAPI.getClientIP();
      const response = await adminAPI.updateAdminPermissions(adminUuid, {
        ...permissionsData,
        ipAddress
      });
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchAllPermissions = createAsyncThunk(
  'adminRequests/fetchAllPermissions',
  async (_, { rejectWithValue }) => {
    try {
      const response = await adminAPI.fetchAllPermissions();
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const initialState = {
  requests: [],
  filteredRequests: [],
  selectedRequest: null,
  filters: {
    searchTerm: '',
    status: '',
    role: '',
    dateRange: null,
  },
  stats: {
    pending: 0,
    approved: 0,
    declined: 0,
    total: 0,
  },
  permissions: [],
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    pageSize: 10,
  },
  loading: false,
  error: null,
  permissionsLoading: false,
  permissionsError: null,
};

const adminRequestsSlice = createSlice({
  name: 'adminRequests',
  initialState,
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
      state.filteredRequests = state.requests;
    },
    applyFilters: (state) => {
      let filtered = [...state.requests];

      // Search filter
      if (state.filters.searchTerm) {
        const searchLower = state.filters.searchTerm.toLowerCase();
        filtered = filtered.filter(
          (req) =>
            req.firstName?.toLowerCase().includes(searchLower) ||
            req.lastName?.toLowerCase().includes(searchLower) ||
            req.email?.toLowerCase().includes(searchLower) ||
            req.organization?.toLowerCase().includes(searchLower)
        );
      }

      // Status filter
      if (state.filters.status) {
        filtered = filtered.filter((req) => req.status === state.filters.status);
      }

      // Role filter
      if (state.filters.role) {
        filtered = filtered.filter((req) => req.adminType === state.filters.role);
      }

      state.filteredRequests = filtered;
    },
    setSelectedRequest: (state, action) => {
      state.selectedRequest = action.payload;
    },
    updateRequestStatus: (state, action) => {
      const { requestId, status, additionalData } = action.payload;
      const index = state.requests.findIndex((req) => req.id === requestId);
      if (index !== -1) {
        state.requests[index] = {
          ...state.requests[index],
          status,
          ...additionalData,
        };
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Admins
      .addCase(fetchAdmins.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdmins.fulfilled, (state, action) => {
        state.loading = false;
        
        // Transform API response to match component structure
        const admins = action.payload?.data?.users || [];
        state.requests = admins;
        state.filteredRequests = admins;
        
        // Calculate stats
        state.stats = {
          total: admins.length,
          pending: admins.filter(a => a.status === 'pending').length,
          approved: admins.filter(a => a.status === 'approved').length,
          declined: admins.filter(a => a.status === 'declined').length,
        };
        
        // Update pagination if available
        if (action.payload?.data?.pagination) {
          state.pagination = action.payload.data.pagination;
        }
      })
      .addCase(fetchAdmins.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch admins';
      })
      
      // Fetch Admin Filters
      .addCase(fetchAdminFilters.fulfilled, (state, action) => {
        // Store filter options if needed
        state.filterOptions = action.payload?.data;
      })
      
      // Fetch Admin Permissions
      .addCase(fetchAdminPermissions.pending, (state) => {
        state.permissionsLoading = true;
        state.permissionsError = null;
      })
      .addCase(fetchAdminPermissions.fulfilled, (state, action) => {
        state.permissionsLoading = false;
        if (state.selectedRequest) {
          state.selectedRequest.permissions = action.payload?.data;
        }
      })
      .addCase(fetchAdminPermissions.rejected, (state, action) => {
        state.permissionsLoading = false;
        state.permissionsError = action.payload || 'Failed to fetch permissions';
      })
      
      // Update Admin Permissions
      .addCase(updateAdminPermissions.pending, (state) => {
        state.permissionsLoading = true;
        state.permissionsError = null;
      })
      .addCase(updateAdminPermissions.fulfilled, (state, action) => {
        state.permissionsLoading = false;
        // Update the request in state
        const adminId = action.meta.arg.adminUuid;
        const index = state.requests.findIndex((req) => req.id === adminId);
        if (index !== -1) {
          state.requests[index].permissions = action.payload?.data;
        }
      })
      .addCase(updateAdminPermissions.rejected, (state, action) => {
        state.permissionsLoading = false;
        state.permissionsError = action.payload || 'Failed to update permissions';
      })
      
      // Fetch All Permissions
      .addCase(fetchAllPermissions.fulfilled, (state, action) => {
        state.permissions = action.payload?.data || [];
      });
  },
});

export const {
  setFilters,
  clearFilters,
  applyFilters,
  setSelectedRequest,
  updateRequestStatus,
} = adminRequestsSlice.actions;

export default adminRequestsSlice.reducer;