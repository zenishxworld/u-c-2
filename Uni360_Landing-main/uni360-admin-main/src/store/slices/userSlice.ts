import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Application {
  id: string;
  university: string;
  course: string;
  status: 'pending' | 'submitted' | 'accepted' | 'rejected' | 'document_required';
  adminName: string;
  adminEmail: string;
  progress: number;
}

interface Document {
  id: string;
  name: string;
  type: string;
  status: 'uploaded' | 'pending' | 'approved' | 'rejected';
  uploadDate: string;
}

interface UserState {
  profileCompletion: number;
  applications: Application[];
  documents: Document[];
  notifications: any[];
  appointments: any[];
  payments: any[];
  claimedApplications: any[];
  students: any[];
}

const initialState: UserState = {
  profileCompletion: 0,
  applications: [],
  documents: [],
  notifications: [],
  appointments: [],
  payments: [],
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setProfileCompletion: (state, action: PayloadAction<number>) => {
      state.profileCompletion = action.payload;
    },
    setApplications: (state, action: PayloadAction<Application[]>) => {
      state.applications = action.payload;
    },
    addApplication: (state, action: PayloadAction<Application>) => {
      state.applications.push(action.payload);
    },
    updateApplication: (state, action: PayloadAction<{ id: string; updates: Partial<Application> }>) => {
      const index = state.applications.findIndex(app => app.id === action.payload.id);
      if (index !== -1) {
        state.applications[index] = { ...state.applications[index], ...action.payload.updates };
      }
    },
    setDocuments: (state, action: PayloadAction<Document[]>) => {
      state.documents = action.payload;
    },
    addDocument: (state, action: PayloadAction<Document>) => {
      state.documents.push(action.payload);
    },
    setNotifications: (state, action: PayloadAction<any[]>) => {
      state.notifications = action.payload;
    },
    markNotificationsRead: (state) => {
      state.notifications = state.notifications.map(n => ({ ...n, read: true }));
    },
  },
});

export const {
  setProfileCompletion,
  setApplications,
  addApplication,
  updateApplication,
  setDocuments,
  addDocument,
  setNotifications,
  markNotificationsRead,
} = userSlice.actions;

export default userSlice.reducer;