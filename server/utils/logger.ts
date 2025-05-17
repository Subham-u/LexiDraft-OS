/**
 * Logging utility for consistent logging across the application
 */

// Define log levels
type LogLevel = 'info' | 'warn' | 'error' | 'debug';

/**
 * Logger function that creates formatted logs with timestamps and module information
 * @param module The module name to include in logs
 * @returns Logging functions for different log levels
 */
export function createLogger(module: string) {
  // Format the log message with timestamp and module name
  const formatMessage = (level: LogLevel, message: string, meta?: any) => {
    const timestamp = new Date().toISOString();
    const metaString = meta ? ` :: ${JSON.stringify(meta)}` : '';
    return `${timestamp} [${level.toUpperCase()}] [${module}] ${message}${metaString}`;
  };

  // Return an object with methods for each log level
  return {
    info: (message: string, meta?: any) => {
      console.log(formatMessage('info', message, meta));
    },
    warn: (message: string, meta?: any) => {
      console.warn(formatMessage('warn', message, meta));
    },
    error: (message: string, meta?: any) => {
      console.error(formatMessage('error', message, meta));
    },
    debug: (message: string, meta?: any) => {
      if (process.env.NODE_ENV !== 'production') {
        console.debug(formatMessage('debug', message, meta));
      }
    }
  };
}