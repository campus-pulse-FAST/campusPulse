import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { JwtModule } from '@nestjs/jwt';
import { ProxyController } from './proxy.controller';
import { ProxyService } from './proxy.service';
import { ProxyMiddleware } from './proxy.middleware';

@Module({
  imports: [
    HttpModule.register({ timeout: 10000 }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'campuspulse-jwt-secret-dev',
    }),
  ],
  controllers: [ProxyController],
  providers: [ProxyService],
})
export class ProxyModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(ProxyMiddleware).forRoutes('*');
  }
}
