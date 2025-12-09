/**
 * Standard API response wrapper following HNG SDK pattern
 * All successful responses return { message, data }
 */
export interface ApiResponse<T> {
  message: string;
  data: T;
}

/**
 * Paginated response structure
 */
export interface PaginatedResponse<T> {
  message: string;
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
    has_next: boolean;
    has_previous: boolean;
  };
}
