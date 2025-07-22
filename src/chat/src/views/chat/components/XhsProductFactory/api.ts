import { fetchXhsActivitiesStatsAPI } from '@/api/xhs';
import { uploadFileAPI, getUserTasksAPI, getTaskResultAPI, generateProductAPI, batchGetTaskResultsAPI } from '@/api/xhsProductFactory';
import { Activity, Task } from './types';
import { generateRandomId } from './utils';
import { get, post } from '@/utils/request';

// 处理API错误
function handleApiError(error: any) {
  console.error('API请求失败:', error);
  
  // 判断是否为认证错误
  if (error?.response?.status === 401 || 
      error?.message?.includes('401') || 
      error?.message?.includes('认证') || 
      error?.message?.includes('登录')) {
    // 如果在实际项目中需要清除token和设置登录弹窗，这里需要导入authStore
    // authStore.removeToken();
    // authStore.setLoginDialog(true);
    console.error('认证错误，需要重新登录');
  }
}

// 获取活动列表API封装
export async function fetchUserActivities(activities: Activity[], loadingActivities: { value: boolean }) {
  console.log('fetchUserActivities被调用');
  loadingActivities.value = true;
  try {
    console.log('正在请求活动列表API...');
    const response = await fetchXhsActivitiesStatsAPI();
    console.log('活动列表API响应:', response);
    
    // 检查是否有 data 属性并处理数据
    if (response?.data) {
      // 处理 API 返回数据
      const activitiesData = Array.isArray(response.data) ? response.data : [response.data];
      
      // 返回处理后的活动列表
      return activitiesData.map(activity => ({
        id: activity.id || generateRandomId('a'),
        name: activity.name,
        type: activity.type,
        status: activity.status,
        isDefault: activity.isDefault,
        totalNotes: activity.totalNotes || 0,
        availableNotes: activity.availableNotes || 0,
        publishedNotes: activity.publishedNotes || 0
      }));
    } else if (Array.isArray(response)) {
      // 直接是数组的情况
      return response.map(activity => ({
        id: activity.id || generateRandomId('a'),
        name: activity.name,
        type: activity.type,
        status: activity.status,
        isDefault: activity.isDefault,
        totalNotes: activity.totalNotes || 0,
        availableNotes: activity.availableNotes || 0,
        publishedNotes: activity.publishedNotes || 0
      }));
    }
    
    // 如果没有返回数据，则返回空数组
    return [];
  } catch (error: any) {
    console.error('获取活动列表失败:', error);
    console.error('错误详情:', error.message, error.stack);
    handleApiError(error);
    // 返回空数组，让调用方处理
    return [];
  } finally {
    loadingActivities.value = false;
    console.log('fetchUserActivities执行完成');
  }
}

