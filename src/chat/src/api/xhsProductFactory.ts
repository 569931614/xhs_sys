import { post, get } from '@/utils/request';

// 定义API响应接口
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  status?: string;
}

// 定义活动接口
export interface Activity {
  id: string;
  name: string;
  type: string;
}

// 定义任务接口
export interface Task {
  id: string;
  brandProduct: string;
  title: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  createTime: string;
  updateTime: string;
  executeId?: string;
  activityId?: string;
  noteId?: string;
  result?: any;
  error?: string;
  batchId?: string;
  batchCount?: number;
  batchIndex?: number;
}

// 上传文件响应
export interface FileUploadResponse {
  file_id: string;
}

// 添加超时包装函数
function withTimeout<T>(promise: Promise<T>, timeoutMs = 10000): Promise<T> {
  let timeoutId: number;
  
  // 创建一个会在指定时间后拒绝的Promise
  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutId = window.setTimeout(() => {
      reject(new Error(`请求超时(${timeoutMs}ms)`));
    }, timeoutMs);
  });
  
  // 竞争两个Promise
  return Promise.race([
    promise,
    timeoutPromise
  ]).finally(() => {
    clearTimeout(timeoutId);
  });
}

// 生成小红书产品内容
export function generateProductAPI(data: {
  brandProduct: string;
  title: string;
  titleList?: string[];  // 添加选题列表参数
  activityId: string;
  fileIds: string[];
  folderIds?: string[];  // 添加文件夹ID参数
  materialIds?: string[]; // 添加素材库素材ID参数
  batchCount?: number;
  templateIds?: string[]; // 添加HTML模板ID参数
  information?: string; // 添加补充信息参数
}) {
  const processedData = {
    ...data,
    batchCount: data.batchCount ? Number(data.batchCount) : 1
  };

  return post({
    url: '/xhs/product-factory/generate',
    data: processedData
  }).then(res => {
    // 检查响应格式
    if (res && res.data) {
      // 检查嵌套的积分不足错误
      if (res.data.success === false && 
          (res.data.error === 'REGULAR_BALANCE_INSUFFICIENT' || 
           res.data.message?.includes('积分不足'))) {
        return {
          success: false,
          message: res.data.message || '积分不足，继续体验服务，请按需选购套餐！',
          error: res.data.error || 'REGULAR_BALANCE_INSUFFICIENT',
          data: res.data
        } as ApiResponse;
      }
      
      return {
        success: true,
        data: res.data,
        message: res.message || '提交成功'
      } as ApiResponse;
    } else if (res) {
      // 处理没有data字段但有success标志的情况
      const responseData = res as any;
      
      // 检查直接的积分不足错误
      if (responseData.success === false && 
          (responseData.error === 'REGULAR_BALANCE_INSUFFICIENT' || 
           responseData.message?.includes('积分不足'))) {
        return {
          success: false,
          message: responseData.message || '积分不足，继续体验服务，请按需选购套餐！',
          error: responseData.error || 'REGULAR_BALANCE_INSUFFICIENT'
        } as ApiResponse;
      }
      
      return {
        success: responseData.success !== false, // 确保success是布尔值
        message: responseData.message || (responseData.success !== false ? '提交成功' : '提交失败'),
        data: null
      } as ApiResponse;
    } else {
      // 处理空响应
      return {
        success: false,
        message: '服务器响应格式错误',
      } as ApiResponse;
    }
  }).catch(error => {
    // 处理请求错误
    console.error('生成产品内容请求失败:', error);
    return {
      success: false,
      message: '请求失败: ' + (error.message || '未知错误'),
      error: error.code || error.error || 'REQUEST_ERROR'
    } as ApiResponse;
  });
}

// 获取活动列表
export function getActivitiesAPI() {
  return get({
    url: '/xhs/product-factory/activities'
  }).then(res => res.data || []);
}

