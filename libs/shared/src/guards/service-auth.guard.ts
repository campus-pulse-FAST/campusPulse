import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { RequestUser } from '../interfaces/jwt-payload.interface';
import { UserRole } from '../constants/roles.enum';

@Injectable()
export class ServiceAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    const userId = request.headers['x-user-id'];
    const userEmail = request.headers['x-user-email'];
    const userRole = request.headers['x-user-role'] as UserRole;

    if (!userId || !userRole) {
      return false;
    }

    const user: RequestUser = {
      id: userId,
      email: userEmail || '',
      role: userRole,
    };

    request.user = user;
    return true;
  }
}
