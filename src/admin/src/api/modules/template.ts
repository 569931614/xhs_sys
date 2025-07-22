import api from '../index'

// 定义接口返回类型
interface ApiResponse<T = any> {
  code: number;
  success: boolean;
  message: string;
  data?: T;
}

// 模板数据列表响应结构
interface TemplateListResponse {
  items: TemplateItem[];
  total: number;
  page: number;
  pageSize: number;
}

// 模板项定义
interface TemplateItem {
  id: number;
  name: string;
  filePath: string;
  imageCount: number;
  textCount: number;
  textDetails: string;
  createdAt: string;
  fileSize: number;
}

export default {
  // 查询模板列表
  queryTemplates: (params: {
    page?: number;
    pageSize?: number;
    name?: string;
  }) => {
    // 确保数字参数被正确转换
    const queryParams = { ...params };
    if (queryParams.page) queryParams.page = Number(queryParams.page);
    if (queryParams.pageSize) queryParams.pageSize = Number(queryParams.pageSize);
    
    return api.get('template/list', { params: queryParams });
  },
  
  // 获取单个模板
  getTemplate: (id: number) => api.get(`template/${id}`),
  
  // 创建模板
  createTemplate: (data: {
    name: string;
    filePath: string;
    imageCount: number;
    textCount: number;
    textDetails: string;
  }) => {
    return api.post('template/create', data);
  },
  
  // 上传模板文件
  uploadTemplateFile: (formData: FormData, onProgress?: (percentage: number) => void) => {
    // 直接使用简单的请求配置，避免过度复杂的处理
    return api.post('template/upload', formData, {
      headers: {
        // 只设置必要的头信息
        'Content-Type': 'multipart/form-data'
      },
      // 设置较长的超时时间
      timeout: 300000, // 5分钟超时
      // 添加上传进度回调
      onUploadProgress: (progressEvent: any) => {
        if (progressEvent.total && onProgress) {
          const percentage = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentage);
        }
      }
    });
  },
  
  // 删除模板
  deleteTemplate: (data: { id: number }) => {
    return api.post('template/delete', { id: Number(data.id) });
  },
  
  // 下载模板
  getDownloadUrl: (id: number) => {
    const token = localStorage.getItem('token') || '';
    return `${api.defaults.baseURL}template/download?id=${id}&token=${token}`;
  }
}