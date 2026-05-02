import { Injectable, Inject, NestMiddleware } from '@nestjs/common';
import { ProxyService } from './proxy.service';

@Injectable()
export class ProxyMiddleware implements NestMiddleware {
  constructor(@Inject(ProxyService) private readonly proxyService: ProxyService) {}

  async use(req: any, res: any, next: () => void) {
    const fullPath = req.originalUrl || req.url;

    // Let health and services endpoints pass through to the controller
    if (fullPath === '/api/health' || fullPath === '/api/services') {
      return next();
    }

    // Check if this is a route that should be proxied
    const targetUrl = this.proxyService.getTargetUrl(fullPath);
    if (!targetUrl) {
      return next();
    }

    let user = null;

    if (!this.proxyService.isPublicRoute(fullPath)) {
      user = this.proxyService.extractAndVerifyToken(req);
      if (!user) {
        return res.status(401).json({
          success: false,
          data: null,
          error: { code: 'UNAUTHORIZED', message: 'Invalid or missing token' },
          meta: null,
        });
      }
    } else {
      user = this.proxyService.extractAndVerifyToken(req);
    }

    const result = await this.proxyService.forward(req, user);
    res.status(result.statusCode).json(result.data);
  }
}
