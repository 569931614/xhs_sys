import { get, post } from '@/utils/request';

/**
 * 获取邀请链接
 */
export function fetchGetInviteLinkAPI<T>(): Promise<T> {
  return get<T>({
    url: '/invitation/link',
  }) as Promise<T>;
}

/**
 * 获取邀请列表
 */
export function fetchGetInviteListAPI<T>(): Promise<T> {
  return get<T>({
    url: '/invitation/list',
  }) as Promise<T>;
}

/**
 * 获取邀请统计
 */
export function fetchGetInviteStatsAPI<T>(): Promise<T> {
  return get<T>({
    url: '/invitation/stats',
  }) as Promise<T>;
}

/**
 * 接受邀请
 */
export function fetchAcceptInvitationAPI<T>(data: { inviteCode: string; userId: number }): Promise<T> {
  return post<T>({
    url: '/invitation/accept',
    data,
  }) as Promise<T>;
}

/**
 * 邀请注册
 */
export function fetchRegisterWithInviteAPI<T>(data: {
  username: string;
  password: string;
  contact: string;
  code: string;
  inviteCode: string;
}): Promise<T> {
  return post<T>({
    url: '/auth/register', // 保持使用原有的注册接口
    data,
  }) as Promise<T>;
} 