// 获取用户任务列表API封装
export async function fetchUserTasks() {
  console.log('fetchUserTasks被调用');
  try {
    console.log('开始获取任务列表...');
    
    console.log('发送获取任务列表请求...');
    const response = await getUserTasksAPI();
    console.log('任务列表API响应:', JSON.stringify(response));
    
    // 检查响应数据
    let tasksData: any[] = [];
    
    // 处理不同的响应格式情况
    if (response && typeof response === 'object' && 'data' in response && Array.isArray(response.data)) {
      // 有data字段且是数组
      console.log('响应中包含data数组字段');
      tasksData = response.data;
    } else if (Array.isArray(response)) {
      // 直接是数组
      console.log('响应直接是数组');
      tasksData = response;
    } else if (response && typeof response === 'object' && 'data' in response) {
      // 有data字段但不是数组
      console.warn('任务列表响应格式不是数组:', JSON.stringify((response as any).data));
      tasksData = [];
    } else {
      // 没有可用数据
      console.warn('未获取到任务列表数据, 响应:', JSON.stringify(response));
      tasksData = [];
    }
    
    if (tasksData && tasksData.length > 0) {
      // 先对任务进行分组和排序
      const sortedTasks = (() => {
        // 处理每个任务，确保日期字段格式统一
        const processedTasks = tasksData.map((task: any) => {
          const createTime = task.created_at || task.createTime || new Date().toISOString();
          return {
            ...task,
            normalizedCreateTime: new Date(createTime).getTime()
          };
        });

        // 按批次ID分组，主要是为了保持批次内的顺序
        const batchGroups: Record<string, any[]> = {};
        const singleTasks: any[] = [];

        processedTasks.forEach((task: any) => {
          if (task.batchId) {
            if (!batchGroups[task.batchId]) {
              batchGroups[task.batchId] = [];
            }
            batchGroups[task.batchId].push(task);
          } else {
            singleTasks.push(task);
          }
        });

        // 对每个批次内的任务按batchIndex排序
        Object.keys(batchGroups).forEach(batchId => {
          batchGroups[batchId].sort((a: any, b: any) => (a.batchIndex || 1) - (b.batchIndex || 1));
        });

        // 合并所有任务
        let allTasks: any[] = [];
        
        // 添加批次任务，每个批次作为一个整体
        Object.keys(batchGroups).forEach(batchId => {
          allTasks = allTasks.concat(batchGroups[batchId]);
        });
        
        // 添加单个任务
        allTasks = allTasks.concat(singleTasks);
        
        // 按创建时间排序所有任务（新的在前）
        allTasks.sort((a: any, b: any) => {
          return b.normalizedCreateTime - a.normalizedCreateTime;
        });
        
        return allTasks;
      })();

      // 映射任务数据
      return sortedTasks.map((task: any) => {
        // 获取规范化的任务状态
        let normalizedStatus: 'pending' | 'running' | 'completed' | 'failed' = 'pending';
        const rawStatus = task.status?.toLowerCase() || '';
        
        if (rawStatus === 'pending' || rawStatus === 'waiting') {
          normalizedStatus = 'pending';
        } else if (rawStatus === 'running' || rawStatus === 'processing') {
          normalizedStatus = 'running';
        } else if (rawStatus === 'completed' || rawStatus === 'succeeded' || rawStatus === 'success') {
          normalizedStatus = 'completed';
        } else if (rawStatus === 'failed' || rawStatus === 'error') {
          normalizedStatus = 'failed';
        }
        
        // 映射到任务对象，确保所有必要字段都存在
        const mappedTask: Task = {
          id: task.id || generateRandomId('task'),
          brandProduct: task.brandProduct || task.brand_product || '未命名产品',
          title: task.title || '未命名任务',
          status: normalizedStatus,
          createTime: task.created_at || task.createTime || new Date().toISOString(),
          updateTime: task.updated_at || task.updateTime || task.created_at || new Date().toISOString(),
          executeId: task.executeId || task.execute_id,
          activityId: task.activityId || task.activity_id,
          noteId: task.noteId || task.note_id,
          result: task.result || null,
          error: task.error || null,
          // 添加批量任务相关字段
          batchId: task.batchId || task.batch_id,
          batchCount: task.batchCount || task.batch_count || 1,
          batchIndex: task.batchIndex || task.batch_index || 1
        };
        
        return mappedTask;
      });
    }
    
    // 如果没有任务数据，返回空数组
    return [];
    
  } catch (error: any) {
    console.error('获取任务列表失败:', error);
    console.error('错误详情:', error.message, error.stack);
    handleApiError(error);
    // 返回空数组，让调用方处理错误
    return [];
  }
}

// 批量刷新任务状态
export async function batchRefreshTaskStatus(taskIds: string[]): Promise<any[]> {
  if (!taskIds || taskIds.length === 0) {
    console.warn('批量刷新任务状态: 没有提供任务ID');
    return Promise.resolve([]);
  }
  
  console.log(`批量刷新 ${taskIds.length} 个任务的状态`);
  try {
    // 使用批量API获取任务状态
    const response = await batchGetTaskResultsAPI(taskIds);
    console.log('批量刷新任务状态响应:', response);
    
    // 处理多层嵌套的情况
    if (response && response.data && response.data.results && Array.isArray(response.data.results)) {
      console.log(`成功获取到嵌套在data中的${response.data.results.length}个任务状态`);
      return response.data.results;
    }
    
    // 处理直接返回结果数组的情况
    if (response && response.results && Array.isArray(response.results)) {
      console.log(`成功获取到${response.results.length}个任务状态`);
      return response.results;
    }
    
    // 处理直接是数组的情况
    if (Array.isArray(response)) {
      console.log(`成功获取到${response.length}个任务状态（数组形式）`);
      return response;
    }
    
    // 如果响应是对象但没有results字段，检查是否有data字段且data是数组
    if (response && response.data && Array.isArray(response.data)) {
      console.log(`成功获取到${response.data.length}个任务状态（data数组形式）`);
      return response.data;
    }
    
    console.warn('批量刷新任务状态: 无法解析响应数据结构:', response);
    return [];
  } catch (error: any) {
    console.error('批量刷新任务状态失败:', error);
    return [];
  }
}

