"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomLoggerService = void 0;
const common_1 = require("@nestjs/common");
const fs = require("fs");
const path = require("path");
let CustomLoggerService = class CustomLoggerService extends common_1.ConsoleLogger {
    constructor() {
        super();
        this.isDev = process.env.ISDEV === 'TRUE';
        this.logDir = path.join(process.cwd(), 'logs');
        this.ensureLogDir();
        this.officialLogPath = path.join(this.logDir, 'official.log');
        this.errorLogPath = path.join(this.logDir, 'error.log');
    }
    ensureLogDir() {
        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, { recursive: true });
        }
    }
    formatLogEntry(level, message, context) {
        const timestamp = new Date().toISOString();
        return `[${timestamp}] [${level}] ${context ? `[${context}] ` : ''}${message}`;
    }
    writeToFile(filePath, message) {
        try {
            fs.appendFileSync(filePath, message + '\n');
        }
        catch (err) {
            console.error(`Failed to write to log file ${filePath}:`, err);
        }
    }
    log(message, context) {
        super.log(message, context);
        if (context && (context.includes('Official') || message.includes('notify'))) {
            this.writeToFile(this.officialLogPath, this.formatLogEntry('LOG', message, context));
        }
    }
    error(message, trace, context) {
        super.error(message, trace, context);
        const errorMsg = this.formatLogEntry('ERROR', message, context);
        this.writeToFile(this.errorLogPath, errorMsg);
        if (trace) {
            this.writeToFile(this.errorLogPath, trace);
        }
        if (context && (context.includes('Official') || message.includes('notify'))) {
            this.writeToFile(this.officialLogPath, errorMsg);
            if (trace) {
                this.writeToFile(this.officialLogPath, trace);
            }
        }
    }
    warn(message, context) {
        super.warn(message, context);
        if (context && (context.includes('Official') || message.includes('notify'))) {
            this.writeToFile(this.officialLogPath, this.formatLogEntry('WARN', message, context));
        }
    }
    debug(message, context) {
        if (this.isDev) {
            super.debug(message, context);
        }
        if (context && (context.includes('Official') || message.includes('notify'))) {
            this.writeToFile(this.officialLogPath, this.formatLogEntry('DEBUG', message, context));
        }
    }
    verbose(message, context) {
        if (this.isDev) {
            super.verbose(message, context);
        }
        if (context && (context.includes('Official') || message.includes('notify'))) {
            this.writeToFile(this.officialLogPath, this.formatLogEntry('VERBOSE', message, context));
        }
    }
};
CustomLoggerService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], CustomLoggerService);
exports.CustomLoggerService = CustomLoggerService;
