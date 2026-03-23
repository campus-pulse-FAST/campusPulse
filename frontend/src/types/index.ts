export interface User {
  id: string;
  email: string;
  name: string;
  role: 'student' | 'organizer' | 'admin';
  department?: string;
  semester?: string;
  phone?: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  organizerId: string;
  categoryId: number;
  venueId: number;
  startTime: string;
  endTime: string;
  capacity: number;
  status: 'draft' | 'published' | 'archived' | 'cancelled';
  isPublic: boolean;
  registrationDeadline: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data: T | null;
  error: { code: string; message: string } | null;
  meta: { page: number; limit: number; total: number; totalPages: number } | null;
}
