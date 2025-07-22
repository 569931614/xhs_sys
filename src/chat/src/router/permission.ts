import { useAuthStoreWithout } from '@/store/modules/auth';
import type { Router } from 'vue-router';

export function setupPageGuard(router: Router) {
  // 添加一个变量跟踪QR码相关错误
  let qrCodeErrorDetected = false;
  let lastQrErrorTime = 0;
  const QR_ERROR_TIMEOUT = 5000; // 5秒内的QR错误视为同一批次

  // 全局错误处理函数
  const handleGlobalError = (event: ErrorEvent) => {
    // 检查错误是否与QR码相关
    if (
      event?.error?.message?.includes('getQRCode') ||
      event?.error?.stack?.includes('getQRCode') ||
      event?.message?.includes('getQRCode') ||
      event?.error?.message?.includes('access_token') ||
      event?.message?.includes('access_token')
    ) {
      console.warn('路由守卫: 捕获到QR码相关错误:', event);
      qrCodeErrorDetected = true;
      lastQrErrorTime = Date.now();
      
      // 阻止错误冒泡
      event.preventDefault();
      event.stopPropagation();
      return false;
    }
  };

  // 添加全局错误监听
  window.addEventListener('error', handleGlobalError, true);
  
  // 添加未处理的Promise错误监听
  window.addEventListener('unhandledrejection', (event) => {
    if (
      event?.reason?.message?.includes('getQRCode') ||
      event?.reason?.stack?.includes('getQRCode') ||
      event?.reason?.message?.includes('access_token') ||
      (typeof event.reason === 'string' && 
       (event.reason.includes('getQRCode') || event.reason.includes('access_token')))
    ) {
      console.warn('路由守卫: 捕获到未处理的QR码相关Promise错误:', event);
      qrCodeErrorDetected = true;
      lastQrErrorTime = Date.now();
      
      // 阻止错误冒泡
      event.preventDefault();
      return false;
    }
  }, true);

  router.beforeEach(async (to, from, next) => {
    window.$loadingBar?.start();
    const authStore = useAuthStoreWithout();
    
    // 检查是否是404页面且最近有QR码错误
    if (to.path === '/404' && qrCodeErrorDetected && (Date.now() - lastQrErrorTime < QR_ERROR_TIMEOUT)) {
      console.warn('路由守卫: 检测到QR码错误后的404跳转，阻止并返回上一页');
      qrCodeErrorDetected = false; // 重置错误标志
      
      // 如果上一页不是404，则返回上一页，否则返回首页
      if (from.path !== '/404' && from.path !== '/500') {
        next(false); // 取消当前导航
        return;
      } else {
        // 如果来源也是错误页，则跳转到首页
        next({ path: '/' });
        return;
      }
    }
    
    // 检查是否有"access_token missing"等特定错误模式的URL跳转
    if (to.fullPath.includes('access_token') && to.fullPath.includes('error')) {
      console.warn('路由守卫: 检测到access_token错误相关的跳转，阻止并返回上一页');
      
      if (from.path !== '/404' && from.path !== '/500') {
        next(false); // 取消当前导航
        return;
      } else {
        // 如果来源也是错误页，则跳转到首页
        next({ path: '/' });
        return;
      }
    }
    
    if (!authStore.userInfo.username) {
      try {
        if (authStore.token) {
          // 有token但没有用户信息，尝试获取用户信息
          await authStore.getUserInfo();
        } else {
          // 没有token，说明未登录，直接打开登录框
          authStore.setLoginDialog(true);
        }
        
        if (authStore.globalConfigLoading) {
          let domain = `${window.location.protocol}//${window.location.hostname}`;
          if (window.location.port) domain += `:${window.location.port}`;
          await authStore.getglobalConfig(domain);
          if (authStore.globalConfig.clientHomePath)
            next({ path: authStore.globalConfig.clientHomePath });
          else next();
        }
        if (to.path === '/500') next({ path: '/' });
        else next();
      } catch (error) {
        if (to.path === '/500') next({ path: '/' });
        else next();
      }
    } else {
      // 类型安全地访问可能不存在的属性
      // 使用as any临时解决类型检查问题
      const clientMenuList = (authStore.globalConfig as any)?.clientMenuList;
      const openMenuList = clientMenuList ? JSON.parse(clientMenuList) : [];
      if (openMenuList.length && !openMenuList.includes(to.name)) {
        if (
          authStore.globalConfig.clientHomePath &&
          authStore.globalConfig.clientHomePath !== ''
        )
          next({ path: authStore.globalConfig.clientHomePath });
        else next();
      }

      next();
    }
  });

  router.afterEach((to: any) => {
    window.$loadingBar?.finish();
    
    // 检查导航后是否到达了404页面，如果是且有二维码错误，尝试自动返回
    if (to.path === '/404' && qrCodeErrorDetected && (Date.now() - lastQrErrorTime < QR_ERROR_TIMEOUT)) {
      console.warn('路由守卫: 导航后检测到404页面，尝试自动恢复');
      qrCodeErrorDetected = false;
      
      // 使用setTimeout确保DOM已更新
      setTimeout(() => {
        window.history.back();
      }, 100);
    }
  });
}
