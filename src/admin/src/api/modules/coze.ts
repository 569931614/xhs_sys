import request from '@/utils/request';

export default {
  // 获取Coze列表
  getCozeList: (params?: { page?: number; size?: number }) => {
    return request.get('/coze', { params });
  },

  // 添加Coze
  addCoze: (data: {
    botId: string;
    name: string;
    publicKey: string;
    secretKey: string;
    clientId: string;
    spaceId: string;
  }) => {
    return request.post('/coze', data);
  },

  // 更新Coze
  updateCoze: (
    id: number,
    data: {
      botId?: string;
      name?: string;
      publicKey?: string;
      secretKey?: string;
      clientId?: string;
      spaceId?: string;
      status?: number;
    }
  ) => {
    return request.patch(`/coze/${id}`, data);
  },

  // 删除Coze
  deleteCoze: (id: number) => {
    return request.delete(`/coze/${id}`);
  },

  // 获取Coze详情
  getCozeDetail: (id: number) => {
    return request.get(`/coze/${id}`);
  },
}; 