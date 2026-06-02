// User type definition
export interface User {
  id: string;
  uuid?: string;
  email: string;
  name: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  profilePhoto?: string;
  phone?: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  nationality?: string;
  currentLocation?: string;
  educationLevel?: string;
  fieldOfStudy?: string;
  targetCountries?: string[];
  preferredPrograms?: string[];
  isVerified?: boolean;
  createdAt?: string;
  lastLogin?: string;
  status?: string;
  applications?: any[];
  documents?: any[];
  favoriteUniversities?: any[];
  avatar?: string;
  authProvider?: 'LOCAL' | 'GOOGLE' | 'HYBRID';
  hasPassword?: boolean;
}

// Login credentials type
export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

// Sign up credentials type
export interface SignUpCredentials {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
}

// Auth state type
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// Auth context type
export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  signUp: (credentials: SignUpCredentials) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  clearError: () => void;
  loginWithGoogle: (payload: { token: string; user: any }) => Promise<void>;
  updateUserProfile: (profileData: Partial<User>) => Promise<User>;
  setPassword: (data: { currentPassword?: string; newPassword: string; confirmPassword: string }) => Promise<{ success: boolean; message: string }>;
  profileCompletion?: number;
  // Country selection state
  selectedCountry: "DE" | "UK";
  isCountryToggleDisabled: boolean;
  setSelectedCountry: (country: "DE" | "UK") => void;
}