// 单个任务刷新状态API封装
export async function refreshTaskStatus(taskId: string): Promise<any> {
  if (!taskId) return null;
  
  try {
    console.log(`开始刷新任务状态 [${taskId}]...`);
    const response = await getTaskResultAPI(taskId);
    console.log(`获取任务状态响应:`, response);
    
    if (response) {
      return response;
    } else {
      console.warn(`刷新任务状态失败: 任务 ${taskId} 响应为空`);
      return null;
    }
  } catch (error: any) {
    console.error(`刷新任务状态异常:`, error);
    handleApiError(error);
    return null;
  }
}

// 提交产品生成请求API封装
export async function submitProductGeneration(formData: any) {
  try {
    console.log('准备提交的数据:', JSON.stringify(formData));
    
    // 调用接口生成产品
    const response = await generateProductAPI(formData);
    console.log('提交响应:', JSON.stringify(response));
    
    return response;
  } catch (error: any) {
    console.error('表单提交异常:', error);
    console.error('异常详情:', error.message, error.stack);
    handleApiError(error);
    throw error; // 抛出错误，让调用方处理
  }
}

// 通用API响应处理
const processResponse = (response: any) => {
  if (!response || response.error) {
    const error = new Error(response?.error?.message || '请求失败');
    throw error;
  }
  return response;
};

// 文件上传API封装
export async function uploadFile(file: File) {
  try {
    console.log(`上传文件: ${file.name}, 大小: ${file.size} 字节`);
    const fileId = await uploadFileAPI(file);
    console.log(`文件上传成功，获取到fileId: ${fileId}`);
    return fileId;
  } catch (error: any) {
    console.error(`上传文件 ${file.name} 失败:`, error);
    throw error; // 抛出错误，让调用方处理
  }
}

// 获取素材库文件夹列表
export async function getMaterialFolders() {
  try {
    console.log('请求素材库文件夹列表');
    const response = await get({
      url: '/material/folders'
    });
    console.log('素材库文件夹API响应:', response);
    
    // 验证响应数据格式
    if (!response) {
      console.error('响应为空');
      return { success: true, data: [] };
    }
    
    // 处理多种可能的响应格式
    let folderData = [];
    if (response.data && Array.isArray(response.data)) {
      folderData = response.data;
    } else if (response.data && typeof response.data === 'object') {
      folderData = [response.data];
    } else if (Array.isArray(response)) {
      folderData = response;
    }
    
    console.log(`处理后获取到 ${folderData.length} 个文件夹`);
    return { success: true, data: folderData };
  } catch (error: any) {
    console.error('获取素材库文件夹列表失败:', error);
    if (error?.response?.status === 401) {
      // 处理认证错误
      handleApiError(error);
    }
    // 返回空数组而不是抛出异常，增强兼容性
    return { success: true, data: [] };
  }
}

// 创建素材库文件夹
export async function createMaterialFolder(name: string) {
  try {
    console.log('创建素材库文件夹:', name);
    const response = await post({
      url: '/material/folders',
      data: { name }
    });
    console.log('创建文件夹API响应:', response);
    return processResponse(response);
  } catch (error: any) {
    console.error('创建素材库文件夹失败:', error);
    // 如果是认证错误，使用handleApiError处理（可能需要登录）
    if (error?.response?.status === 401) {
      handleApiError(error);
    }
    throw error;
  }
}

