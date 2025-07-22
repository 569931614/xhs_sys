import { get, post } from '@/utils/request';

/**
 * 生成图片
 * @param params 生成图片的参数
 */
export function generateImageAPI(params: {
  title: string;
  type: string;
  count?: number;
  intellectId?: number;
  additionalFields?: Record<string, string>;
  pageNo?: number;
  previousTaskId?: number;
}) {
  const requestData = {
    ...params,
    intellectId: params.intellectId || 267
  };
  
  return post<{
    taskId: string | number;
    currentPage?: number;
    images: {
      imageId: string;
      url: string;
      taskId?: string;
    }[];
  } | {
    data: {
      taskId: string | number;
      currentPage?: number;
      images: {
        imageId: string;
        url: string;
        taskId?: string;
      }[];
    };
  }>({
    url: '/image-generator/generate',
    data: requestData,
  });
}

/**
 * 上传图片
 * @param fileOrFormData 图片文件或FormData对象
 * @param fileName 文件名（可选，当传入File对象时使用）
 */
export function uploadImageAPI(fileOrFormData: File | FormData, fileName?: string) {
  let formData: FormData;
  
  if (fileOrFormData instanceof FormData) {
    // 如果已经是FormData对象，直接使用
    formData = fileOrFormData;
  } else {
    // 如果是File对象，创建FormData
    formData = new FormData();
    formData.append('file', fileOrFormData);
    
    if (fileName) {
      formData.append('fileName', fileName);
    }
  }
  
  return post<{
    code: number;
    data: {
      data: {
        imageId: string;
        url: string;
      }
    } | string;
    message: string;
  }>({
    url: '/image-generator/upload',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
}

/**
 * 获取用户的图片生成任务列表
 * @param params 分页参数
 */
export function getUserImageTasksAPI(params?: {
  page?: number;
  limit?: number;
}) {
  return get({
    url: '/image-generator/tasks',
    data: params,
  });
}

/**
 * 获取用户的历史生成记录
 * @param params 分页参数
 */
export function getUserHistoryTasksAPI(params?: {
  page?: number;
  limit?: number;
}) {
  return get({
    url: '/image-generator/history',
    data: params,
  });
}

/**
 * 获取任务详情
 * @param taskId 任务ID
 */
export function getTaskDetailAPI(taskId: string) {
  return get({
    url: '/image-generator/task',
    data: { taskId },
  });
}

/**
 * 根据图片ID下载图片
 * @param imageId 图片ID
 */
export function downloadImageByIdAPI(imageId: string) {
  return get({
    url: '/image-generator/download',
    data: { imageId },
  });
}

/**
 * 根据任务ID获取下载链接
 * @param taskId 任务ID
 */
export function getImageDownloadUrlAPI(taskId: string) {
  return get<{
    downloadUrl: string;
  } | {
    data: {
      downloadUrl: string;
    };
  }>({
    url: '/image-generator/download',
    data: { taskId },
  });
} 