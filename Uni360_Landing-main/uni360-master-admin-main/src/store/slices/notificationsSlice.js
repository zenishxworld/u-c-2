import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

// Mock API calls - replace with actual API endpoints
export const fetchStudents = createAsyncThunk(
  "notifications/fetchStudents",
  async () => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return [
      {
        id: 1,
        name: "John Doe",
        email: "john.doe@email.com",
        status: "active",
        university: "Harvard University",
        phone: "+1234567890",
        course: "Computer Science",
        intake: "Fall 2024",
        country: "United States",
      },
      {
        id: 2,
        name: "Jane Smith",
        email: "jane.smith@email.com",
        status: "active",
        university: "Stanford University",
        phone: "+1234567891",
        course: "Business Administration",
        intake: "Spring 2024",
        country: "United States",
      },
      {
        id: 3,
        name: "Mike Johnson",
        email: "mike.johnson@email.com",
        status: "pending",
        university: "MIT",
        phone: "+1234567892",
        course: "Engineering",
        intake: "Fall 2024",
        country: "Canada",
      },
      {
        id: 4,
        name: "Sarah Wilson",
        email: "sarah.wilson@email.com",
        status: "active",
        university: "Oxford University",
        phone: "+1234567893",
        course: "Medicine",
        intake: "Fall 2023",
        country: "United Kingdom",
      },
      {
        id: 5,
        name: "David Brown",
        email: "david.brown@email.com",
        status: "active",
        university: "Cambridge University",
        phone: "+1234567894",
        course: "Law",
        intake: "Spring 2024",
        country: "United Kingdom",
      },
      {
        id: 6,
        name: "Emma Garcia",
        email: "emma.garcia@email.com",
        status: "active",
        university: "University of Toronto",
        phone: "+1234567895",
        course: "Psychology",
        intake: "Fall 2024",
        country: "Canada",
      },
      {
        id: 7,
        name: "Alex Chen",
        email: "alex.chen@email.com",
        status: "pending",
        university: "University of Melbourne",
        phone: "+1234567896",
        course: "Data Science",
        intake: "Spring 2025",
        country: "Australia",
      },
      {
        id: 8,
        name: "Maria Rodriguez",
        email: "maria.rodriguez@email.com",
        status: "active",
        university: "McGill University",
        phone: "+1234567897",
        course: "International Relations",
        intake: "Fall 2024",
        country: "Mexico",
      },
      {
        id: 9,
        name: "James Taylor",
        email: "james.taylor@email.com",
        status: "active",
        university: "University of Sydney",
        phone: "+1234567898",
        course: "Finance",
        intake: "Spring 2024",
        country: "Australia",
      },
      {
        id: 10,
        name: "Lisa Wang",
        email: "lisa.wang@email.com",
        status: "pending",
        university: "National University of Singapore",
        phone: "+1234567899",
        course: "Computer Engineering",
        intake: "Fall 2024",
        country: "Singapore",
      },
    ];
  }
);

export const fetchAdmins = createAsyncThunk(
  "notifications/fetchAdmins",
  async () => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return [
      {
        id: 1,
        name: "Admin One",
        email: "admin1@uni360.com",
        role: "University Admin",
        university: "Harvard University",
        status: "active",
        country: "United States",
      },
      {
        id: 2,
        name: "Admin Two",
        email: "admin2@uni360.com",
        role: "External Admin",
        university: "Stanford University",
        status: "active",
        country: "United States",
      },
      {
        id: 3,
        name: "Admin Three",
        email: "admin3@uni360.com",
        role: "Super Admin",
        university: "All Universities",
        status: "active",
        country: "Global",
      },
      {
        id: 4,
        name: "Admin Four",
        email: "admin4@uni360.com",
        role: "University Admin",
        university: "MIT",
        status: "active",
        country: "United States",
      },
      {
        id: 5,
        name: "Admin Five",
        email: "admin5@uni360.com",
        role: "University Admin",
        university: "Oxford University",
        status: "active",
        country: "United Kingdom",
      },
      {
        id: 6,
        name: "Admin Six",
        email: "admin6@uni360.com",
        role: "External Admin",
        university: "University of Toronto",
        status: "active",
        country: "Canada",
      },
      {
        id: 7,
        name: "Admin Seven",
        email: "admin7@uni360.com",
        role: "University Admin",
        university: "University of Melbourne",
        status: "pending",
        country: "Australia",
      },
      {
        id: 8,
        name: "Admin Eight",
        email: "admin8@uni360.com",
        role: "External Admin",
        university: "McGill University",
        status: "active",
        country: "Canada",
      },
    ];
  }
);

export const sendNotification = createAsyncThunk(
  "notifications/sendNotification",
  async (notificationData) => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const notification = {
      id: Date.now(),
      ...notificationData,
      sentAt: new Date().toISOString(),
      status: "sent",
    };

    return notification;
  }
);