// 获取素材库文件列表，支持folderId='1'表示获取所有素材
export async function getMaterials(folderId?: string) {
  try {
    console.log('请求素材库文件列表, 文件夹ID:', folderId);
    // 始终传递folderId参数，包括特殊值'1'表示获取所有素材
    const response = await get({
      url: '/material/files',
      data: { folderId } // 始终传递，即使是空值或'1'
    });
    console.log('素材列表API响应:', response);
    return processResponse(response);
  } catch (error: any) {
    console.error('获取素材库文件列表失败:', error);
    // 返回空数组而不是抛出异常，增强兼容性
    return { success: true, data: [] };
  }
}

// 上传素材到素材库
export async function uploadMaterial(file: File, folderId: string) {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folderId', folderId);
    
    const response = await post({
      url: '/material/upload',
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return processResponse(response);
  } catch (error: any) {
    console.error('上传素材失败:', error);
    throw error;
  }
}

// 上传文件到图床并与文件夹关联
export async function uploadFileToPicBed(file: File, folderId?: string) {
  try {
    const formData = new FormData();
    formData.append('file', file);
    if (folderId) {
      formData.append('folderId', folderId);
    }
    const response = await post({
      url: '/material/upload-file-picbed',
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return processResponse(response);
  } catch (error: any) {
    console.error('上传文件到图床失败:', error);
    throw error;
  }
}

// 删除素材
export async function deleteMaterial(id: string) {
  try {
    const response = await post({
      url: `/material/files/delete`,
      data: { id }
    });
    return processResponse(response);
  } catch (error: any) {
    console.error('删除素材失败:', error);
    throw error;
  }
}

// 删除素材文件夹
export async function deleteMaterialFolder(id: string) {
  try {
    console.log('发送删除文件夹请求, ID:', id);
    
    // 检查ID是否有效
    if (!id) {
      console.error('文件夹ID为空');
      throw new Error('文件夹ID不能为空');
    }
    
    // 确保id是作为对象中的属性发送
    const requestData = { id };
    console.log('发送的请求数据:', requestData);
    
    // 添加认证头和额外配置
    const headers = {
      'Content-Type': 'application/json'
      // 认证头会由axios拦截器自动添加
    };
    
    const response = await post({
      url: `/material/folders/delete`,
      data: requestData,
      headers,
      // 添加重定向处理
      beforeRequest: () => {
        console.log('准备发送删除文件夹请求...');
      },
      afterRequest: () => {
        console.log('删除文件夹请求处理完成');
      }
    });
    
    console.log('删除文件夹请求发送成功，响应:', response);
    return processResponse(response);
  } catch (error: any) {
    console.error('删除素材文件夹失败:', error);
    
    // 输出更详细的错误信息
    if (error.response) {
      console.error('错误响应状态:', error.response.status);
      console.error('错误响应数据:', error.response.data);
      
      // 处理302重定向
      if (error.response.status === 302) {
        console.error('请求被重定向，可能是认证问题，尝试重新登录');
        // 可以触发重新登录逻辑
        const authStore = window['useAuthStore'] && window['useAuthStore']();
        if (authStore) {
          authStore.removeToken();
          authStore.setLoginDialog && authStore.setLoginDialog(true);
        }
      }
    }
    
    throw error;
  }
}

// 从素材库选择素材, 支持folderIds包含'1'表示获取所有素材
export async function selectMaterials(folderIds: string[], count: number) {
  try {
    console.log('从素材库选择素材, folderIds:', folderIds, 'count:', count);
    // 注意: folderIds中包含'1'时表示获取用户的所有素材，不限文件夹
    const response = await post({
      url: '/material/select',
      data: { folderIds, count }
    });
    return processResponse(response);
  } catch (error: any) {
    console.error('从素材库选择素材失败:', error);
    throw error;
  }
}

// 检查素材是否有效，如果过期则刷新
export async function checkMaterialValidity(materialId: string) {
  try {
    const response = await get({
      url: `/material/check/${materialId}`
    });
    return processResponse(response);
  } catch (error: any) {
    console.error('检查素材有效性失败:', error);
    throw error;
  }
} 