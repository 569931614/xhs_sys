import { get, post } from '@/utils/request';
import request from '@/utils/request/axios';

// 获取小红书笔记列表
export function fetchXhsPostsAPI<T = any>(params?: { isUsed?: boolean; selfOnly?: boolean }) {
  return get<T>({
    url: '/xhs',
    data: params
  });
}

// 获取小红书笔记详情
export function fetchXhsPostDetailAPI<T = any>(id: number) {
  return get<T>({
    url: `/xhs/${id}`
  });
}

// 创建小红书笔记
export function createXhsPostAPI<T = any>(data: {
  title: string;
  content: string;
  images: string[];
  type?: string;
  video?: string;
  cover?: string;
  identifier?: string;
  activityId?: number;
}) {
  return post<T>({
    url: '/xhs',
    data
  });
}

// 更新小红书笔记
export function updateXhsPostAPI<T = any>(id: number, data: {
  title?: string;
  content?: string;
  images?: string[];
  type?: string;
  video?: string;
  cover?: string;
  identifier?: string;
  isUsed?: boolean;
}) {
  return request.patch(`/xhs/${id}`, data);
}

// 删除小红书笔记
export function deleteXhsPostAPI<T = any>(id: number) {
  return request.delete(`/xhs/${id}`);
}

// 标记小红书笔记为已使用
export function markXhsPostUsedAPI<T = any>(id: number) {
  return post<T>({
    url: `/xhs/${id}/used`
  });
}

// 标记小红书笔记为弃用
export function markXhsPostDiscardedAPI<T = any>(id: number) {
  return post<T>({
    url: `/xhs/${id}/discard`
  });
}

// 标记小红书笔记为抖音已使用
export function markXhsPostDouyinUsedAPI<T = any>(id: number) {
  return post<T>({
    url: `/xhs/${id}/douyin-used`
  });
}

// 上传图片文件
export function uploadImageAPI<T = any>(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  return post<T>({
    url: '/upload/file',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
}

// 上传Excel文件批量导入笔记
export function importExcelAPI<T = any>(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  return post<T>({
    url: '/xhs/import',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
}

// 下载Excel导入模板
export function downloadExcelTemplateAPI() {
  return fetch('/api/xhs/template', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    credentials: 'include'
  }).then(response => {
    if (!response.ok) {
      throw new Error('下载模板失败');
    }
    return response.blob();
  });
}

// 获取小红书活动类型列表
export function fetchXhsActivitiesAPI<T = any>(params?: any) {
  return get<T>({
    url: '/xhs/activities',
    data: params
  });
}

// 获取小红书活动类型统计信息
export function fetchXhsActivitiesStatsAPI<T = any>() {
  console.log('fetchXhsActivitiesStatsAPI被调用');
  return get<T>({
    url: '/xhs/activities/stats'
  }).then(res => {
    console.log('活动统计API响应:', res);
    
    // 兼容不同的响应格式
    if (res && typeof res === 'object') {
      // 直接返回整个响应对象，让调用方决定如何处理
      return res;
    } else if (Array.isArray(res)) {
      // 直接是数组的情况
      return res;
    } else {
      console.error('活动统计API响应格式异常:', res);
      // 返回空数组而不是抛出异常，增强兼容性
      return [];
    }
  }).catch(err => {
    console.error('活动统计API错误:', err);
    // 返回空数组而不是抛出异常，增强兼容性
    return [];
  });
}

// 获取小红书活动类型详情
export function fetchXhsActivityDetailAPI<T = any>(id: string | number) {
  return get<T>({
    url: `/xhs/activities/${id}`
  });
}

// 创建小红书活动类型
export function createXhsActivityAPI<T = any>(data: { name: string, type?: string, status?: string }) {
  return post<T>({
    url: '/xhs/activities',
    data
  });
}

// 更新小红书活动类型
export function updateXhsActivityAPI<T = any>(id: string | number, data: any) {
  return request.put(`/xhs/activities/${id}`, data);
}

// 删除小红书活动类型
export function deleteXhsActivityAPI<T = any>(id: string | number) {
  return request.delete(`/xhs/activities/${id}`);
}

// 将笔记添加到活动
export function addPostToActivityAPI<T = any>(data: { activityId: string | number, postId: number }) {
  return post<T>({
    url: `/xhs/activities/${data.activityId}/posts`,
    data: { postId: data.postId }
  });
}

// 从活动中移除笔记
export function removePostFromActivityAPI<T = any>(activityId: string | number, postId: string | number) {
  return request.delete(`/xhs/activities/${activityId}/post/${postId}`);
}

// 获取活动的所有笔记
export function fetchActivityPostsAPI<T = any>(id: string | number) {
  return get<T>({
    url: `/xhs/activities/${id}/posts`
  });
}

// 确保用户有默认活动
export function ensureDefaultActivityAPI<T = any>() {
  return post<T>({
    url: '/xhs/activities/ensure-default'
  });
} 

/**
 * 获取小红书分享签名
 */
export function getXhsSignatureAPI(): Promise<{
  appKey: string;
  signature: string;
  timestamp: string;
  nonce: string;
}> {
  return request.get('/xhs-auto/signature').then(res => res.data);
} 