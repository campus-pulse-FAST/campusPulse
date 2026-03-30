import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { JwtService } from '@nestjs/jwt';

interface ServiceRoute {
  prefix: string;
  url: string;
}

@Injectable()
export class ProxyService {
  private readonly logger = new Logger(ProxyService.name);
  private readonly serviceRoutes: ServiceRoute[];
  private readonly publicRoutes: string[] = [
    '/api/auth/register',
    '/api/auth/login',
    '/api/auth/refresh',
    '/api/health',
    '/api/services',
  ];

  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
    private jwtService: JwtService,
  ) {
    this.serviceRoutes = [
      { prefix: '/api/auth', url: this.configService.get('USER_SERVICE_URL', 'http://localhost:3001') },
      { prefix: '/api/users', url: this.configService.get('USER_SERVICE_URL', 'http://localhost:3001') },
      { prefix: '/api/events', url: this.configService.get('EVENT_SERVICE_URL', 'http://localhost:3002') },
      { prefix: '/api/venues', url: this.configService.get('EVENT_SERVICE_URL', 'http://localhost:3002') },
      { prefix: '/api/categories', url: this.configService.get('EVENT_SERVICE_URL', 'http://localhost:3002') },
      { prefix: '/api/resources', url: this.configService.get('EVENT_SERVICE_URL', 'http://localhost:3002') },
      { prefix: '/api/registrations', url: this.configService.get('REGISTRATION_SERVICE_URL', 'http://localhost:3003') },
      { prefix: '/api/attendance', url: this.configService.get('REGISTRATION_SERVICE_URL', 'http://localhost:3003') },
      { prefix: '/api/guests', url: this.configService.get('REGISTRATION_SERVICE_URL', 'http://localhost:3003') },
      { prefix: '/api/feedback', url: this.configService.get('FEEDBACK_SERVICE_URL', 'http://localhost:3004') },
      { prefix: '/api/notifications', url: this.configService.get('NOTIFICATION_SERVICE_URL', 'http://localhost:3005') },
      { prefix: '/api/audit-logs', url: this.configService.get('NOTIFICATION_SERVICE_URL', 'http://localhost:3005') },
    ];
  }

  isPublicRoute(path: string): boolean {
    return this.publicRoutes.some((route) => path.startsWith(route));
  }

  extractAndVerifyToken(req: any): { id: string; email: string; role: string } | null {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.split(' ')[1];
    try {
      const payload = this.jwtService.verify(token);
      return {
        id: payload.sub,
        email: payload.email,
        role: payload.role,
      };
    } catch {
      return null;
    }
  }

  getTargetUrl(path: string): string | null {
    const route = this.serviceRoutes.find((r) => path.startsWith(r.prefix));
    if (!route) return null;

    const servicePath = path.replace('/api', '');
    return `${route.url}${servicePath}`;
  }

  async forward(req: any, user: { id: string; email: string; role: string } | null) {
    const fullPath = req.originalUrl?.split('?')[0] || req.path;
    const targetUrl = this.getTargetUrl(fullPath);

    if (!targetUrl) {
      return { statusCode: 404, data: { success: false, data: null, error: { code: 'NOT_FOUND', message: 'Route not found' }, meta: null } };
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Internal-Service-Key': this.configService.get('INTERNAL_SERVICE_KEY', ''),
    };

    if (user) {
      headers['X-User-Id'] = user.id;
      headers['X-User-Email'] = user.email;
      headers['X-User-Role'] = user.role;
    }

    const method = req.method.toUpperCase();
    const hasBody = ['POST', 'PUT', 'PATCH'].includes(method);

    if (!hasBody) {
      delete headers['Content-Type'];
    }

    this.logger.log(`Proxying ${method} ${fullPath} → ${targetUrl}`);

    try {
      const response = await firstValueFrom(
        this.httpService.request({
          method: method as any,
          url: targetUrl,
          ...(hasBody ? { data: req.body } : {}),
          headers,
          params: req.query,
          timeout: 10000,
          validateStatus: () => true,
        }),
      );

      return { statusCode: response.status, data: response.data };
    } catch (error) {
      this.logger.error(`Proxy error to ${targetUrl}: ${error.message}`);
      return {
        statusCode: 502,
        data: { success: false, data: null, error: { code: 'BAD_GATEWAY', message: 'Service unavailable' }, meta: null },
      };
    }
  }

  getAllServiceUrls(): Record<string, string> {
    const urls: Record<string, string> = {};
    this.serviceRoutes.forEach((r) => {
      urls[r.prefix] = r.url;
    });
    return urls;
  }
}
