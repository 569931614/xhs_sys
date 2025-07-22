import { ApiProperty } from '@nestjs/swagger';

export class SignatureDto {
  @ApiProperty({ description: 'App Key' })
  appKey: string;
  
  @ApiProperty({ description: '签名数据' })
  signature: string;
  
  @ApiProperty({ description: '时间戳' })
  timestamp: string;
  
  @ApiProperty({ description: '随机数' })
  nonce: string;
} 