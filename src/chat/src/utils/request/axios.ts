import axios, { type AxiosResponse } from 'axios'
import { useAuthStore, useGlobalStore } from '@/store'

const service = axios.create({
  baseURL: import.meta.env.VITE_GLOB_API_URL,
  timeout: 2400 * 1000,
})

service.interceptors.request.use(
  (config) => {
    const token = useAuthStore().token
    const fingerprint = useGlobalStore()?.fingerprint
		const currentDomain = window.location.origin;
		config.headers['X-Website-Domain'] = currentDomain;
    fingerprint && (config.headers.Fingerprint = fingerprint)
    if (token)
      config.headers.Authorization = `Bearer ${token}`

    // 添加详细日志
    console.log(`Request to: ${config.url}`, {
      method: config.method,
      headers: config.headers,
      params: config.params || {},
      data: config.data || {},
      token: token ? 'present' : 'missing'
    });
    
    return config
  },
  (error) => {
    console.error('Request error interceptor:', error);
    return Promise.reject(error.response)
  },
)

service.interceptors.response.use(
  (response: AxiosResponse): AxiosResponse => {
    // 添加详细日志
    console.log(`Response from: ${response.config.url}`, {
      status: response.status,
      statusText: response.statusText,
      data: response.data || {},
      headers: response.headers || {}
    });
    
    if ([200, 201].includes(response.status))
      return response

    throw new Error(response.status.toString())
  },
  (error) => {
    // 添加详细的错误日志
    console.error('Response error interceptor:', {
      url: error.config?.url || 'unknown',
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data || {},
      headers: error.response?.headers || {},
      message: error.message
    });
    
    // 特别处理302重定向
    if (error.response?.status === 302) {
      console.warn('检测到302重定向:', {
        from: error.config?.url,
        to: error.response.headers?.location || 'unknown',
        headers: error.response.headers || {}
      });
    }
    
    return Promise.reject(error)
  },
)

export default service
