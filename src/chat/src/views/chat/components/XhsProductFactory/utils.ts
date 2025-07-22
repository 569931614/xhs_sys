import { Task, BatchCompletionStatus, BatchStatus } from './types';
import { checkUserFunctionAccess, checkUserFunctionPoint } from '@/api/userFunction';
import { ElMessage } from 'element-plus';
import { useAuthStore } from '@/store';

// 添加一个函数来检查和记录身份验证状态
export function checkAuthStatus(): {isLoggedIn: boolean, hasToken: boolean, token?: string} {
  const authStore = useAuthStore();
  const token = authStore.token;
  const isLoggedIn = authStore.isLogin;
  
  console.log('身份验证状态检查:', {
    isLoggedIn,
    hasToken: !!token,
    tokenLength: token ? token.length : 0,
    tokenPrefix: token ? token.substring(0, 10) + '...' : 'null',
    userInfo: authStore.userInfo ? '已加载' : '未加载',
  });
  
  return {isLoggedIn, hasToken: !!token, token};
}

// 生成唯一ID的函数
export const generateRandomId = (prefix: string = '') => {
  // 使用简短时间戳的最后6位 + 随机字符串，提高唯一性
  const timestamp = Date.now().toString().slice(-6);
  const randomStr = Math.random().toString(36).substring(2, 7);
  return prefix ? `${prefix}_${timestamp}${randomStr}` : `${timestamp}${randomStr}`;
};

// 格式化错误信息
export function formatErrorMessage(errorMessage: string): string {
  // 截断过长的错误信息
  if (errorMessage.length > 200) {
    return errorMessage.substring(0, 200) + '...';
  }
  return errorMessage;
}

// 获取批次是否折叠的方法
export function isBatchCollapsed(batchCollapsedState: Record<string, boolean>, batchId: string): boolean {
  return !!batchCollapsedState[batchId];
}

// 获取批次任务总数和完成数量
export function getBatchCompletionStatus(tasks: Task[]): BatchCompletionStatus {
  if (tasks.length === 0) {
    return { total: 0, completed: 0, failed: 0, inProgress: 0 };
  }
  
  const completedCount = tasks.filter(t => t.status === 'completed').length;
  const failedCount = tasks.filter(t => t.status === 'failed').length;
  const totalCount = tasks.length;
  
  return {
    total: totalCount,
    completed: completedCount,
    failed: failedCount,
    inProgress: totalCount - completedCount - failedCount
  };
}

// 获取批次标题
export function getBatchTitle(tasks: Task[], activities?: any[]): string {
  if (tasks.length === 0) return '批量任务';
  
  // 获取活动名称
  const firstTask = tasks[0];
  if (firstTask.activityId && activities && activities.length > 0) {
    const activity = activities.find(a => a.id === firstTask.activityId);
    if (activity) {
      // 限制活动名称长度，超过10个字显示省略号
      let activityName = activity.name;
      if (activityName.length > 10) {
        activityName = activityName.substring(0, 10) + '...';
      }
      return `活动名称: ${activityName}`;
    }
  }
  
  // 如果没有活动名称，返回空字符串
  return '';
}

// 获取批次状态
export function getBatchStatus(tasks: Task[], batchId: string): BatchStatus {
  const batchTasks = tasks.filter(t => t.batchId === batchId);
  const statuses = new Set(batchTasks.map(t => t.status));
  
  if (statuses.size === 1) {
    return batchTasks[0].status;
  }
  
  // 如果存在失败的任务但不是全部失败
  if (statuses.has('failed') && statuses.size > 1) {
    return 'mixed';
  }
  
  // 如果存在进行中的任务
  if (statuses.has('pending') || statuses.has('running')) {
    return 'running';
  }
  
  // 如果既有完成的又有其他状态
  return 'mixed';
}

// 对任务进行分组
export const getGroupedTasks = (tasksList: Task[]) => {
  const result: Array<{type: string, id: string, tasks: Task[], createTime: number}> = [];
  const batchGroups: Record<string, Task[]> = {};
  const singleTasks: Task[] = [];
  
  // 分组任务
  tasksList.forEach(task => {
    if (task.batchId) {
      if (!batchGroups[task.batchId]) {
        batchGroups[task.batchId] = [];
      }
      batchGroups[task.batchId].push(task);
    } else {
      singleTasks.push(task);
    }
  });
  
  // 处理批次任务，并记录每个批次的创建时间
  Object.keys(batchGroups).forEach(batchId => {
    if (!batchId) return; // 跳过空批次ID
    
    // 对每个批次内的任务按batchIndex排序
    const sortedBatchTasks = batchGroups[batchId].sort((a, b) => (a.batchIndex || 1) - (b.batchIndex || 1));
    
    // 获取批次的创建时间（使用批次中第一个任务的创建时间）
    const firstTask = sortedBatchTasks[0];
    const createTime = new Date(firstTask.createTime).getTime();
    
    result.push({
      type: 'batch',
      id: batchId,
      tasks: sortedBatchTasks,
      createTime: createTime
    });
  });
  
  // 处理单独任务
  singleTasks.forEach(task => {
    result.push({
      type: 'single',
      id: task.id,
      tasks: [task],
      createTime: new Date(task.createTime).getTime()
    });
  });
  
  // 按创建时间对所有任务组排序（新任务在前）
  result.sort((a, b) => b.createTime - a.createTime);
  
  return result;
};

