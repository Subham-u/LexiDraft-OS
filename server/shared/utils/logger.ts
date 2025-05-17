/**
 * Logger utility for LexiDraft
 * Provides consistent logging across all services
 */

// Simple logger implementation
export function createLogger(module: string) {
  return {
    info: (message: string, meta?: any) => {
      console.log(`${new Date().toISOString()} [INFO] [${module}] ${message}`, meta ? meta : '');
    },
    warn: (message: string, meta?: any) => {
      console.warn(`${new Date().toISOString()} [WARN] [${module}] ${message}`, meta ? meta : '');
    },
    error: (message: string, meta?: any) => {
      console.error(`${new Date().toISOString()} [ERROR] [${module}] ${message}`, meta ? meta : '');
    },
    debug: (message: string, meta?: any) => {
      if (process.env.NODE_ENV !== 'production') {
        console.debug(`${new Date().toISOString()} [DEBUG] [${module}] ${message}`, meta ? meta : '');
      }
    }
  };
}