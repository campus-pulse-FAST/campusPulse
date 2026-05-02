export interface User {
  id: string;
  email: string;
  name: string;
  role: 'student' | 'organizer' | 'admin';
  department?: string;
  semester?: string;
  phone?: string;
  avatarUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  colorHex?: string;
}

export interface Venue {
  id: number;
  name: string;
  location?: string;
  capacity: number;
  amenities?: string[];
}

export interface Event {
  id: string;
  title: string;
  description?: string;
  organizerId: string;
  categoryId?: number;
  category?: Category;
  venueId?: number;
  venue?: Venue;
  startTime: string;
  endTime: string;
  capacity: number;
  status: 'draft' | 'published' | 'archived' | 'cancelled';
  isPublic: boolean;
  registrationDeadline?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Registration {
  id: string;
  eventId: string;
  userId: string;
  status: 'confirmed' | 'waitlisted' | 'cancelled';
  waitlistPosition?: number;
  registeredAt: string;
  event?: Event;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data: T | null;
  error: { code: string; message: string } | null;
  meta: { page: number; limit: number; total: number; totalPages: number } | null;
}
