/**
 * Logger Utility
 * 
 * Centralized logging utility with structured logging support
 */

/**
 * Logger interface for structured logging
 */
export interface Logger {
  info(message: string, meta?: any): void
  warn(message: string, meta?: any): void
  error(message: string, meta?: any): void
  debug(message: string, meta?: any): void
}

/**
 * Simple console logger implementation
 * Following the structured logging rules from code quality guidelines
 */
class ConsoleLogger implements Logger {
  info(message: string, meta?: any): void {
    const timestamp = new Date().toISOString()
    if (meta) {
      console.log(`[INFO] ${timestamp} ${message}`, meta)
    } else {
      console.log(`[INFO] ${timestamp} ${message}`)
    }
  }

  warn(message: string, meta?: any): void {
    const timestamp = new Date().toISOString()
    if (meta) {
      console.warn(`[WARN] ⚠️ ${timestamp} ${message}`, meta)
    } else {
      console.warn(`[WARN] ⚠️ ${timestamp} ${message}`)
    }
  }

  error(message: string, meta?: any): void {
    const timestamp = new Date().toISOString()
    if (meta) {
      console.error(`[ERROR] ❌ ${timestamp} ${message}`, meta)
    } else {
      console.error(`[ERROR] ❌ ${timestamp} ${message}`)
    }
  }

  debug(message: string, meta?: any): void {
    if (process.env.NODE_ENV === 'development') {
      const timestamp = new Date().toISOString()
      if (meta) {
        console.log(`[DEBUG] 🔍 ${timestamp} ${message}`, meta)
      } else {
        console.log(`[DEBUG] 🔍 ${timestamp} ${message}`)
      }
    }
  }
}

/**
 * Default logger instance
 */
export const logger: Logger = new ConsoleLogger()

/**
 * Create a logger with a specific prefix
 */
export function createLogger(prefix: string): Logger {
  return {
    info: (message: string, meta?: any) => logger.info(`[${prefix}] ${message}`, meta),
    warn: (message: string, meta?: any) => logger.warn(`[${prefix}] ${message}`, meta),
    error: (message: string, meta?: any) => logger.error(`[${prefix}] ${message}`, meta),
    debug: (message: string, meta?: any) => logger.debug(`[${prefix}] ${message}`, meta)
  }
}