import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UIState {
  sidebarCollapsed: boolean;
  currentCountry: 'Germany' | 'UK';
  theme: 'light' | 'dark';
  loading: boolean;
}

const initialState: UIState = {
  sidebarCollapsed: false,
  currentCountry: 'Germany',
  theme: 'light',
  loading: false,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
    setSidebarCollapsed: (state, action: PayloadAction<boolean>) => {
      state.sidebarCollapsed = action.payload;
    },
    toggleCountry: (state) => {
      state.currentCountry = state.currentCountry === 'Germany' ? 'UK' : 'Germany';
    },
    setCountry: (state, action: PayloadAction<'Germany' | 'UK'>) => {
      state.currentCountry = action.payload;
    },
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.theme = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
  },
});

export const {
  toggleSidebar,
  setSidebarCollapsed,
  toggleCountry,
  setCountry,
  setTheme,
  setLoading,
} = uiSlice.actions;

export default uiSlice.reducer;