import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class HttpService {
  async get<T = any>(url: string): Promise<T> {
    const res = await axios.get(url, {
      headers: { 'User-Agent': 'MyApp/1.0' },
    });
    return res.data;
  }
}
