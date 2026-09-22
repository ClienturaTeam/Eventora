/**
 * Eventora Platform - Enterprise Logger Utility
 * Provides structured logging with log levels, timestamps, request timing, and error formatting.
 */

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

class Logger {
  private formatTimestamp(): string {
    return new Date().toISOString();
  }

  private formatMessage(level: LogLevel, message: string, context?: Record<string, any>): string {
    const timestamp = this.formatTimestamp();
    const contextStr = context && Object.keys(context).length > 0 ? ` | Context: ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level}] ${message}${contextStr}`;
  }

  public debug(message: string, context?: Record<string, any>): void {
    if (process.env.NODE_ENV === 'test') return;
    console.debug(`\x1b[36m${this.formatMessage(LogLevel.DEBUG, message, context)}\x1b[0m`);
  }

  public info(message: string, context?: Record<string, any>): void {
    console.log(`\x1b[32m${this.formatMessage(LogLevel.INFO, message, context)}\x1b[0m`);
  }

  public warn(message: string, context?: Record<string, any>): void {
    console.warn(`\x1b[33m${this.formatMessage(LogLevel.WARN, message, context)}\x1b[0m`);
  }

  public error(message: string, error?: any, context?: Record<string, any>): void {
    const errorDetails = error
      ? {
          name: error.name,
          message: error.message || String(error),
          stack: error.stack,
          ...context,
        }
      : context;
    console.error(`\x1b[31m${this.formatMessage(LogLevel.ERROR, message, errorDetails)}\x1b[0m`);
  }

  public http(method: string, url: string, status: number, durationMs: number, context?: Record<string, any>): void {
    const color = status >= 500 ? '\x1b[31m' : status >= 400 ? '\x1b[33m' : status >= 300 ? '\x1b[36m' : '\x1b[32m';
    const message = `${method} ${url} ${status} - ${durationMs.toFixed(2)}ms`;
    console.log(`${color}[${this.formatTimestamp()}] [HTTP] ${message}\x1b[0m`);
  }
}

export const logger = new Logger();
