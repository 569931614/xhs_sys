import http from '@/api';
import type { CustomPage } from '@/api/system/custom-page';

enum Api {
  List = '/customPage',
  Create = '/customPage',
  Update = '/customPage',
  Delete = '/customPage',
  Detail = '/customPage',
}

/**
 * 获取自定义页面列表
 */
export const getCustomPageList = (params: any) => {
  return http.get(Api.List, { params });
};

/**
 * 创建自定义页面
 */
export const createCustomPage = (data: CustomPage) => {
  return http.post(Api.Create, data);
};

/**
 * 更新自定义页面
 */
export const updateCustomPage = (id: number, data: CustomPage) => {
  return http.put(`${Api.Update}/${id}`, data);
};

/**
 * 删除自定义页面
 */
export const deleteCustomPage = (id: number) => {
  return http.delete(`${Api.Delete}/${id}`);
};

/**
 * 获取自定义页面详情
 */
export const getCustomPageDetail = (id: number) => {
  return http.get(`${Api.Detail}/${id}`);
}; 