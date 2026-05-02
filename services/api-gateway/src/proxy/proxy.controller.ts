import { Controller, Get, Inject } from '@nestjs/common';
import { ProxyService } from './proxy.service';

@Controller()
export class ProxyController {
  constructor(@Inject(ProxyService) private readonly proxyService: ProxyService) {}

  @Get('health')
  getHealth() {
    return {
      service: 'api-gateway',
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('services')
  getServices() {
    return { services: this.proxyService.getAllServiceUrls() };
  }
}
