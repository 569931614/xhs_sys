import api from '../index'

// 定义接口返回类型
interface ApiResponse<T = any> {
  code: number;
  success: boolean;
  message: string;
  data?: T;
}

// 提示词模板数据列表响应结构
interface PromptTemplateListResponse {
  items: any[];
  total: number;
  page: number;
  pageSize: number;
}

export default {
  // 查询提示词模板列表
  queryPromptTemplates: (params: {
    page?: number
    pageSize?: number
    identifier?: string
    modelName?: string
    status?: number
  }) => {
    // 确保数字参数被正确转换
    const queryParams = { ...params };
    if (queryParams.page) queryParams.page = Number(queryParams.page);
    if (queryParams.pageSize) queryParams.pageSize = Number(queryParams.pageSize);
    if (queryParams.status !== undefined) queryParams.status = Number(queryParams.status);
    
    return api.get('promptlib/list', { params: queryParams });
  },
  
  // 获取单个提示词模板
  getPromptTemplate: (id: number) => api.get(`promptlib/${id}`),
  
  // 创建提示词模板
  createPromptTemplate: (data: {
    identifier: string
    prompt: string
    modelName: string
    status?: number
    presetValues?: string
  }) => {
    // 确保状态参数是数字类型
    const postData = { ...data };
    if (postData.status !== undefined) postData.status = Number(postData.status);
    
    return api.post('promptlib/create', postData);
  },
  
  // 更新提示词模板
  updatePromptTemplate: (data: {
    id: number
    identifier?: string
    prompt?: string
    modelName?: string
    status?: number
    presetValues?: string
  }) => {
    // 确保数字参数是数字类型
    const postData = { ...data };
    if (postData.id) postData.id = Number(postData.id);
    if (postData.status !== undefined) postData.status = Number(postData.status);
    
    return api.post('promptlib/update', postData);
  },
  
  // 删除提示词模板
  deletePromptTemplate: (data: { id: number }) => {
    // 确保ID是数字类型
    const postData = { id: Number(data.id) };
    return api.post('promptlib/delete', postData);
  }
} 