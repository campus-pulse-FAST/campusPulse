import { UserRole } from '../constants/roles.enum';

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

export interface RequestUser {
  id: string;
  email: string;
  role: UserRole;
}