// 获取任务生成结果
export function getTaskResultAPI(taskId: string) {
  return get({
    url: '/xhs/product-factory/result',
    data: { taskId }
  }).then(res => {
    console.log('任务结果原始响应:', res);
    
    // 检查响应格式并标准化
    if (res) {
      const responseData = res as any;
      
      // 如果返回数据符合标准格式
      if (responseData.data && typeof responseData.data === 'object') {
        // 直接返回数据对象
        return responseData.data;
      }
      
      // 先检查是否已完成
      if (responseData.status === 'completed' || 
          (responseData.data && typeof responseData.data === 'object' && 
           (responseData.data.status === 'completed' || responseData.data.success === true && responseData.data.status !== 'running'))) {
        console.log('检测到已完成的任务');
        return {
          success: true,
          status: 'completed',
          message: responseData.message || '任务已完成',
          data: responseData.data || null
        } as ApiResponse;
      } 
      
      // 检查是否失败
      if (responseData.status === 'failed' || responseData.status === 'Fail' || responseData.status === 'FAILED' || 
          responseData.message?.includes('失败') || responseData.message?.includes('错误') || 
          (responseData.data && typeof responseData.data === 'object' && responseData.data.status === 'failed')) {
        console.log('检测到失败的任务');
        
        // 优先使用服务器返回的错误信息
        let errorMessage = responseData.message || '任务执行失败';
        
        // 尝试从嵌套数据结构中提取错误信息
        if (responseData.data && typeof responseData.data === 'object') {
          errorMessage = responseData.data.error || errorMessage;
        }
        
        return {
          success: false,
          status: 'failed',
          message: errorMessage,
          error: errorMessage
        } as ApiResponse;
      }
      
      // 检查是否正在运行
      if (responseData.status === 'running' || 
          (responseData.data && typeof responseData.data === 'object' && responseData.data.status === 'running')) {
        console.log('检测到运行中的任务');
        return {
          success: true,
          status: 'running',
          message: responseData.message || '任务运行中',
          data: responseData.data || null
        } as ApiResponse;
      }
      
      // 返回标准响应
      return {
        success: responseData.success !== false,
        message: responseData.message || '',
        status: responseData.status || '',
        data: responseData.data || null,
        error: responseData.message || ''
      } as ApiResponse;
    } else {
      console.warn('获取任务结果: 响应为空');
      return {
        success: false,
        message: '获取任务结果失败: 响应为空',
        status: 'error'
      } as ApiResponse;
    }
  }).catch(error => {
    console.error('获取任务结果失败:', error);
    return {
      success: false,
      message: '请求失败: ' + (error.message || '未知错误'),
      status: 'error'
    } as ApiResponse;
  });
}

// 获取用户的所有任务
export function getUserTasksAPI(status?: string) {
  console.log('getUserTasksAPI被调用，参数:', status || '全部');
  return withTimeout(get({
    url: '/xhs/product-factory/tasks',
    data: status ? { status } : {}
  })).then(res => {
    console.log('获取任务API原始响应:', res);
    
    // 处理服务器响应异常
    if (!res) {
      console.warn('getUserTasksAPI: 服务器返回空响应');
      return [];
    }
    
    const responseData = res as any;
    
    // 处理各种响应格式
    if (responseData && responseData.data) {
      // 如果是有data字段的对象
      if (Array.isArray(responseData.data)) {
        console.log(`getUserTasksAPI: 成功获取${responseData.data.length}个任务`);
        return responseData.data;
      } else {
        console.warn('getUserTasksAPI: data字段不是数组');
        return [];
      }
    } else if (responseData && Array.isArray(responseData)) {
      // 直接返回数组
      console.log(`getUserTasksAPI: 成功获取${responseData.length}个任务`);
      return responseData;
    } else if (responseData && responseData.success !== false) {
      // 有响应但没有明确的数据结构
      console.warn('getUserTasksAPI: 响应格式不包含data字段', responseData);
      return [];
    } else {
      // 响应无效或表示失败
      console.warn('getUserTasksAPI: 无效响应', responseData);
      return [];
    }
  }).catch(error => {
    console.error('getUserTasksAPI: 请求异常:', error);
    return [];
  });
}

// 批量获取任务状态
export function batchGetTaskResultsAPI(taskIds: string[]) {
  console.log('batchGetTaskResultsAPI被调用，参数:', taskIds.length, '个任务');
  
  // 定义返回结果的接口
  interface TaskResult {
    id: string;
    status?: 'pending' | 'running' | 'completed' | 'failed';
    success?: boolean;
    message?: string;
    data?: any;
    error?: string;
    noteId?: string;
  }
  
  interface BatchResult {
    success: boolean;
    message?: string;
    results: TaskResult[];
    error?: string;
  }
  
  return withTimeout(get({
    url: '/xhs/product-factory/batch-results',
    data: { taskIds: taskIds.join(',') }
  }), 15000).then(res => {
    console.log('批量获取任务状态API原始响应:', res);
    
    // 处理服务器响应异常
    if (!res) {
      console.warn('batchGetTaskResultsAPI: 服务器返回空响应');
      return { success: false, results: [] } as BatchResult;
    }
    
    const responseData = res as any;
    
    // 1. 处理标准嵌套响应：code/data/results
    if (responseData && responseData.code === 200 && responseData.data) {
      console.log('处理标准API响应格式 code/data/success/message');
      
      // 1.1 处理data.results格式
      if (responseData.data.results && Array.isArray(responseData.data.results)) {
        console.log(`找到标准嵌套results数组，长度: ${responseData.data.results.length}`);
        
        // 检查结果项是否包含必要字段
        const formattedResults = responseData.data.results.map((item: any): TaskResult => {
          // 如果缺少状态字段，给予默认值
          if (!item.status && item.success === true) {
            return { ...item, status: 'completed' };
          }
          return item;
        });
        
        return { 
          success: true, 
          message: responseData.data.message || responseData.message || '成功获取任务状态',
          results: formattedResults 
        } as BatchResult;
      }
      
      // 1.2 处理data数组格式
      if (Array.isArray(responseData.data)) {
        console.log(`找到data数组格式，长度: ${responseData.data.length}`);
        return { success: true, results: responseData.data } as BatchResult;
      }
      
      // 1.3 如果data是单个对象（可能是单任务响应）
      if (responseData.data && responseData.data.id) {
        console.log('找到单个任务响应对象');
        return { success: true, results: [responseData.data] } as BatchResult;
      }
      
      // 1.4 兜底处理data对象
      return responseData.data;
    }
    
    // 2. 处理直接包含results数组的格式
    if (responseData.results && Array.isArray(responseData.results)) {
      console.log(`找到results字段，长度: ${responseData.results.length}`);
      return responseData as BatchResult;
    }
    
    // 3. 处理直接是数组的格式
    if (Array.isArray(responseData)) {
      console.log(`响应直接是数组，长度: ${responseData.length}`);
      return { success: true, results: responseData } as BatchResult;
    }
    
    // 4. 最后兜底处理其他情况
    console.warn('无法识别的响应格式，尝试返回合理的数据结构');
    
    // 如果有success和message，保留它们
    const result: BatchResult = { 
      success: responseData?.success !== false,
      message: responseData?.message || '获取任务状态',
      results: [] 
    };
    
    // 尝试查找任何可能的结果数据
    if (responseData?.data) {
      if (Array.isArray(responseData.data)) {
        result.results = responseData.data;
      } else if (typeof responseData.data === 'object' && responseData.data !== null) {
        // 如果data是对象且有id，当作单个任务处理
        if (responseData.data.id) {
          result.results = [responseData.data];
        }
      }
    }
    
    return result;
  }).catch(error => {
    console.error('batchGetTaskResultsAPI: 请求异常:', error);
    return { success: false, results: [], error: error.message } as BatchResult;
  });
}

