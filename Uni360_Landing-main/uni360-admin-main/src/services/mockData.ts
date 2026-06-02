// Mock data for demo purposes

export const mockApplications = [
  {
    id: '1',
    university: 'Technical University of Munich',
    course: 'Master in Computer Science',
    status: 'submitted' as const,
    adminName: 'Dr. Sarah Wilson',
    adminEmail: 'sarah.wilson@UNI360°.com',
    progress: 65,
  },
  {
    id: '2',
    university: 'University of Cambridge',
    course: 'Master in Data Science',
    status: 'document_required' as const,
    adminName: 'Prof. James Smith',
    adminEmail: 'james.smith@UNI360°.com',
    progress: 40,
  },
  {
    id: '3',
    university: 'ETH Zurich',
    course: 'Master in Artificial Intelligence',
    status: 'accepted' as const,
    adminName: 'Dr. Maria Garcia',
    adminEmail: 'maria.garcia@UNI360°.com',
    progress: 95,
  },
];

export const mockDocuments = [
  {
    id: '1',
    name: 'Transcript - Bachelor Degree',
    type: 'academic',
    status: 'approved' as const,
    uploadDate: '2024-01-15',
  },
  {
    id: '2',
    name: 'Statement of Purpose',
    type: 'application',
    status: 'pending' as const,
    uploadDate: '2024-01-20',
  },
  {
    id: '3',
    name: 'Passport Copy',
    type: 'identity',
    status: 'rejected' as const,
    uploadDate: '2024-01-18',
  },
];

export const mockNotifications = [
  {
    id: '1',
    title: 'Application Status Update',
    message: 'Your application to TUM has been submitted successfully',
    type: 'success',
    read: false,
    timestamp: '2024-01-22T10:30:00Z',
  },
  {
    id: '2',
    title: 'Document Required',
    message: 'Please upload your updated transcript for Cambridge application',
    type: 'warning',
    read: false,
    timestamp: '2024-01-21T14:20:00Z',
  },
  {
    id: '3',
    title: 'Appointment Reminder',
    message: 'Your APS appointment is scheduled for tomorrow at 2 PM',
    type: 'info',
    read: true,
    timestamp: '2024-01-20T09:00:00Z',
  },
];

export const mockUniversities = [
  {
    id: '1',
    name: 'Technical University of Munich',
    country: 'Germany',
    location: 'Munich, Germany',
    ranking: 41,
    programs: ['Computer Science', 'Engineering', 'Physics'],
    tuitionFee: '€0 (Public University)',
    image: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=400&h=200&fit=crop',
  },
  {
    id: '2',
    name: 'University of Cambridge',
    country: 'UK',
    location: 'Cambridge, UK',
    ranking: 3,
    programs: ['Computer Science', 'Engineering', 'Mathematics'],
    tuitionFee: '£33,972 per year',
    image: 'https://images.unsplash.com/photo-1520637836862-4d197d17c38a?w=400&h=200&fit=crop',
  },
  {
    id: '3',
    name: 'ETH Zurich',
    country: 'Switzerland',
    location: 'Zurich, Switzerland',
    ranking: 8,
    programs: ['Computer Science', 'Engineering', 'Natural Sciences'],
    tuitionFee: 'CHF 1,298 per semester',
    image: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=400&h=200&fit=crop',
  },
];

export const mockPayments = [
  {
    id: '1',
    type: 'Application Fee',
    amount: '€50',
    dueDate: '2024-02-01',
    status: 'pending',
    university: 'Technical University of Munich',
  },
  {
    id: '2',
    type: 'APS Appointment',
    amount: '€175',
    dueDate: '2024-01-30',
    status: 'paid',
    description: 'Academic Evaluation Centre appointment',
  },
];

export const mockAppointments = [
  {
    id: '1',
    type: 'APS Interview',
    date: '2024-02-05',
    time: '14:00',
    location: 'Academic Evaluation Centre, Berlin',
    status: 'confirmed',
  },
  {
    id: '2',
    type: 'University Interview',
    date: '2024-02-15',
    time: '10:00',
    location: 'Online - Zoom Meeting',
    status: 'pending',
    university: 'University of Cambridge',
  },
];