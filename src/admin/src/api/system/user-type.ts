import request from '@/utils/request';

export interface UserType {
  id: number;
  name: string;
  description?: string;
  status: number;
  createTime?: string;
  updateTime?: string;
}

interface ApiResponse {
  code: number;
  message: string;
  data: UserType[] | UserType;
}

// 获取所有用户类型
export const getAllUserTypes = () => {
  return request.get<ApiResponse>('/system/user-type/list');
};

// 获取单个用户类型
export const getUserType = (id: number) => {
  return request.get<ApiResponse>(`/system/user-type/${id}`);
};

// 创建用户类型
export const createUserType = (data: UserType) => {
  return request.post<ApiResponse>('/system/user-type', data);
};

// 更新用户类型
export const updateUserType = (id: number, data: UserType) => {
  return request.put<ApiResponse>(`/system/user-type/${id}`, data);
};

// 删除用户类型
export const deleteUserType = (id: number) => {
  return request.delete<ApiResponse>(`/system/user-type/${id}`);
};

// 获取用户类型列表（简化版）
export const getUserTypes = () => {
  return request.get<ApiResponse>('/system/user-type/list');
}; 