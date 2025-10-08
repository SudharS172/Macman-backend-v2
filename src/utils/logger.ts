import { config, isDevelopment } from '../config/env';

type LogLevel = 'info' | 'warn' | 'error' | 'debug' | 'success';

const colors = {
  info: '\x1b[36m',    // Cyan
  warn: '\x1b[33m',    // Yellow
  error: '\x1b[31m',   // Red
  debug: '\x1b[35m',   // Magenta
  success: '\x1b[32m', // Green
  reset: '\x1b[0m',
};

const icons = {
  info: 'ℹ️',
  warn: '⚠️',
  error: '❌',
  debug: '🔍',
  success: '✅',
};

class Logger {
  private log(level: LogLevel, message: string, ...args: any[]) {
    const timestamp = new Date().toISOString();
    const icon = icons[level];
    const color = colors[level];
    const reset = colors.reset;
    
    if (isDevelopment) {
      console.log(`${color}${icon} [${timestamp}] [${level.toUpperCase()}]${reset}`, message, ...args);
    } else {
      // In production, use JSON format for better parsing
      console.log(JSON.stringify({
        timestamp,
        level,
        message,
        data: args.length > 0 ? args : undefined,
      }));
    }
  }

  info(message: string, ...args: any[]) {
    this.log('info', message, ...args);
  }

  warn(message: string, ...args: any[]) {
    this.log('warn', message, ...args);
  }

  error(message: string, ...args: any[]) {
    this.log('error', message, ...args);
  }

  debug(message: string, ...args: any[]) {
    if (isDevelopment) {
      this.log('debug', message, ...args);
    }
  }

  success(message: string, ...args: any[]) {
    this.log('success', message, ...args);
  }
}

export const logger = new Logger();

