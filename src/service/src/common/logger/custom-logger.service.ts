import { ConsoleLogger, Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class CustomLoggerService extends ConsoleLogger {
  private isDev: boolean;
  private logDir: string;
  private officialLogPath: string;
  private errorLogPath: string;

  constructor() {
    super();
    this.isDev = process.env.ISDEV === 'TRUE';
    this.logDir = path.join(process.cwd(), 'logs');
    this.ensureLogDir();
    this.officialLogPath = path.join(this.logDir, 'official.log');
    this.errorLogPath = path.join(this.logDir, 'error.log');
  }

  private ensureLogDir() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  private formatLogEntry(level: string, message: string, context?: string): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level}] ${context ? `[${context}] ` : ''}${message}`;
  }

  private writeToFile(filePath: string, message: string) {
    try {
      fs.appendFileSync(filePath, message + '\n');
    } catch (err) {
      console.error(`Failed to write to log file ${filePath}:`, err);
    }
  }

  log(message: string, context?: string) {
    super.log(message, context); // 在任何环境下都输出 log 级别日志
    
    if (context && (context.includes('Official') || message.includes('notify'))) {
      // 对于官方模块的日志，写入专门的文件
      this.writeToFile(this.officialLogPath, this.formatLogEntry('LOG', message, context));
    }
  }

  error(message: string, trace?: string, context?: string) {
    super.error(message, trace, context); // 在任何环境下都输出 error 级别日志
    
    // 所有错误都记录到错误日志文件
    const errorMsg = this.formatLogEntry('ERROR', message, context);
    this.writeToFile(this.errorLogPath, errorMsg);
    
    if (trace) {
      this.writeToFile(this.errorLogPath, trace);
    }
    
    // 官方模块的错误也记录到官方日志
    if (context && (context.includes('Official') || message.includes('notify'))) {
      this.writeToFile(this.officialLogPath, errorMsg);
      if (trace) {
        this.writeToFile(this.officialLogPath, trace);
      }
    }
  }

  warn(message: string, context?: string) {
    super.warn(message, context); // 在所有环境下都输出 warn 级别日志
    
    if (context && (context.includes('Official') || message.includes('notify'))) {
      // 对于官方模块的警告，写入专门的文件
      this.writeToFile(this.officialLogPath, this.formatLogEntry('WARN', message, context));
    }
  }

  debug(message: string, context?: string) {
    if (this.isDev) {
      super.debug(message, context); // 仅在开发环境下输出 debug 级别日志
    }
    
    if (context && (context.includes('Official') || message.includes('notify'))) {
      // 对于官方模块的调试信息，写入专门的文件
      this.writeToFile(this.officialLogPath, this.formatLogEntry('DEBUG', message, context));
    }
  }

  verbose(message: string, context?: string) {
    if (this.isDev) {
      super.verbose(message, context); // 仅在开发环境下输出 verbose 级别日志
    }
    
    if (context && (context.includes('Official') || message.includes('notify'))) {
      // 对于官方模块的详细信息，写入专门的文件
      this.writeToFile(this.officialLogPath, this.formatLogEntry('VERBOSE', message, context));
    }
  }
}
