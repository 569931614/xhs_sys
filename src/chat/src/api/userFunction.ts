import { get, Response } from '@/utils/request';

/**
 * 检查用户是否有权限使用某个功能
 * @param functionId 功能ID
 * @param amount 使用次数，默认为1
 * @returns 权限检查结果
 */
export function checkUserFunctionAccess<T>(functionId: string, amount: number = 1): Promise<Response<T>> {
  return get<T>({
    url: '/user-function/check-access',
    data: { functionId, amount }
  });
}

/**
 * 检查用户对某功能的积分是否足够
 * @param functionId 功能ID
 * @param amount 使用次数，默认为1
 * @returns 积分检查结果
 */
export function checkUserFunctionPoint<T>(functionId: string, amount: number = 1): Promise<Response<T>> {
  return get<T>({
    url: '/user-function/check-point',
    data: { functionId, amount }
  });
} 