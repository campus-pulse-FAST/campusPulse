import { Controller, Get } from '@nestjs/common';

@Controller()
export class HealthController {
  @Get('health')
  getHealth() {
    return {
      service: 'feedback-service',
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
