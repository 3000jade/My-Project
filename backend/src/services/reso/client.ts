import axios, { AxiosInstance } from 'axios';
import { ResoProperty } from '../../types/reso';

export interface ResoConfig {
  baseUrl: string;
  tokenUrl: string;
  clientId: string;
  clientSecret: string;
}

export class ResoClient {
  private config: ResoConfig;
  private accessToken: string | null = null;
  private tokenExpiresAt: number = 0;
  private http: AxiosInstance;

  constructor(config: ResoConfig) {
    this.config = config;
    this.http = axios.create({ baseURL: config.baseUrl });
  }

  private async getAuthToken(): Promise<string> {
    const now = Date.now();
    if (this.accessToken && this.tokenExpiresAt > now + 60000) {
      return this.accessToken;
    }

    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');
    params.append('client_id', this.config.clientId);
    params.append('client_secret', this.config.clientSecret);
    params.append('scope', 'api');

    const res = await axios.post(this.config.tokenUrl, params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    this.accessToken = res.data.access_token;
    this.tokenExpiresAt = now + (res.data.expires_in * 1000);
    return this.accessToken!;
  }

  async searchProperties(params: {
    filter?: string;
    select?: string[];
    top?: number;
    skip?: number;
    expandMedia?: boolean;
  }): Promise<ResoProperty[]> {
    const token = await this.getAuthToken();
    const queryParams: Record<string, string | number> = {
      $top: params.top || 10,
    };

    if (params.filter) queryParams.$filter = params.filter;
    if (params.skip) queryParams.$skip = params.skip;
    if (params.select && params.select.length > 0) {
      queryParams.$select = params.select.join(',');
    }
    if (params.expandMedia) {
      queryParams.$expand = 'Media($select=MediaURL,Order;$top=3)';
    }

    const response = await this.http.get('/Property', {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json'
      },
      params: queryParams
    });

    return response.data.value || [];
  }
}

export default ResoClient;
