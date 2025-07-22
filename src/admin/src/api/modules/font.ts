import request from '../index';

// 查询字体列表
export function getFontList(params: any) {
  return request({
    url: '/font',
    method: 'get',
    params
  });
}

// 获取单个字体
export function getFont(id: number) {
  return request({
    url: `/font/${id}`,
    method: 'get'
  });
}

// 创建字体
export function createFont(data: any) {
  return request({
    url: '/font',
    method: 'post',
    data
  });
}

// 更新字体
export function updateFont(id: number, data: any) {
  return request({
    url: `/font/${id}`,
    method: 'patch',
    data
  });
}

// 删除字体
export function deleteFont(id: number) {
  return request({
    url: `/font/${id}`,
    method: 'delete'
  });
}

// 批量删除字体
export function batchDeleteFont(ids: number[]) {
  return request({
    url: '/font/batch-remove',
    method: 'post',
    data: ids
  });
}

// 切换字体状态
export function toggleFontStatus(id: number) {
  return request({
    url: `/font/${id}/toggle-status`,
    method: 'patch'
  });
}

// 从API获取字体数据
export function fetchFontsFromApi() {
  return request({
    url: '/font/fetch-from-api',
    method: 'get'
  });
}

// 获取所有可用字体
export function getAvailableFonts() {
  return request({
    url: '/font/available',
    method: 'get'
  });
} 