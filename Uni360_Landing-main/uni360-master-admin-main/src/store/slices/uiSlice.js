import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  sidebarOpen:
    typeof window !== "undefined" ? window.innerWidth >= 1024 : false,
  notifications: [],
  notificationsOpen: false,
  profileMenuOpen: false,
  loading: false,
  theme: "light",
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action) => {
      state.sidebarOpen = action.payload;
    },
    toggleNotifications: (state) => {
      state.notificationsOpen = !state.notificationsOpen;
    },
    setNotificationsOpen: (state, action) => {
      state.notificationsOpen = action.payload;
    },
    toggleProfileMenu: (state) => {
      state.profileMenuOpen = !state.profileMenuOpen;
    },
    setProfileMenuOpen: (state, action) => {
      state.profileMenuOpen = action.payload;
    },
    addNotification: (state, action) => {
      state.notifications.unshift(action.payload);
    },
    markAllNotificationsRead: (state) => {
      state.notifications = state.notifications.map((notification) => ({
        ...notification,
        read: true,
      }));
    },
    removeNotification: (state, action) => {
      state.notifications = state.notifications.filter(
        (notification) => notification.id !== action.payload
      );
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
  },
});

export const {
  toggleSidebar,
  setSidebarOpen,
  toggleNotifications,
  setNotificationsOpen,
  toggleProfileMenu,
  setProfileMenuOpen,
  addNotification,
  markAllNotificationsRead,
  removeNotification,
  setLoading,
} = uiSlice.actions;

export default uiSlice.reducer;
