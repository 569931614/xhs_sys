<script setup lang="ts">
import { computed, defineAsyncComponent, onBeforeUnmount, ref, h } from 'vue';
import { useAppCatStore, useAuthStore } from '@/store';
import { ArrowLeft } from '@icon-park/vue-next';
import type { Component } from 'vue';
import RedBookNotes from '../RedBookNotes/index.vue';
import RedBookActivities from '../RedBookActivitiesIndex/index.vue';
import XhsProductFactory from '../XhsProductFactory/index.vue';
import AccountAnalysis from '../AccountAnalysis/index.vue';
import NotesMarket from '../NotesMarket/index.vue';
import ImageGenerator from '../ImageGenerator/index.vue';

const appCatStore = useAppCatStore();
const authStore = useAuthStore();

// 当前嵌入的应用
const currentApp = computed(() => appCatStore.currentEmbeddedApp);

// 是否显示应用
const showApp = computed(() => appCatStore.showEmbeddedApp);

// 标记组件是否已销毁
const isDestroyed = ref(false);

// 检查用户登录状态
const isUserLoggedIn = computed(() => {
  const loggedIn = !!authStore?.userInfo?.id;
  return loggedIn;
});

// 内置应用组件映射
const builtInApps: Record<string, any> = {
  // 使用函数返回一个Promise，确保可以处理加载错误
  'xhs-notes': () => {
    if (isDestroyed.value) {
      return Promise.resolve({
        render: () => null
      });
    }
    
    console.log('加载小红书笔记组件');
    
    // 检查用户是否已登录
    if (!isUserLoggedIn.value) {
      return Promise.resolve({
        render: () => h('div', { class: 'login-required' }, [
          h('div', { class: 'login-message' }, '请先登录后再使用小红书笔记功能'),
          h('button', { 
            class: 'login-button',
            onClick: () => authStore.setLoginDialog(true)
          }, '去登录')
        ])
      });
    }
    
    // 返回实际组件
    return Promise.resolve(RedBookNotes);
  },
  // 添加小红书活动类型应用
  'xhs-activities': () => {
    if (isDestroyed.value) {
      return Promise.resolve({
        render: () => null
      });
    }
    
    console.log('加载小红书活动类型组件');
    
    // 检查用户是否已登录
    if (!isUserLoggedIn.value) {
      return Promise.resolve({
        render: () => h('div', { class: 'login-required' }, [
          h('div', { class: 'login-message' }, '请先登录后再使用小红书活动类型功能'),
          h('button', { 
            class: 'login-button',
            onClick: () => authStore.setLoginDialog(true)
          }, '去登录')
        ])
      });
    }
    
    // 返回实际组件
    return Promise.resolve(RedBookActivities);
  },
  // 添加小红书产品工厂应用
  'xhs-product-factory': () => {
    if (isDestroyed.value) {
      console.log('组件已销毁，不再加载产品工厂应用');
      return Promise.resolve({
        render: () => null
      });
    }
    
    console.log('加载小红书产品工厂组件，引入的组件是否有效:', !!XhsProductFactory);
    console.log('XhsProductFactory组件类型:', typeof XhsProductFactory);
    
    // 检查用户是否已登录
    if (!isUserLoggedIn.value) {
      console.log('用户未登录，显示登录提示');
      return Promise.resolve({
        render: () => h('div', { class: 'login-required' }, [
          h('div', { class: 'login-message' }, '请先登录后再使用小红书产品工厂功能'),
          h('button', { 
            class: 'login-button',
            onClick: () => authStore.setLoginDialog(true)
          }, '去登录')
        ])
      });
    }
    
    // 返回实际组件
    console.log('返回XhsProductFactory组件，准备渲染');
    // 直接返回组件对象，跳过Promise包装
    try {
      return Promise.resolve(XhsProductFactory);
    } catch (e: any) {
      console.error('加载XhsProductFactory组件失败:', e);
      return Promise.resolve({
        render: () => h('div', { class: 'app-load-error' }, [
          h('p', {}, '加载组件失败'),
          h('p', { class: 'text-xs mt-2' }, e?.message || '未知错误')
        ])
      });
    }
  },
  // 添加账号分析应用
  'account-analysis': () => {
    if (isDestroyed.value) {
      console.log('组件已销毁，不再加载账号分析应用');
      return Promise.resolve({
        render: () => null
      });
    }
    
    console.log('加载账号分析组件，引入的组件是否有效:', !!AccountAnalysis);
    console.log('AccountAnalysis组件类型:', typeof AccountAnalysis);
    
    // 检查用户是否已登录
    if (!isUserLoggedIn.value) {
      console.log('用户未登录，显示登录提示');
      return Promise.resolve({
        render: () => h('div', { class: 'login-required' }, [
          h('div', { class: 'login-message' }, '请先登录后再使用账号分析功能'),
          h('button', { 
            class: 'login-button',
            onClick: () => authStore.setLoginDialog(true)
          }, '去登录')
        ])
      });
    }
    
    // 返回实际组件
    console.log('返回AccountAnalysis组件，准备渲染');
    try {
      return Promise.resolve(AccountAnalysis);
    } catch (e: any) {
      console.error('加载AccountAnalysis组件失败:', e);
      return Promise.resolve({
        render: () => h('div', { class: 'app-load-error' }, [
          h('p', {}, '加载组件失败'),
          h('p', { class: 'text-xs mt-2' }, e?.message || '未知错误')
        ])
      });
    }
  },
  // 添加笔记市场应用
  'notes-market': () => {
    if (isDestroyed.value) {
      console.log('组件已销毁，不再加载笔记市场应用');
      return Promise.resolve({
        render: () => null
      });
    }
    
    console.log('加载笔记模板市场组件，引入的组件是否有效:', !!NotesMarket);
    console.log('NotesMarket组件类型:', typeof NotesMarket);
    
    // 检查用户是否已登录
    if (!isUserLoggedIn.value) {
      console.log('用户未登录，显示登录提示');
      return Promise.resolve({
        render: () => h('div', { class: 'login-required' }, [
          h('div', { class: 'login-message' }, '请先登录后再使用笔记模板市场功能'),
          h('button', { 
            class: 'login-button',
            onClick: () => authStore.setLoginDialog(true)
          }, '去登录')
        ])
      });
    }
    
    // 返回实际组件
    console.log('返回NotesMarket组件，准备渲染');
    try {
      return Promise.resolve(NotesMarket);
    } catch (e: any) {
      console.error('加载NotesMarket组件失败:', e);
      return Promise.resolve({
        render: () => h('div', { class: 'app-load-error' }, [
          h('p', {}, '加载组件失败'),
          h('p', { class: 'text-xs mt-2' }, e?.message || '未知错误')
        ])
      });
    }
  },
  // 添加智能生图应用
  'image-generator': () => {
    if (isDestroyed.value) {
      console.log('组件已销毁，不再加载智能生图应用');
      return Promise.resolve({
        render: () => null
      });
    }
    
    console.log('加载智能生图组件，引入的组件是否有效:', !!ImageGenerator);
    console.log('ImageGenerator组件类型:', typeof ImageGenerator);
    
    // 检查用户是否已登录
    if (!isUserLoggedIn.value) {
      console.log('用户未登录，显示登录提示');
      return Promise.resolve({
        render: () => h('div', { class: 'login-required' }, [
          h('div', { class: 'login-message' }, '请先登录后再使用智能生图功能'),
          h('button', { 
            class: 'login-button',
            onClick: () => authStore.setLoginDialog(true)
          }, '去登录')
        ])
      });
    }
    
    // 返回实际组件
    console.log('返回ImageGenerator组件，准备渲染');
    try {
      return Promise.resolve(ImageGenerator);
    } catch (e: any) {
      console.error('加载ImageGenerator组件失败:', e);
      return Promise.resolve({
        render: () => h('div', { class: 'app-load-error' }, [
          h('p', {}, '加载组件失败'),
          h('p', { class: 'text-xs mt-2' }, e?.message || '未知错误')
        ])
      });
    }
  }
  // 可以在这里添加更多内置应用
};

