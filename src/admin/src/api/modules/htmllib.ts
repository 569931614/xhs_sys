import api from '@/api';
import { AxiosProgressEvent } from 'axios';

// 获取HTML模板列表
export const getHtmlTemplateList = (params: {
  page: number;
  pageSize: number;
  name?: string;
  status?: number;
}) => {
  return api.get('/htmllib/list', { params });
};

// 获取HTML模板详情
export const getHtmlTemplateDetail = (id: number) => {
  return api.get(`/htmllib/${id}`);
};

// 创建HTML模板
export const createHtmlTemplate = (data: {
  name: string;
  htmlCode: string;
  imageCount: number;
  textDetails?: string[];
  thumbnailPath?: string;
  status?: number;
  needAiContent?: boolean;
}) => {
  return api.post('/htmllib/create', data);
};

// 更新HTML模板
export const updateHtmlTemplate = (data: {
  id: number;
  name?: string;
  htmlCode?: string;
  imageCount?: number;
  textDetails?: string[];
  thumbnailPath?: string;
  status?: number;
  needAiContent?: boolean;
}) => {
  return api.post('/htmllib/update', data);
};

// 删除HTML模板
export const deleteHtmlTemplate = (id: number) => {
  return api.post('/htmllib/delete', { id });
};

// 上传HTML模板缩略图
export const uploadHtmlTemplateThumbnail = (
  file: File,
  onUploadProgress?: (progressEvent: AxiosProgressEvent) => void
) => {
  const formData = new FormData();
  formData.append('file', file);

  return api.post('/htmllib/upload-thumbnail', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    timeout: 30000, // 30秒超时时间
    onUploadProgress,
  });
}; 