// 上传文件并获取file_id
export function uploadFileAPI(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  
  return post({
    url: '/coze/file/upload',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }).then(res => res.data);
}

// 素材库相关接口

// 获取素材库文件夹列表
export function getMaterialFoldersAPI() {
  return get({
    url: '/material/folders'
  });
}

// 创建素材库文件夹
export function createMaterialFolderAPI(name: string) {
  return post({
    url: '/material/folders',
    data: { name }
  });
}

// 获取素材库文件列表
export function getMaterialsAPI(folderId?: string) {
  return get({
    url: '/material/files',
    data: { folderId }
  });
}

// 上传素材到素材库
export function uploadMaterialAPI(file: File, folderId: string) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('folderId', folderId);
  
  return post({
    url: '/material/upload',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
}

// 删除素材
export function deleteMaterialAPI(id: string) {
  return post({
    url: `/material/files/${id}`,
    method: 'DELETE'
  });
}

// 从素材库选择素材
export function selectMaterialsAPI(folderIds: string[], count: number) {
  return post({
    url: '/material/select',
    data: { folderIds, count }
  });
}

// 检查素材是否有效，如果过期则刷新
export function checkMaterialValidityAPI(materialId: string) {
  return get({
    url: `/material/check/${materialId}`
  });
}

// 重试失败的任务
export function retryTaskAPI(taskId: string) {
  return post({
    url: '/xhs/product-factory/retry',
    data: { taskId }
  }).then(res => {
    console.log('重试任务API响应:', res);

    // 检查响应格式
    if (res && res.data) {
      // 检查嵌套的积分不足错误
      if (res.data.success === false &&
          (res.data.error === 'REGULAR_BALANCE_INSUFFICIENT' ||
           res.data.message?.includes('积分不足'))) {
        return {
          success: false,
          message: res.data.message || '积分不足，继续体验服务，请按需选购套餐！',
          error: res.data.error || 'REGULAR_BALANCE_INSUFFICIENT',
          data: res.data
        } as ApiResponse;
      }

      return {
        success: true,
        data: res.data,
        message: res.message || '重试任务提交成功'
      } as ApiResponse;
    } else if (res) {
      // 处理没有data字段但有success标志的情况
      const responseData = res as any;

      // 检查直接的积分不足错误
      if (responseData.success === false &&
          (responseData.error === 'REGULAR_BALANCE_INSUFFICIENT' ||
           responseData.message?.includes('积分不足'))) {
        return {
          success: false,
          message: responseData.message || '积分不足，继续体验服务，请按需选购套餐！',
          error: responseData.error || 'REGULAR_BALANCE_INSUFFICIENT'
        } as ApiResponse;
      }

      return {
        success: responseData.success !== false,
        message: responseData.message || (responseData.success !== false ? '重试任务提交成功' : '重试任务提交失败'),
        data: null
      } as ApiResponse;
    } else {
      // 处理空响应
      return {
        success: false,
        message: '服务器响应格式错误',
      } as ApiResponse;
    }
  }).catch(error => {
    // 处理请求错误
    console.error('重试任务请求失败:', error);
    return {
      success: false,
      message: '重试任务请求失败: ' + (error.message || '未知错误'),
      error: error.code || error.error || 'REQUEST_ERROR'
    } as ApiResponse;
  });
}

// 获取小红书分享签名
export function getXhsSignatureAPI() {
  return get({
    url: '/xhs-auto/signature'
  }).then(res => {
    if (res && res.data) {
      return res.data;
    }
    throw new Error('获取小红书分享签名失败');
  }).catch(error => {
    console.error('获取小红书分享签名失败:', error);
    throw error;
  });
}