/**
 * Type definitions for LexiDraft services
 */

/**
 * Standard API response format
 */
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  error?: string;
  data?: T;
  status?: number;
  timestamp?: string;
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page: number;
  limit: number;
}

/**
 * Pagination response metadata
 */
export interface PaginationMeta {
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> extends ApiResponse {
  data: T[];
  pagination: PaginationMeta;
}

/**
 * Sort direction
 */
export enum SortDirection {
  ASC = 'asc',
  DESC = 'desc'
}

/**
 * Sort parameters
 */
export interface SortParams {
  field: string;
  direction: SortDirection;
}

/**
 * Search parameters
 */
export interface SearchParams {
  query: string;
  fields?: string[];
}

/**
 * Error with HTTP status code
 */
export class ApiError extends Error {
  status: number;
  
  constructor(message: string, status: number = 500) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
  
  static badRequest(message: string = 'Bad Request'): ApiError {
    return new ApiError(message, 400);
  }
  
  static unauthorized(message: string = 'Unauthorized'): ApiError {
    return new ApiError(message, 401);
  }
  
  static forbidden(message: string = 'Forbidden'): ApiError {
    return new ApiError(message, 403);
  }
  
  static notFound(message: string = 'Not Found'): ApiError {
    return new ApiError(message, 404);
  }
  
  static internal(message: string = 'Internal Server Error'): ApiError {
    return new ApiError(message, 500);
  }
}