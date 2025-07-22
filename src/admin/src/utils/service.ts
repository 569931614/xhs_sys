import axios, { AxiosRequestConfig } from 'axios'
import { useMessage } from 'naive-ui'
import { createDiscreteApi } from 'naive-ui'

// 创建独立的消息API，用于在非组件环境中使用
const { message } = createDiscreteApi(['message'])

// 创建axios实例
const service = axios.create({
  baseURL: import.meta.env.VITE_APP_API_BASEURL || '/api',
  timeout: 30000
})

// 请求拦截器
service.interceptors.request.use(
  config => {
    // 在这里可以添加token等认证信息
    const token = localStorage.getItem('token')
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    return config
  },
  error => {
    console.error('请求错误:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
service.interceptors.response.use(
  response => {
    const res = response.data
    if (res.code !== 0 && res.code !== 200) {
      message.error(res.message || '请求失败')
      return Promise.reject(new Error(res.message || '请求失败'))
    }
    return res.data
  },
  error => {
    console.error('响应错误:', error)
    const errMsg = error.response?.data?.message || error.message || '请求失败'
    message.error(errMsg)
    return Promise.reject(error)
  }
)

/**
 * 封装请求方法
 * @param {AxiosRequestConfig} config - 请求配置
 * @returns {Promise} - 返回请求结果
 */
export function request(config: AxiosRequestConfig) {
  return service(config)
}

export default service 