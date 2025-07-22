import { get, post } from '@/utils/request';
import request from '@/utils/request/axios';

// 获取笔记列表 - 不需要登录
export function fetchXhsAutoNotesAPI<T = any>(params: { 
  limit?: number, 
  page?: number,
  isUsed?: boolean
}) {
  return request.get('/xhs-auto/notes', { params });
}

// 获取笔记详情 - 不需要登录
export function getXhsAutoNoteDetailAPI<T = any>(id: string) {
  return request.get(`/xhs-auto/notes/${id}`);
}

// 标记笔记为已使用 - 不需要登录
export function markXhsAutoNoteUsedAPI<T = any>(id: string) {
  return request.post(`/xhs-auto/notes/${id}/used`);
}

// 创建笔记 - 不需要登录
export function createXhsAutoNoteAPI<T = any>(data: {
  title: string;
  content: string;
  images: string[];
  type?: string;
  video?: string;
  cover?: string;
  identifier?: string;
}) {
  return request.post('/xhs-auto/notes', data);
}

// 更新笔记 - 不需要登录
export function updateXhsAutoNoteAPI<T = any>(id: string, data: {
  title?: string;
  content?: string;
  images?: string[];
  type?: string;
  video?: string;
  cover?: string;
  identifier?: string;
  isUsed?: boolean;
}) {
  return request.patch(`/xhs-auto/notes/${id}`, data);
}

// 删除笔记 - 不需要登录
export function deleteXhsAutoNoteAPI<T = any>(id: string) {
  return request.delete(`/xhs-auto/notes/${id}`);
}

// 下载Excel导入模板 - 不需要登录
export function downloadXhsAutoTemplateAPI() {

  return fetch('/api/xhs-auto/template', {
    method: 'GET',
    credentials: 'include'
  }).then(response => {

    if (!response.ok) {
      throw new Error(`下载模板失败，服务器返回: ${response.status}`);
    }
    
    if (!response.headers.get('content-type')?.includes('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')) {
      throw new Error('下载模板失败：返回内容类型不正确');
    }
    
    return response.blob();
  });
}

// 工具函数：处理API响应
export function handleApiResponse<T = any>(response: any): T | null {
  try {
    return response?.data as T;
  } catch (error) {
    console.error('处理API响应失败:', error);
    return null;
  }
} 