import type { AxiosProgressEvent, AxiosResponse, GenericAbortSignal } from 'axios'
import request from './axios'
import { useAuthStore } from '@/store'

export interface HttpOption {
  url: string
  data?: any
  method?: string
  headers?: any
  onDownloadProgress?: (progressEvent: AxiosProgressEvent) => void
  signal?: GenericAbortSignal
  beforeRequest?: () => void
  afterRequest?: () => void
}

export interface Response<T = any> {
  data: T
  message: string | null
  status: string
  code?: number
  success?: boolean
}

// 扩展Error类型，添加response属性
interface ApiError extends Error {
  response?: any
}

let last401ErrorTimestamp = 0
const homePagePath = ['/chatlog/chatList', '/group/query']

function hasWhitePath(path: string) {
  if (!path)
    return false
  return homePagePath.some(item => path.includes(item))
}

function http<T = any>(
  { url, data, method, headers, onDownloadProgress, signal, beforeRequest, afterRequest }: HttpOption,
) {
  const successHandler = (res: AxiosResponse<Response<T>>) => {
    const authStore = useAuthStore()

    const code = res.data?.code

    if ((code && code >= 200 && code < 300) || code === undefined)
      return res.data

    if (code === 401) {
      authStore.removeToken()
      window.location.reload()
    }

    return Promise.reject(res.data)
  }

  const failHandler = (error: any) => {
    const authStore = useAuthStore()
    let data = error.response?.data
    afterRequest?.()
    const status = error?.response?.status

    if (status === 401) {
      authStore.removeToken()
      if (!hasWhitePath(error?.request?.responseURL)) {
        authStore.loadInit && authStore.setLoginDialog(true)
        const message = error.response.data?.message || '请先登录后再进行使用！'
        // 使用window.$message前检查其是否存在
        if (window.$message && Date.now() - last401ErrorTimestamp > 3000) {
          window.$message.error(message)
        }
      }
      last401ErrorTimestamp = Date.now()
    }
    else {
      // 处理400错误，确保不跳转
      if (status === 400) {
        console.error('400 错误:', error.response?.data?.message || error.message || '未知错误');
        // 不需要显示全局错误，由组件自己处理
      }
      else if (data && !data?.success) {
        // 使用window.$message前检查其是否存在
        if (window.$message) {
        window.$message.error(data?.message || '请求接口错误！')
    }
      }
    }
    
    // 创建错误对象时保留原始的响应数据
    const errorObj = new Error(error.response?.data?.message || error.message || 'Error') as ApiError;
    errorObj.response = error.response;
    return Promise.reject(errorObj);
  }

  beforeRequest?.()

  method = method || 'GET'

  const params = Object.assign(typeof data === 'function' ? data() : data ?? {}, {})

  return method === 'GET'
    ? request.get(url, { params, signal, onDownloadProgress }).then(successHandler, failHandler)
    : request.post(url, params, { headers, signal, onDownloadProgress }).then(successHandler, failHandler)
}

export function get<T = any>(
  { url, data, method = 'GET', onDownloadProgress, signal, beforeRequest, afterRequest }: HttpOption,
): Promise<Response<T>> {
  return http<T>({
    url,
    method,
    data,
    onDownloadProgress,
    signal,
    beforeRequest,
    afterRequest,
  }).catch(error => {
    console.error(`请求失败 ${url}:`, error);
    // 不再检查302状态，因为我们已经确保API不会重定向
    throw error;
  });
}

export function post<T = any>(
  { url, data, method = 'POST', headers, onDownloadProgress, signal, beforeRequest, afterRequest }: HttpOption,
): Promise<Response<T>> {
  return http<T>({
    url,
    method,
    data,
    headers,
    onDownloadProgress,
    signal,
    beforeRequest,
    afterRequest,
  })
}

export default post
