import { get, post } from '@/utils/request';
import { useAuthStore } from '@/store';

// API基础URL
const API_BASE_URL = '/api';

// AI选题配置接口
export interface AiTopicConfig {
  industry: string;    // 行业/领域
  audience: string;    // 目标人群
  product: string;     // 核心产品/服务/主题
  location: string;    // 地点
  painPoint: string;   // 独特卖点/核心痛点
}

// 选题生成响应接口
export interface TopicGenerateResponse {
  topic: string;
  topicList?: string[];  // 添加多选题列表
  success: boolean;
  message?: string;
  data?: any;  // 添加结构化JSON数据
}

// 保存AI选题配置
export async function saveAiTopicSettingsAPI(config: AiTopicConfig) {
  try {
    // 使用项目提供的post方法而不是直接使用axios
    const response = await post({
      url: '/user/ai-topic-settings',
      data: config
    });
    return response.data;
  } catch (error) {
    console.error('保存AI选题配置失败:', error);
    throw error;
  }
}

// 获取保存的AI选题配置
export async function getAiTopicSettingsAPI(): Promise<AiTopicConfig> {
  try {
    // 使用项目提供的get方法而不是直接使用axios
    const response = await get({
      url: '/user/ai-topic-settings'
    });
    return response.data as AiTopicConfig;
  } catch (error) {
    console.error('获取AI选题配置失败:', error);
    throw error;
  }
}

// 调用AI生成选题(可生成单个或多个选题)
export async function generateTopicAPI(config: AiTopicConfig, count: number = 3): Promise<TopicGenerateResponse> {
  try {
    // 使用项目提供的post方法而不是直接使用axios
    const response = await post<{
      topic: string;
      topicList?: string[];
      success: boolean;
      message?: string;
      data?: any;
    }>({
      url: `/chatgpt/generate-topic?count=${count}`,
      data: config
    });
    
    // 从response.data中提取所需字段
    return {
      topic: response.data.topic,
      topicList: response.data.topicList || [response.data.topic],
      success: response.data.success,
      message: response.data.message,
      data: response.data.data // 确保传递data字段
    };
  } catch (error) {
    console.error('生成选题失败:', error);
    // 发生错误时返回一个错误响应
    return {
      topic: '',
      topicList: [],
      success: false,
      message: error instanceof Error ? error.message : '生成选题失败'
    };
  }
}

// 为保持兼容性，保留旧API名称，但内部调用统一方法
export const generateMultipleTopicsAPI = generateTopicAPI; 