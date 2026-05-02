import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosRequestConfig } from 'axios';

@Injectable()
export class HttpClientService {
  private readonly logger = new Logger(HttpClientService.name);

  constructor(private readonly httpService: HttpService) {}

  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await firstValueFrom(
      this.httpService.get<T>(url, this.withDefaults(config)),
    );
    return response.data;
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await firstValueFrom(
      this.httpService.post<T>(url, data, this.withDefaults(config)),
    );
    return response.data;
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await firstValueFrom(
      this.httpService.put<T>(url, data, this.withDefaults(config)),
    );
    return response.data;
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await firstValueFrom(
      this.httpService.delete<T>(url, this.withDefaults(config)),
    );
    return response.data;
  }

  private withDefaults(config?: AxiosRequestConfig): AxiosRequestConfig {
    return {
      timeout: 5000,
      ...config,
      headers: {
        'X-Internal-Service-Key': process.env.INTERNAL_SERVICE_KEY || '',
        ...config?.headers,
      },
    };
  }
}
