import { ApiProperty } from '@nestjs/swagger';

export class TopicGenerateResponse {
  @ApiProperty({ description: '生成的选题', example: '7天见效！这款英语学习法让孩子爱上背单词' })
  topic: string;

  @ApiProperty({ description: '可选的多个选题列表', type: [String], required: false, example: ['7天见效！这款英语学习法让孩子爱上背单词', '英语启蒙不再难，3步让孩子爱上学习'] })
  topicList?: string[];

  @ApiProperty({ description: '是否成功', example: true })
  success: boolean;

  @ApiProperty({ description: '错误信息（如果有）', example: '生成选题失败，请重试', required: false })
  message?: string;
  
  @ApiProperty({ description: '返回的结构化JSON数据', required: false, type: 'object' })
  data?: any;
} 