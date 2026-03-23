import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ProxyService {
  private readonly serviceUrls: Record<string, string>;

  constructor(private configService: ConfigService) {
    this.serviceUrls = {
      users: this.configService.get<string>('USER_SERVICE_URL', 'http://localhost:3001'),
      events: this.configService.get<string>('EVENT_SERVICE_URL', 'http://localhost:3002'),
      registrations: this.configService.get<string>('REGISTRATION_SERVICE_URL', 'http://localhost:3003'),
      feedback: this.configService.get<string>('FEEDBACK_SERVICE_URL', 'http://localhost:3004'),
      notifications: this.configService.get<string>('NOTIFICATION_SERVICE_URL', 'http://localhost:3005'),
    };
  }

  getServiceUrl(service: string): string | undefined {
    return this.serviceUrls[service];
  }

  getAllServiceUrls(): Record<string, string> {
    return { ...this.serviceUrls };
  }
}
