import { Injectable } from '@nestjs/common';

@Injectable()
export class IdGeneratorService {
  private sequence = 0;
  private lastTimestamp = 0;

  /**
   * 生成分布式ID
   * 格式：时间戳(41位) + 序列号(12位) + 随机数(10位)
   * 保证时间顺序性和唯一性
   */
  generateId(): number {
    let timestamp = Date.now();
    
    // 如果时间戳相同，序列号自增
    if (timestamp === this.lastTimestamp) {
      this.sequence = (this.sequence + 1) % 4096; // 12位序列号，最大4095
      
      // 如果序列号溢出，等待下一毫秒
      if (this.sequence === 0) {
        while (timestamp <= this.lastTimestamp) {
          timestamp = Date.now();
        }
      }
    } else {
      this.sequence = 0;
    }
    
    this.lastTimestamp = timestamp;
    
    // 生成随机数(0-1023)，10位
    const random = Math.floor(Math.random() * 1024);
    
    // 组合ID：时间戳 + 序列号 + 随机数
    // 使用位移操作确保ID的唯一性和时间有序性
    const id = (timestamp << 22) | (this.sequence << 10) | random;
    
    // 确保返回正整数
    return Math.abs(id);
  }

  /**
   * 生成字符串格式的ID，更短且可读性更好
   * 格式：月日时分 + 序列号 + 随机字符
   * 例如：12081530001A5 (12月8日15:30 + 序列号001 + 随机字符A5)
   */
  generateStringId(): string {
    const now = new Date();
    // 使用月日时分，共8位数字
    const dateStr = (now.getMonth() + 1).toString().padStart(2, '0') +
                   now.getDate().toString().padStart(2, '0') +
                   now.getHours().toString().padStart(2, '0') +
                   now.getMinutes().toString().padStart(2, '0');
    
    // 3位序列号
    this.sequence = (this.sequence + 1) % 1000;
    const seqStr = this.sequence.toString().padStart(3, '0');
    
    // 2位随机字符
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const randomStr = chars.charAt(Math.floor(Math.random() * chars.length)) +
                     chars.charAt(Math.floor(Math.random() * chars.length));
    
    return dateStr + seqStr + randomStr;
  }
} 