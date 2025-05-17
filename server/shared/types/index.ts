/**
 * Shared types for LexiDraft
 */
import { ApiError } from '../middleware/error';

// Export the ApiError class for use throughout the application
export { ApiError };

// Generic API response interface
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  details?: any;
}

// Service health check response
export interface ServiceHealth {
  service: string;
  status: 'operational' | 'degraded' | 'down';
  version: string;
  timestamp: string;
}

// Pagination parameters
export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

// Pagination result
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Search parameters
export interface SearchParams {
  query: string;
  filters?: Record<string, any>;
}

// User interface (simplified)
export interface User {
  id: number;
  uid?: string;
  email: string;
  name?: string;
  role: string;
}

// Contract interface (simplified)
export interface Contract {
  id: number;
  userId: number;
  title: string;
  content: string;
  status: string;
  type: string;
  createdAt: string;
  updatedAt: string;
}