// Type declarations for api.js
export declare const API_BASE_URL: string;

export declare const API_ENDPOINTS: {
  RECENT_ORDERS: string;
  DAILY_SUMMARY: string;
  QUERY: string;
  SCHEMA: string;
  REALTIME: string;
};

export declare function buildApiUrl(endpoint: string, params?: Record<string, any>): string;