/**
 * 检查用户是否有权限使用某个功能
 * @param functionId 功能ID
 * @returns 是否有权限使用
 */
export async function checkFunctionAvailability(functionId: string): Promise<boolean> {
  try {
    // 检查身份验证状态
    const authStatus = checkAuthStatus();
    if (!authStatus.isLoggedIn) {
      console.warn(`功能检查失败: 用户未登录，functionId=${functionId}`);
      ElMessage.warning('请先登录后再使用该功能');
      return false;
    }
    
    console.log(`开始检查功能可用性: ${functionId}`);
    const response = await checkUserFunctionAccess<{isAvailable: boolean}>(functionId);
    console.log(`功能可用性检查响应:`, response);
    
    if (!response.data?.isAvailable) {
      const functionNames: Record<string, string> = {
        'xhs_materials': '素材库',
        'ai_title': 'AI选题'
      };
      const functionName = functionNames[functionId] || '该功能';
      ElMessage.warning(`${functionName}当前不可用，请升级套餐`);
      return false;
    }
    return true;
  } catch (error: any) {
    console.error(`检查功能${functionId}权限失败:`, error);
    // 尝试提取更多错误信息
    if (error.response) {
      console.error('错误响应:', error.response);
    }
    // 如果是授权问题，提示用户
    if (error.response?.status === 401 || error.message?.includes('401')) {
      ElMessage.warning('请先登录后再使用该功能');
    } else {
      ElMessage.error(`功能检查失败: ${error.message || '未知错误'}`);
    }
    return false;
  }
}

/**
 * 检查用户是否有足够的积分使用某个功能
 * @param functionId 功能ID
 * @returns 是否有足够的积分
 */
export async function checkFunctionPoint(functionId: string): Promise<boolean> {
  try {
    // 检查身份验证状态
    const authStatus = checkAuthStatus();
    if (!authStatus.isLoggedIn) {
      console.warn(`积分检查失败: 用户未登录，functionId=${functionId}`);
      ElMessage.warning('请先登录后再使用该功能');
      return false;
    }
    
    console.log(`开始检查功能积分: ${functionId}`);
    const response = await checkUserFunctionPoint<{hasEnoughPoint: boolean}>(functionId);
    console.log(`功能积分检查响应:`, response);
    
    if (!response.data?.hasEnoughPoint) {
      const functionNames: Record<string, string> = {
        'xhs_materials': '素材库',
        'ai_title': 'AI选题'
      };
      const functionName = functionNames[functionId] || '该功能';
      ElMessage.warning(`积分不足，无法使用${functionName}功能，请升级套餐`);
      return false;
    }
    return true;
  } catch (error: any) {
    console.error(`检查功能${functionId}积分是否足够失败:`, error);
    // 尝试提取更多错误信息
    if (error.response) {
      console.error('错误响应:', error.response);
    }
    // 如果是授权问题，提示用户
    if (error.response?.status === 401 || error.message?.includes('401')) {
      ElMessage.warning('请先登录后再使用该功能');
    } else {
      ElMessage.error(`积分检查失败: ${error.message || '未知错误'}`);
    }
    return false;
  }
}

/**
 * 检测响应中是否包含积分不足的错误
 * @param response API响应对象
 * @returns 如果是积分不足错误，返回错误消息；否则返回null
 */
export function checkInsufficientBalanceError(response: any): string | null {
  if (!response) return null;
  
  // 直接检查顶层属性
  if (response.error === 'REGULAR_BALANCE_INSUFFICIENT' ||
      response.code === 'REGULAR_BALANCE_INSUFFICIENT' ||
      (response.message && response.message.includes('积分不足'))) {
    return response.message || '积分不足，继续体验服务，请按需选购套餐！';
  }
  
  // 检查嵌套的data属性
  if (response.data) {
    if (response.data.error === 'REGULAR_BALANCE_INSUFFICIENT' ||
        response.data.code === 'REGULAR_BALANCE_INSUFFICIENT' ||
        (response.data.message && response.data.message.includes('积分不足'))) {
      return response.data.message || '积分不足，继续体验服务，请按需选购套餐！';
    }
  }
  
  // 检查更深层的嵌套
  if (response.data && response.data.data) {
    if (response.data.data.error === 'REGULAR_BALANCE_INSUFFICIENT' ||
        response.data.data.code === 'REGULAR_BALANCE_INSUFFICIENT' ||
        (response.data.data.message && response.data.data.message.includes('积分不足'))) {
      return response.data.data.message || '积分不足，继续体验服务，请按需选购套餐！';
    }
  }
  
  return null;
} 