export const fetchNotificationHistory = createAsyncThunk(
  "notifications/fetchHistory",
  async () => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return [
      {
        id: 1,
        title: "Welcome to UNI360",
        message: "Welcome to the UNI360 platform. We're excited to have you!",
        type: "info",
        priority: "normal",
        recipientType: "students",
        recipientCount: 5,
        sentAt: "2024-01-15T10:30:00Z",
        status: "sent",
      },
      {
        id: 2,
        title: "System Maintenance Notice",
        message:
          "We will be performing system maintenance on Sunday from 2 AM to 4 AM EST.",
        type: "warning",
        priority: "high",
        recipientType: "all",
        recipientCount: 9,
        sentAt: "2024-01-14T15:20:00Z",
        status: "sent",
      },
    ];
  }
);

const initialState = {
  students: [],
  admins: [],
  selectedRecipients: [],
  recipientType: "students",
  notification: {
    title: "",
    message: "",
    type: "info",
    priority: "normal",
  },
  notificationHistory: [],
  filters: {
    search: "",
    university: "",
    course: "",
    intake: "",
    country: "",
    role: "",
    status: "",
  },
  loading: {
    students: false,
    admins: false,
    sending: false,
    history: false,
  },
  error: null,
};

const notificationsSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    setRecipientType: (state, action) => {
      state.recipientType = action.payload;
      state.selectedRecipients = [];
    },
    setSelectedRecipients: (state, action) => {
      state.selectedRecipients = action.payload;
    },
    toggleRecipient: (state, action) => {
      const id = action.payload;
      if (state.selectedRecipients.includes(id)) {
        state.selectedRecipients = state.selectedRecipients.filter(
          (recipientId) => recipientId !== id
        );
      } else {
        state.selectedRecipients.push(id);
      }
    },
    selectAllRecipients: (state) => {
      const recipients =
        state.recipientType === "students" ? state.students : state.admins;
      state.selectedRecipients = recipients.map((r) => r.id);
    },
    deselectAllRecipients: (state) => {
      state.selectedRecipients = [];
    },
    updateNotification: (state, action) => {
      state.notification = { ...state.notification, ...action.payload };
    },
    resetNotification: (state) => {
      state.notification = {
        title: "",
        message: "",
        type: "info",
        priority: "normal",
      };
      state.selectedRecipients = [];
    },
    clearError: (state) => {
      state.error = null;
    },
    updateFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {
        search: "",
        university: "",
        course: "",
        intake: "",
        country: "",
        role: "",
        status: "",
      };
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Students
      .addCase(fetchStudents.pending, (state) => {
        state.loading.students = true;
        state.error = null;
      })
      .addCase(fetchStudents.fulfilled, (state, action) => {
        state.loading.students = false;
        state.students = action.payload;
      })
      .addCase(fetchStudents.rejected, (state, action) => {
        state.loading.students = false;
        state.error = action.error.message;
      })
      // Fetch Admins
      .addCase(fetchAdmins.pending, (state) => {
        state.loading.admins = true;
        state.error = null;
      })
      .addCase(fetchAdmins.fulfilled, (state, action) => {
        state.loading.admins = false;
        state.admins = action.payload;
      })
      .addCase(fetchAdmins.rejected, (state, action) => {
        state.loading.admins = false;
        state.error = action.error.message;
      })
      // Send Notification
      .addCase(sendNotification.pending, (state) => {
        state.loading.sending = true;
        state.error = null;
      })
      .addCase(sendNotification.fulfilled, (state, action) => {
        state.loading.sending = false;
        state.notificationHistory.unshift(action.payload);
        // Reset form after successful send
        state.notification = {
          title: "",
          message: "",
          type: "info",
          priority: "normal",
        };
        state.selectedRecipients = [];
      })
      .addCase(sendNotification.rejected, (state, action) => {
        state.loading.sending = false;
        state.error = action.error.message;
      })
      // Fetch Notification History
      .addCase(fetchNotificationHistory.pending, (state) => {
        state.loading.history = true;
        state.error = null;
      })
      .addCase(fetchNotificationHistory.fulfilled, (state, action) => {
        state.loading.history = false;
        state.notificationHistory = action.payload;
      })
      .addCase(fetchNotificationHistory.rejected, (state, action) => {
        state.loading.history = false;
        state.error = action.error.message;
      });
  },
});

export const {
  setRecipientType,
  setSelectedRecipients,
  toggleRecipient,
  selectAllRecipients,
  deselectAllRecipients,
  updateNotification,
  resetNotification,
  clearError,
  updateFilters,
  clearFilters,
} = notificationsSlice.actions;

export default notificationsSlice.reducer;
