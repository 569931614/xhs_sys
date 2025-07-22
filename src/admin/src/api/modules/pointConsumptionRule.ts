import request from '@/utils/request';

// 定义API响应接口
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

// 积分消耗规则实体接口
export interface PointConsumptionRule {
  id: number;
  packageId: number;
  packageName?: string;
  functionId: string;
  model3Rate: number;
  model4Rate: number;
  drawMjRate: number;
  status: number;
  isAvailable: number; // 是否可用 0:不可用 1:可用
  maxConcurrentTasks: number; // 最大同时执行任务数
  description?: string;
  createTime?: string;
  updateTime?: string;
}

// 获取所有积分消耗规则
export function getAllRules() {
  return request<ApiResponse<PointConsumptionRule[]>>({
    url: '/point-consumption-rule/list',
    method: 'get'
  });
}

// 根据ID获取规则
export function getRuleById(id: number) {
  return request<ApiResponse<PointConsumptionRule>>({
    url: `/point-consumption-rule/${id}`,
    method: 'get'
  });
}

// 创建新规则
export function createRule(data: Partial<PointConsumptionRule>) {
  return request<ApiResponse<PointConsumptionRule>>({
    url: '/point-consumption-rule',
    method: 'post',
    data
  });
}

// 更新规则
export function updateRule(id: number, data: Partial<PointConsumptionRule>) {
  console.log('API updateRule 请求数据:', JSON.stringify({id, data}));
  return request<ApiResponse<PointConsumptionRule>>({
    url: `/point-consumption-rule/${id}`,
    method: 'put',
    data
  });
}

// 删除规则
export function deleteRule(id: number) {
  return request<ApiResponse<void>>({
    url: `/point-consumption-rule/${id}`,
    method: 'delete'
  });
}

// 根据套餐ID和功能ID获取规则
export function getRuleByPackageAndFunction(packageId: number, functionId: string) {
  return request<ApiResponse<PointConsumptionRule>>({
    url: '/point-consumption-rule/query',
    method: 'get',
    params: { packageId, functionId }
  });
}

export default {
  getAllRules,
  getRuleById,
  createRule,
  updateRule,
  deleteRule,
  getRuleByPackageAndFunction
}; 