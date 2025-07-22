import router from '@/router/index';
import useUserStore from '@/store/modules/user';
import axios from 'axios';
import { ElMessage } from 'element-plus';

const api = axios.create({
  baseURL:
    import.meta.env.DEV && import.meta.env.VITE_OPEN_PROXY === 'true'
      ? '/proxy/'
      : import.meta.env.VITE_APP_API_BASEURL || 'http://localhost:9520/',
  timeout: 1000 * 60,
  responseType: 'json',
});

api.interceptors.request.use((request) => {
  const userStore = useUserStore();
  /**
   * 全局拦截请求发送前提交的参数
   * 以下代码为示例，在请求头里带上 token 信息
   */
  if (userStore.isLogin && request.headers) {
    request.headers.Authorization = userStore.token
      ? `Bearer ${userStore.token}`
      : '';
    console.log(`[请求] ${request.method?.toUpperCase()} ${request.url} - 使用store中的token`);
  } else if (request.headers) {
    // 即使未登录也尝试从localStorage获取token
    const token = localStorage.getItem('token');
    if (token) {
      request.headers.Authorization = `Bearer ${token}`;
      console.log(`[请求] ${request.method?.toUpperCase()} ${request.url} - 使用localStorage中的token`);
    } else {
      console.log(`[请求] ${request.method?.toUpperCase()} ${request.url} - 未使用token`);
    }
  }
  // 是否将 POST 请求参数进行字符串化处理
  if (request.method === 'post') {
    // request.data = qs.stringify(request.data, {
    //   arrayFormat: 'brackets',
    // })
  }
  return request;
});

api.interceptors.response.use(
  (response) => {
    /**
     * 全局拦截请求发送后返回的数据，如果数据有报错则在这做全局的错误提示
     * 假设返回数据格式为：{ status: 1, error: '', data: '' }
     * 规则是当 status 为 1 时表示请求成功，为 0 时表示接口需要登录或者登录状态失效，需要重新登录
     * 请求出错时 error 会返回错误信息
     */
    console.log(`[响应] ${response.config.url} - 状态码: ${response.status}`);
    return Promise.resolve(response.data);
  },
  (error) => {
    // 判断错误是否包含响应数据
    if (error.response && error.response.data) {
      const { data, status } = error.response;
      
      console.error(`[响应错误] ${error.config?.url} - 状态码: ${status}, 错误信息:`, data);
      
      // 如果是401错误且需要登录，执行登出操作
      if (status === 401 && data.code === 401 && data.message && data.message.includes('请登录后继续操作')) {
        const userStore = useUserStore();
        console.log('检测到未授权访问，执行登出操作');
        userStore.logout().then(() => {
          router.push({ name: 'login' });
        });
      }
      
      // 直接返回后端返回的错误数据，而不是抛出异常
      // 这样前端可以统一处理错误提示，避免显示多个错误信息
      return Promise.resolve(data);
    }
    
    // 网络错误或其他未处理的错误
    console.error("API请求错误:", error.message || error, error.config?.url);
    
    // 返回统一格式的错误对象
    return Promise.resolve({
      code: error.code || 500,
      success: false,
      message: '服务请求异常，请稍后再试'
    });
  }
);

export default api;
