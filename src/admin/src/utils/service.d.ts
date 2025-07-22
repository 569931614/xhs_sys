import { AxiosRequestConfig, AxiosInstance } from 'axios';

/**
 * 封装请求方法
 * @param {AxiosRequestConfig} config - 请求配置
 * @returns {Promise<any>} - 返回请求结果
 */
export function request(config: AxiosRequestConfig): Promise<any>;

declare const service: AxiosInstance;
export default service; 