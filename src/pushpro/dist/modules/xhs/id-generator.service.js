"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IdGeneratorService = void 0;
const common_1 = require("@nestjs/common");
let IdGeneratorService = class IdGeneratorService {
    constructor() {
        this.sequence = 0;
        this.lastTimestamp = 0;
    }
    generateId() {
        let timestamp = Date.now();
        if (timestamp === this.lastTimestamp) {
            this.sequence = (this.sequence + 1) % 4096;
            if (this.sequence === 0) {
                while (timestamp <= this.lastTimestamp) {
                    timestamp = Date.now();
                }
            }
        }
        else {
            this.sequence = 0;
        }
        this.lastTimestamp = timestamp;
        const random = Math.floor(Math.random() * 1024);
        const id = (timestamp << 22) | (this.sequence << 10) | random;
        return Math.abs(id);
    }
    generateStringId() {
        const now = new Date();
        const dateStr = (now.getMonth() + 1).toString().padStart(2, '0') +
            now.getDate().toString().padStart(2, '0') +
            now.getHours().toString().padStart(2, '0') +
            now.getMinutes().toString().padStart(2, '0');
        this.sequence = (this.sequence + 1) % 1000;
        const seqStr = this.sequence.toString().padStart(3, '0');
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        const randomStr = chars.charAt(Math.floor(Math.random() * chars.length)) +
            chars.charAt(Math.floor(Math.random() * chars.length));
        return dateStr + seqStr + randomStr;
    }
};
IdGeneratorService = __decorate([
    (0, common_1.Injectable)()
], IdGeneratorService);
exports.IdGeneratorService = IdGeneratorService;
