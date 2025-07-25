// Enhanced logging utility for EllensBot frontend

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, any>;
  error?: Error;
}

class Logger {
  private logLevel: LogLevel;
  private logs: LogEntry[] = [];
  private maxLogs = 1000;

  constructor() {
    this.logLevel = process.env.NODE_ENV === 'development' ? LogLevel.DEBUG : LogLevel.WARN;
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.logLevel;
  }

  private createLogEntry(level: LogLevel, message: string, context?: Record<string, any>, error?: Error): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      error
    };
  }

  private addLog(entry: LogEntry): void {
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Send to external logging service if configured
    if (process.env.REACT_APP_LOGGING_ENDPOINT && entry.level >= LogLevel.ERROR) {
      this.sendToExternalService(entry);
    }
  }

  private async sendToExternalService(entry: LogEntry): Promise<void> {
    try {
      await fetch(process.env.REACT_APP_LOGGING_ENDPOINT!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...entry,
          userAgent: navigator.userAgent,
          url: window.location.href,
          sessionId: this.getSessionId(),
        }),
      });
    } catch (error) {
      console.error('Failed to send log to external service:', error);
    }
  }

  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('ellens-session-id');
    if (!sessionId) {
      sessionId = Date.now().toString(36) + Math.random().toString(36).substr(2);
      sessionStorage.setItem('ellens-session-id', sessionId);
    }
    return sessionId;
  }

  debug(message: string, context?: Record<string, any>): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return;
    
    const entry = this.createLogEntry(LogLevel.DEBUG, message, context);
    this.addLog(entry);
    console.debug('🐛 [DEBUG]', message, context);
  }

  info(message: string, context?: Record<string, any>): void {
    if (!this.shouldLog(LogLevel.INFO)) return;
    
    const entry = this.createLogEntry(LogLevel.INFO, message, context);
    this.addLog(entry);
    console.info('ℹ️ [INFO]', message, context);
  }

  warn(message: string, context?: Record<string, any>): void {
    if (!this.shouldLog(LogLevel.WARN)) return;
    
    const entry = this.createLogEntry(LogLevel.WARN, message, context);
    this.addLog(entry);
    console.warn('⚠️ [WARN]', message, context);
  }

  error(message: string, error?: Error, context?: Record<string, any>): void {
    if (!this.shouldLog(LogLevel.ERROR)) return;
    
    const entry = this.createLogEntry(LogLevel.ERROR, message, context, error);
    this.addLog(entry);
    console.error('🚨 [ERROR]', message, error, context);
  }

  // EllensBot specific logging methods
  chatError(message: string, error?: Error, context?: Record<string, any>): void {
    this.error(`[CHAT] ${message}`, error, { ...context, component: 'chat' });
  }

  websocketError(message: string, error?: Error, context?: Record<string, any>): void {
    this.error(`[WEBSOCKET] ${message}`, error, { ...context, component: 'websocket' });
  }

  personalityUpdate(message: string, context?: Record<string, any>): void {
    this.info(`[PERSONALITY] ${message}`, { ...context, component: 'personality' });
  }

  adminAction(message: string, context?: Record<string, any>): void {
    this.info(`[ADMIN] ${message}`, { ...context, component: 'admin' });
  }

  // Get recent logs for debugging
  getRecentLogs(count: number = 50): LogEntry[] {
    return this.logs.slice(-count);
  }

  // Export logs for troubleshooting
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  // Clear logs
  clearLogs(): void {
    this.logs = [];
  }

  // Performance monitoring
  time(label: string): void {
    console.time(`⏱️ ${label}`);
  }

  timeEnd(label: string, context?: Record<string, any>): void {
    console.timeEnd(`⏱️ ${label}`);
    this.debug(`Performance: ${label}`, context);
  }
}

// Export singleton instance
export const logger = new Logger();

// Helper for measuring performance
export const measurePerformance = <T>(fn: () => T, label: string): T => {
  logger.time(label);
  const result = fn();
  logger.timeEnd(label);
  return result;
};

// Helper for async performance measurement
export const measureAsyncPerformance = async <T>(fn: () => Promise<T>, label: string): Promise<T> => {
  logger.time(label);
  try {
    const result = await fn();
    logger.timeEnd(label);
    return result;
  } catch (error) {
    logger.timeEnd(label);
    throw error;
  }
};