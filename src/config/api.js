// API configuration for different environments
const isDevelopment = import.meta.env.DEV;
const isProduction = import.meta.env.PROD;

// Base URL configuration
export const API_BASE_URL = isProduction 
  ? '' // Use relative URLs in production (Vercel)
  : 'http://localhost:3000'; // Use proxy in development

// API endpoints
export const API_ENDPOINTS = {
  // Orders
  RECENT_ORDERS: '/api/orders/recent',
  
  // Summary
  DAILY_SUMMARY: '/api/summary/daily',
  
  // Query
  QUERY: '/api/query',
  
  // Schema
  SCHEMA: '/api/schema',
  
  // Real-time (SSE)
  REALTIME: '/api/realtime'
};

// Helper function to build full URL
export const buildApiUrl = (endpoint, params = {}) => {
  const url = new URL(API_BASE_URL + endpoint, window.location.origin);
  Object.keys(params).forEach(key => {
    if (params[key] !== undefined) {
      url.searchParams.append(key, params[key]);
    }
  });
  return url.toString();
};