/**
 * Logger utility for LexiDraft
 * Provides standardized logging across the application
 */

import { IS_PRODUCTION } from '../config';

// Log levels
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR'
}

// Log function type
type LogFunction = (message: string, meta?: Record<string, any>) => void;

// Logger interface
interface Logger {
  debug: LogFunction;
  info: LogFunction;
  warn: LogFunction;
  error: LogFunction;
}

/**
 * Create a logger instance for a specific module
 * @param module Name of the module using this logger
 * @returns Logger instance
 */
export function createLogger(module: string): Logger {
  // Format the log message
  const formatMessage = (level: LogLevel, message: string, meta?: Record<string, any>): string => {
    const timestamp = new Date().toISOString();
    let logMessage = `${timestamp} [${level}] [${module}] ${message}`;
    
    if (meta) {
      // For production, filter out sensitive information
      const filteredMeta = IS_PRODUCTION 
        ? filterSensitiveData(meta)
        : meta;
        
      try {
        logMessage += ` | ${JSON.stringify(filteredMeta)}`;
      } catch (e) {
        logMessage += ` | [Non-serializable metadata]`;
      }
    }
    
    return logMessage;
  };
  
  // Filter sensitive data from logs
  const filterSensitiveData = (data: Record<string, any>): Record<string, any> => {
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'apiKey', 'Authorization', 'credential'];
    const filtered = { ...data };
    
    // Recursively remove sensitive data
    const removeSensitive = (obj: Record<string, any>) => {
      for (const key in obj) {
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          removeSensitive(obj[key]);
        } else if (sensitiveFields.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
          obj[key] = '[REDACTED]';
        }
      }
    };
    
    removeSensitive(filtered);
    return filtered;
  };
  
  // Create the logger
  return {
    debug: (message: string, meta?: Record<string, any>) => {
      if (!IS_PRODUCTION) {
        console.debug(formatMessage(LogLevel.DEBUG, message, meta));
      }
    },
    
    info: (message: string, meta?: Record<string, any>) => {
      console.info(formatMessage(LogLevel.INFO, message, meta));
    },
    
    warn: (message: string, meta?: Record<string, any>) => {
      console.warn(formatMessage(LogLevel.WARN, message, meta));
    },
    
    error: (message: string, meta?: Record<string, any>) => {
      console.error(formatMessage(LogLevel.ERROR, message, meta));
    }
  };
}

// Default application logger
export const logger = createLogger('app');