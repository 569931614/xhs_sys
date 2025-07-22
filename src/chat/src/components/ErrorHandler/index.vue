<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const errorCount = ref(0);
const qrCodeErrorDetected = ref(false);
const lastErrorTime = ref(0);
const ERROR_COOLDOWN = 5000; // 错误冷却时间，避免频繁显示错误

// 通知类型
type NoticeType = 'info' | 'warning' | 'error' | 'success';

// 创建一个简单的消息显示函数
function showMessage(message: string, type: NoticeType = 'info') {
  // 使用全局消息组件（如果存在）
  if (window.$message) {
    window.$message[type](message);
  } else {
    // 回退方案：使用控制台
    console[type === 'error' ? 'error' : type === 'warning' ? 'warn' : 'log'](message);
    
    // 如果是错误或警告，显示一个简单的alert
    if (type === 'error' || type === 'warning') {
      setTimeout(() => alert(message), 100);
    }
  }
}

// 全局错误处理函数
function handleGlobalError(event: ErrorEvent) {
  // 增加错误计数
  errorCount.value++;
  
  // 检查错误是否与QR码相关
  const isQrCodeError = 
    event?.error?.message?.includes('getQRCode') || 
    event?.error?.stack?.includes('getQRCode') ||
    event?.message?.includes('getQRCode') ||
    event?.error?.message?.includes('access_token') ||
    event?.message?.includes('access_token');
  
  if (isQrCodeError) {
    console.warn('全局错误处理器: 捕获到QR码或授权相关错误:', {
      message: event.message,
      stack: event.error?.stack
    });
    
    // 标记QR码错误
    qrCodeErrorDetected.value = true;
    lastErrorTime.value = Date.now();
    
    // 检查是否需要显示错误消息（避免频繁显示）
    if (Date.now() - lastErrorTime.value > ERROR_COOLDOWN) {
      showMessage('二维码加载失败，请刷新页面或稍后重试', 'warning');
    }
    
    // 阻止错误传播
    event.preventDefault();
    event.stopPropagation();
    return false;
  }
}

// 处理未捕获的Promise错误
function handleUnhandledRejection(event: PromiseRejectionEvent) {
  // 增加错误计数
  errorCount.value++;
  
  // 检查是否与QR码或授权相关
  const reason = event.reason;
  const reasonStr = typeof reason === 'string' ? reason : 
                   reason?.message || JSON.stringify(reason);
  
  const isQrOrAuthError = 
    reasonStr.includes('getQRCode') || 
    reasonStr.includes('access_token') ||
    reasonStr.includes('授权') ||
    reasonStr.includes('登录');
  
  if (isQrOrAuthError) {
    console.warn('全局Promise错误处理器: 捕获到QR码或授权相关错误:', {
      reason: reasonStr,
      stack: reason?.stack
    });
    
    // 标记QR码错误
    qrCodeErrorDetected.value = true;
    lastErrorTime.value = Date.now();
    
    // 检查是否需要显示错误消息
    if (Date.now() - lastErrorTime.value > ERROR_COOLDOWN) {
      showMessage('系统遇到一个问题，正在尝试恢复...', 'info');
    }
    
    // 阻止错误传播
    event.preventDefault();
    return false;
  }
}

// 监听路由变化
function setupRouteListener() {
  // 前置守卫
  const removeBeforeEach = router.beforeEach((to, from, next) => {
    // 如果要前往404页面且最近检测到QR码错误
    if (to.path === '/404' && qrCodeErrorDetected.value && (Date.now() - lastErrorTime.value < 10000)) {
      console.warn('路由错误拦截: 检测到导航到404页面，尝试返回');
      qrCodeErrorDetected.value = false;
      
      // 取消当前导航并返回上一页
      if (from.path !== '/404' && from.path !== '/500') {
        next(false);
      } else {
        // 如果来源也是错误页，返回首页
        next({ path: '/' });
      }
      return;
    }
    
    // 检查是否是API错误页面（带有错误参数）
    if (to.query.error || (to.hash && to.hash.includes('error'))) {
      console.warn('路由错误拦截: 检测到错误参数:', to.fullPath);
      
      // 如果有记录前一个正常页面，返回该页面
      if (from.path !== '/404' && from.path !== '/500' && from.name) {
        showMessage('系统遇到一个问题，正在返回上一页...', 'info');
        next(false);
      } else {
        // 否则返回首页
        next({ path: '/' });
      }
      return;
    }
    
    next();
  });
  
  // 后置守卫
  const removeAfterEach = router.afterEach((to) => {
    // 检查是否到达了404页面
    if (to.path === '/404' || to.path === '/500') {
      console.warn('路由错误拦截: 导航后到达错误页面:', to.path);
      
      // 如果是因为QR码错误导致的404
      if (qrCodeErrorDetected.value && (Date.now() - lastErrorTime.value < 10000)) {
        qrCodeErrorDetected.value = false;
        
        // 延迟执行，确保DOM已更新
        setTimeout(() => {
          showMessage('检测到页面错误，正在尝试恢复...', 'info');
          window.history.back();
        }, 100);
      }
    }
  });
  
  // 返回清理函数
  return () => {
    removeBeforeEach();
    removeAfterEach();
  };
}

// 组件挂载时设置监听
onMounted(() => {
  // 添加全局错误监听
  window.addEventListener('error', handleGlobalError, true);
  window.addEventListener('unhandledrejection', handleUnhandledRejection, true);
  
  // 设置路由监听
  const cleanupRouter = setupRouteListener();
  
  // 组件卸载时清理
  onUnmounted(() => {
    window.removeEventListener('error', handleGlobalError, true);
    window.removeEventListener('unhandledrejection', handleUnhandledRejection, true);
    cleanupRouter();
  });
});
</script>

<template>
  <!-- 
    这是一个纯功能组件，没有UI渲染 
    它在后台静默处理全局错误和路由问题
  -->
</template> 