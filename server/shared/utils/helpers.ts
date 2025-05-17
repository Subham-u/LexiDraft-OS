/**
 * Helper utilities for LexiDraft services
 */

/**
 * Generate a unique ID with a prefix
 * @param prefix Prefix for the ID
 * @returns Unique ID with prefix
 */
export function generateId(prefix: string = 'ld'): string {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `${prefix}_${timestamp}_${randomStr}`;
}

/**
 * Sleep for a specified duration
 * @param ms Duration in milliseconds
 * @returns Promise that resolves after the duration
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 * @param fn Function to retry
 * @param retries Number of retries
 * @param delay Initial delay in milliseconds
 * @param factor Backoff factor
 * @returns Promise with the function result
 */
export async function retry<T>(
  fn: () => Promise<T>, 
  retries: number = 3, 
  delay: number = 300, 
  factor: number = 2
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 1) throw error;
    await sleep(delay);
    return retry(fn, retries - 1, delay * factor, factor);
  }
}

/**
 * Format a date for display
 * @param date Date to format
 * @param format Format to use (full, short, time)
 * @returns Formatted date string
 */
export function formatDate(date: Date | string, format: 'full' | 'short' | 'time' = 'full'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  switch (format) {
    case 'short':
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    case 'time':
      return d.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit'
      });
    case 'full':
    default:
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
  }
}

/**
 * Sanitize an object for logging by removing sensitive fields
 * @param obj Object to sanitize
 * @returns Sanitized object
 */
export function sanitizeForLogging(obj: Record<string, any>): Record<string, any> {
  const sensitiveFields = ['password', 'token', 'secret', 'key', 'apiKey', 'Authorization', 'credential'];
  const sanitized = { ...obj };
  
  for (const key in sanitized) {
    if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeForLogging(sanitized[key]);
    } else if (sensitiveFields.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
      sanitized[key] = '[REDACTED]';
    }
  }
  
  return sanitized;
}