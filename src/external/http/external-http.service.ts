import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosRequestConfig } from 'axios';

@Injectable()
export class ExternalHttpService {
  constructor(private readonly http: HttpService) {}

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const { data } = await firstValueFrom(this.http.get(url, config));
    return data;
  }
}