// 安全获取组件
function safeGetComponent(path: string) {
  console.log('safeGetComponent被调用，path:', path);
  
  if (!path || isDestroyed.value) {
    console.error('无效的路径或组件已销毁');
    return null;
  }
  
  try {
    if (builtInApps[path]) {
      console.log(`找到内置应用: ${path}`);
      return defineAsyncComponent({
        loader: builtInApps[path],
        timeout: 10000,
        loadingComponent: {
          render: () => h('div', { class: 'app-loading' }, [
            h('div', { class: 'spinner' }),
            h('p', {}, '正在加载应用...')
          ])
        },
        errorComponent: {
          render: () => h('div', { class: 'app-load-error' }, '应用加载失败')
        },
        onError: (error) => {
          console.error(`加载应用${path}失败:`, error);
        }
      });
    } else {
      console.error(`未找到内置应用: ${path}`);
      return null;
    }
  } catch (e) {
    console.error('获取组件失败:', e);
    return null;
  }
}

// 返回聊天界面
function handleBack() {
  appCatStore.hideApp();
}

// 组件销毁时清理
onBeforeUnmount(() => {
  console.log('EmbeddedApp组件卸载');
  isDestroyed.value = true;
});
</script>

<template>
  <div 
    v-if="showApp" 
    class="embedded-app-container"
  >
    {{ console.log('EmbeddedApp被渲染，currentApp:', currentApp) }}
    
    <div class="embedded-app-content">
      <!-- 根据不同的应用类型，渲染不同的组件 -->
      <template v-if="currentApp">
        <template v-if="currentApp.type === 'built-in' && currentApp.path && !isDestroyed">
          {{ console.log('准备渲染内置应用组件:', currentApp.path) }}
          
          <!-- 使用专门的渲染逻辑处理所有内置应用 -->
          <div v-if="currentApp.path === 'xhs-product-factory'" class="embedded-app-content-wrapper">
            {{ console.log('直接渲染小红书产品工厂') }}
            <XhsProductFactory />
            {{ console.log('XhsProductFactory组件渲染完成') }}
          </div>
          <div v-else-if="currentApp.path === 'xhs-notes'" class="embedded-app-content-wrapper">
            {{ console.log('直接渲染小红书笔记') }}
            <RedBookNotes />
            {{ console.log('RedBookNotes组件渲染完成') }}
          </div>
          <div v-else-if="currentApp.path === 'xhs-activities'" class="embedded-app-content-wrapper">
            {{ console.log('直接渲染小红书活动类型，确保触发初始化过程') }}
            <RedBookActivities />
            {{ console.log('RedBookActivities组件渲染完成') }}
          </div>
          <div v-else-if="currentApp.path === 'account-analysis'" class="embedded-app-content-wrapper">
            {{ console.log('直接渲染账号分析应用') }}
            <AccountAnalysis />
            {{ console.log('AccountAnalysis组件渲染完成') }}
          </div>
          <div v-else-if="currentApp.path === 'notes-market'" class="embedded-app-content-wrapper">
            {{ console.log('直接渲染笔记模板市场应用') }}
            <NotesMarket />
            {{ console.log('NotesMarket组件渲染完成') }}
          </div>
          <div v-else-if="currentApp.path === 'image-generator'" class="embedded-app-content-wrapper">
            {{ console.log('直接渲染智能生图应用') }}
            <ImageGenerator />
            {{ console.log('ImageGenerator组件渲染完成') }}
          </div>
          
          <!-- 其他组件使用常规方式渲染 -->
          <component 
            v-else
            :is="safeGetComponent(currentApp.path)"
            v-if="safeGetComponent(currentApp.path)"
            v-bind="currentApp.params || {}"
          />
          
          <!-- 错误情况显示 -->
          <div 
            v-if="!safeGetComponent(currentApp.path) && 
                 !['xhs-product-factory', 'xhs-notes', 'xhs-activities', 'account-analysis', 'notes-market', 'image-generator'].includes(currentApp.path)" 
            class="app-load-error"
          >
            <p>内置应用组件加载失败</p>
            <p class="text-xs mt-2">{{ currentApp.path }}</p>
          </div>
        </template>
        
        <template v-else-if="currentApp.component && !isDestroyed">
          <div class="app-loading">
            <div class="spinner"></div>
            <p>正在加载应用组件...</p>
          </div>
        </template>
        
        <template v-else-if="currentApp.path && !isDestroyed">
          <iframe 
            :src="currentApp.path" 
            class="w-full h-full border-0"
            frameborder="0"
          ></iframe>
        </template>
        
        <template v-else>
          <div class="flex items-center justify-center h-full">
            <p class="text-gray-500">无法加载应用内容：未知应用类型</p>
            <p class="text-xs mt-2">{{ JSON.stringify(currentApp) }}</p>
          </div>
        </template>
      </template>
      <div v-else class="flex items-center justify-center h-full">
        <p class="text-gray-500">未找到应用配置</p>
      </div>
    </div>
  </div>
  <div v-else class="flex items-center justify-center h-full">
    {{ console.log('EmbeddedApp组件未显示，showApp为false') }}
    <p class="text-gray-500">应用未显示</p>
  </div>
</template>

<style scoped>
.embedded-app-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  background-color: #f5f5f5;
  overflow: hidden;
}

.embedded-app-header {
  flex-shrink: 0;
}

.embedded-app-content {
  flex: 1;
  overflow: auto;
  height: 100%;
}

.app-loading, .app-load-error, .login-required {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  text-align: center;
  padding: 20px;
}

.app-load-error {
  color: #ff4d4f;
}

.login-required {
  background-color: #f9f9f9;
}

.login-message {
  margin-bottom: 20px;
  font-size: 16px;
  color: #666;
}

.login-button {
  padding: 8px 16px;
  background-color: #1890ff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.login-button:hover {
  background-color: #40a9ff;
}

.spinner {
  border: 4px solid rgba(0, 0, 0, 0.1);
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border-left-color: #1890ff;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

:deep(.dark) {
  .embedded-app-container {
    background-color: #1a1a1a;
  }
  
  .login-required {
    background-color: #1f1f1f;
  }
  
  .login-message {
    color: #999;
  }
}
</style> 