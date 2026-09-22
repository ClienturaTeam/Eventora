/**
 * Eventora Platform - Frontend Application Logger & Error Tracker
 * Captures, formats, and logs client-side runtime errors, API traces, and boundary exceptions.
 */

export interface AppLoggerOptions {
  mechanism?: "manual" | "onerror" | "unhandledrejection" | "react_error_boundary";
  handled?: boolean;
  severity?: "error" | "warning" | "info";
  context?: Record<string, unknown>;
}

class AppLogger {
  private formatTimestamp(): string {
    return new Date().toISOString();
  }

  public info(message: string, data?: unknown): void {
    if (process.env['NODE_ENV'] !== "production") {
      console.log(`%c[${this.formatTimestamp()}] [INFO] ${message}`, "color: #3b82f6; font-weight: bold;", data || "");
    }
  }

  public warn(message: string, data?: unknown): void {
    console.warn(`%c[${this.formatTimestamp()}] [WARN] ${message}`, "color: #f59e0b; font-weight: bold;", data || "");
  }

  public debug(message: string, data?: unknown): void {
    if (process.env['NODE_ENV'] !== "production") {
      console.debug(`%c[${this.formatTimestamp()}] [DEBUG] ${message}`, "color: #6b7280;", data || "");
    }
  }

  public error(error: unknown, options: AppLoggerOptions = {}): void {
    const route = typeof window !== "undefined" ? window.location.pathname : "SSR";
    const timestamp = this.formatTimestamp();

    const errorMessage =
      error instanceof Response
        ? `HTTP Response ${error.status} at ${error.url}`
        : error instanceof Error
        ? error.message
        : String(error);

    const stack = error instanceof Error ? error.stack : undefined;

    console.error(
      `%c[${timestamp}] [ERROR] [${options.mechanism || "manual"}] on route ${route}: ${errorMessage}`,
      "color: #ef4444; font-weight: bold;",
      {
        error,
        stack,
        route,
        ...options.context,
      }
    );
  }
}

export const appLogger = new AppLogger();

export function reportAppError(error: unknown, context: Record<string, unknown> = {}): void {
  appLogger.error(error, {
    mechanism: "react_error_boundary",
    handled: false,
    severity: "error",
    context,
  });
}
