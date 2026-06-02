// University Types
export interface University {
  id: string;
  name: string;
  code?: string;
  city: string;
  state?: string;
  country: string;
  description?: string;
  image_url?: string;
  ranking?: number;
  match_score?: number;
  acceptance_rate?: number;
  total_courses?: number;
  is_partner?: boolean;
  created_at?: string;
  updated_at?: string;
}

// Course Types
export interface Course {
  id: string;
  university: string;
  name: string;
  degree_type: 'bachelors' | 'masters' | 'phd';
  subject_area: string;
  language: string;
  duration_months: number;
  intake_season: string;
  tuition_fee: string | number;
  min_gpa: number;
  min_ielts: number;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

// Filter Types
export interface UniversityFilters {
  cities?: string[];
  states?: string[];
  subjects?: string[];
  degreeTypes?: string[];
  languages?: string[];
  intakeSeasons?: string[];
}

// Search Parameters
export interface UniversitySearchParams {
  query?: string;
  country?: string;
  city?: string;
  state?: string;
  subject_area?: string;
  language?: string;
  degree_type?: string;
  intake_season?: string;
}

// Update University Request
export interface UpdateUniversityRequest {
  name?: string;
  city?: string;
  state?: string;
  country?: string;
  description?: string;
  image_url?: string;
  ranking?: number;
}

// API Response Types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
  status?: number;
}

// Upload Response
export interface UploadResponse {
  success: boolean;
  message: string;
  processed?: number;
  failed?: number;
  errors?: string[];
}