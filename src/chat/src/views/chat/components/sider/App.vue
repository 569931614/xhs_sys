<script setup lang="ts">
import { fetchQueryAppsAPI } from '@/api/appStore';
import { useChatStore, useAppCatStore } from '@/store';
import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import PinyinMatch from 'pinyin-match';

interface AppItem {
  id: number;
  name: string;
  des: string;
  coverImg: string;
  loading?: boolean;
  catId?: number;
  appCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

const chatStore = useChatStore();
const appCatStore = useAppCatStore();
const router = useRouter();
const customKeyId = ref(100);
const dataSources = computed(() => chatStore.groupList);
const groupKeyWord = computed(() => chatStore.groupKeyWord);
const mineApps = computed(() => appCatStore.mineApps);
const autoOpenFirstApp = ref(true); // 控制是否自动打开第一个应用

// 应用列表
const appList = ref<AppItem[]>([]);
const keyword = ref('');

// 添加小红书产品工厂应用
const xhsProductFactory: AppItem = {
  id: -3, // 使用负数ID表示这是一个特殊的内置应用
  name: '图文矩阵',
  des: '管理小红书产品、优化内容和图片，提供一站式产品内容管理解决方案',
  coverImg: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='128' height='128' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='3' width='18' height='18' rx='2' ry='2'%3E%3C/rect%3E%3Crect x='7' y='7' width='3' height='9'%3E%3C/rect%3E%3Crect x='14' y='7' width='3' height='5'%3E%3C/rect%3E%3C/svg%3E`,
  loading: false
};

// 添加智能生图应用
const imageGeneratorApp: AppItem = {
  id: -6, // 使用负数ID表示这是一个特殊的内置应用
  name: '智能生图',
  des: 'AI智能生图，一键生成高质量图片',
  coverImg: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='128' height='128' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='3' width='18' height='18' rx='2' ry='2'%3E%3C/rect%3E%3Ccircle cx='8.5' cy='8.5' r='1.5'%3E%3C/circle%3E%3Cpolyline points='21 15 16 10 5 21'%3E%3C/polyline%3E%3C/svg%3E`,
  loading: false
};

// 添加小红书笔记应用
const xhsNotesApp: AppItem = {
  id: -1, // 使用负数ID表示这是一个特殊的内置应用
  name: '小红书笔记',
  des: '管理小红书笔记，可添加、查看和删除小红书笔记内容',
  coverImg: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='128' height='128' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z'%3E%3C/path%3E%3Cpolyline points='14 2 14 8 20 8'%3E%3C/polyline%3E%3Cline x1='16' y1='13' x2='8' y2='13'%3E%3C/line%3E%3Cline x1='16' y1='17' x2='8' y2='17'%3E%3C/line%3E%3Cpolyline points='10 9 9 9 8 9'%3E%3C/polyline%3E%3C/svg%3E`,
  loading: false
};

// 活动类型应用已从侧边栏移除，但保留定义以供其他组件使用
const xhsActivitiesApp: AppItem = {
  id: -2, // 使用另一个负数ID表示这是一个特殊的内置应用
  name: '活动类型',
  des: '管理小红书活动类型，可添加、查看和管理不同类型的活动',
  coverImg: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='128' height='128' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9'%3E%3C/path%3E%3Cpath d='M13.73 21a2 2 0 0 1-3.46 0'%3E%3C/path%3E%3C/svg%3E`,
  loading: false
};

// 添加账号分析应用
const accountAnalysisApp: AppItem = {
  id: -4, // 使用负数ID表示这是一个特殊的内置应用
  name: '账号AI分析',
  des: '分析抖音和小红书账号数据，了解账号内容、粉丝特征和增长趋势',
  coverImg: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='128' height='128' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cline x1='18' y1='20' x2='18' y2='10'%3E%3C/line%3E%3Cline x1='12' y1='20' x2='12' y2='4'%3E%3C/line%3E%3Cline x1='6' y1='20' x2='6' y2='14'%3E%3C/line%3E%3C/svg%3E`,
  loading: false
};

// 添加笔记模板市场应用
const notesMarketApp: AppItem = {
  id: -5, // 使用负数ID表示这是一个特殊的内置应用
  name: '笔记模板市场',
  des: '发现优质笔记内容，一键导入使用',
  coverImg: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='128' height='128' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z'%3E%3C/path%3E%3Cpolyline points='3.27 6.96 12 12.01 20.73 6.96'%3E%3C/polyline%3E%3Cline x1='12' y1='22.08' x2='12' y2='12'%3E%3C/line%3E%3C/svg%3E`,
  loading: false
};

watch(dataSources, () => (customKeyId.value = customKeyId.value + 1));
watch(groupKeyWord, () => (customKeyId.value = customKeyId.value + 1));

// 过滤后的应用列表，始终包含小红书产品工厂、笔记应用和小红书活动类型应用
const filteredAppList = computed(() => {
  // 修改顺序，将imageGeneratorApp放在notesMarketApp之后
  let list: AppItem[] = [xhsProductFactory, notesMarketApp, imageGeneratorApp, accountAnalysisApp]; 
  
  if (keyword.value) {
    // 使用拼音模糊搜索，支持中文和拼音
    const keywordLower = keyword.value.toLowerCase();
    
    // 只过滤内置小红书应用
    return list.filter(app => 
      PinyinMatch.match(app.name, keywordLower)
    );
  }
  
  return list; // 返回所有应用
});

// 判断应用是否收藏
function isMineApp(app: AppItem): boolean {
  if (app.id === -1 || app.id === -2 || app.id === -3 || app.id === -4 || app.id === -5 || app.id === -6) return true; // 内置应用默认为收藏状态
  return mineApps.value.some((item: any) => item.appId === app.id);
}

// 启动应用
async function handleRunApp(app: AppItem): Promise<void> {
  console.log('handleRunApp被调用，应用信息:', app);
  
  if (app.id === -3) {
    // 小红书产品工厂应用 - 使用嵌入式显示
    console.log('准备显示小红书产品工厂应用');
    appCatStore.showApp({
      id: 'xhs-product-factory-app',
      name: '图文矩阵',
      type: 'built-in',
      path: 'xhs-product-factory'
    });
    
    // 检查应用是否已正确设置
    console.log('小红书产品工厂应用设置后状态:',
                '显示状态=', appCatStore.showEmbeddedApp,
                '应用信息=', appCatStore.currentEmbeddedApp);
    return;
  }
  
  if (app.id === -1) {
    // 小红书笔记应用 - 使用嵌入式显示
    // 如果是直接点击小红书笔记应用，清除之前的活动ID
    localStorage.removeItem('currentActivityId');
    
    console.log('准备显示小红书笔记应用');
    appCatStore.showApp({
      id: 'xhs-notes-app',
      name: '小红书笔记',
      type: 'built-in',
      path: 'xhs-notes'
    });
    
    // 检查应用是否已正确设置
    console.log('小红书笔记应用设置后状态:',
                '显示状态=', appCatStore.showEmbeddedApp,
                '应用信息=', appCatStore.currentEmbeddedApp);
    return;
  }
  
  if (app.id === -2) {
    // 小红书活动类型应用 - 使用嵌入式显示
    // 清除之前的活动ID
    localStorage.removeItem('currentActivityId');
    
    console.log('准备显示小红书活动类型应用');
    appCatStore.showApp({
      id: 'xhs-activities-app',
      name: '活动类型',
      type: 'built-in',
      path: 'xhs-activities'
    });
    
    // 检查应用是否已正确设置
    console.log('小红书活动类型应用设置后状态:',
                '显示状态=', appCatStore.showEmbeddedApp,
                '应用信息=', appCatStore.currentEmbeddedApp);
    return;
  }
  
  if (app.id === -4) {
    // 账号分析应用 - 使用嵌入式显示
    console.log('准备显示账号分析应用');
    appCatStore.showApp({
      id: 'account-analysis-app',
      name: '账号AI分析',
      type: 'built-in',
      path: 'account-analysis'
    });
    
    // 检查应用是否已正确设置
    console.log('账号分析应用设置后状态:',
                '显示状态=', appCatStore.showEmbeddedApp,
                '应用信息=', appCatStore.currentEmbeddedApp);
    return;
  }
  
  if (app.id === -6) {
    // 智能生图应用 - 使用嵌入式显示
    console.log('准备显示智能生图应用');
    appCatStore.showApp({
      id: 'image-generator-app',
      name: '智能生图',
      type: 'built-in',
      path: 'image-generator'
    });
    
    // 检查应用是否已正确设置
    console.log('智能生图应用设置后状态:',
                '显示状态=', appCatStore.showEmbeddedApp,
                '应用信息=', appCatStore.currentEmbeddedApp);
    return;
  }
  
  if (app.id === -5) {
    // 笔记模板市场应用 - 使用嵌入式显示
    console.log('准备显示笔记模板市场应用');
    appCatStore.showApp({
      id: 'notes-market-app',
      name: '笔记模板市场',
      type: 'built-in',
      path: 'notes-market'
    });
    
    // 检查应用是否已正确设置
    console.log('笔记模板市场应用设置后状态:',
                '显示状态=', appCatStore.showEmbeddedApp,
                '应用信息=', appCatStore.currentEmbeddedApp);
    return;
  }
  
  // 常规AI应用仍然使用对话方式打开
  const appIdAsNumber = Number(app.id);
  router.replace({ path: '/chat', query: { appId: appIdAsNumber } });
}

// 查询应用列表
async function queryApps(): Promise<void> {
  // 不需要查询常规应用列表，因为我们只显示小红书应用
  // 但保留此方法以避免影响其他功能
  appList.value = [];
}

onMounted(() => {
  queryApps();
  appCatStore.queryMineApps();
  
  // 如果需要自动打开第一个应用
  if (autoOpenFirstApp.value && filteredAppList.value.length > 0) {
    setTimeout(() => {
      // 自动打开第一个应用
      handleRunApp(filteredAppList.value[0]);
      // 只在第一次加载时自动打开
      autoOpenFirstApp.value = false;
    }, 200);
  }
});
</script>

<template>
  <div
    class="App-component flex flex-col gap-4 px-4 py-3 overflow-y-auto max-h-full noScrollbar"
    style="-ms-overflow-style: none; scrollbar-width: none"
  >
    <!-- 搜索框 -->
    <div class="relative w-full">
      <input
        v-model="keyword"
        type="text"
        class="w-full pl-10 pr-8 py-2.5 text-sm rounded-lg border border-gray-200 bg-gray-50 focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:focus:ring-gray-700"
        placeholder="搜索应用..."
      />
      <span
        class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </span>
      <span
        v-if="keyword"
        class="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        @click="keyword = ''"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </span>
    </div>

    <!-- 应用列表 -->
    <div class="grid grid-cols-1 gap-3">
      <div
        v-for="(app, index) in filteredAppList"
        :key="app.id"
        :class="['app-item', index === 0 ? 'first-app-item' : '']"
        class="select-none relative bg-white shadow-sm border border-gray-100 flex flex-col items-start gap-2 px-3 py-3 break-all rounded-xl cursor-pointer group font-medium dark:bg-gray-800 dark:border-gray-700 hover:shadow-md hover:border-blue-200 dark:hover:border-gray-600 transition-all"
        @click="handleRunApp(app)"
      >
        <div class="flex items-center justify-between w-full">
          <div class="flex items-center space-x-3">
            <!-- 头像部分 -->
            <div
              :class="[
                'w-11 h-11 rounded-full flex items-center justify-center overflow-hidden shadow-sm',
                app.id === -3 ? 'bg-rose-500' : '',
                app.id === -6 ? 'bg-blue-500' : '',
                app.id === -1 ? 'bg-rose-500' : '',
                app.id === -2 ? 'bg-rose-500' : '',
                app.id === -4 ? 'bg-blue-500' : '',
                app.id === -5 ? 'bg-orange-500' : '',
                ![-1, -2, -3, -4, -5, -6].includes(app.id) ? 'bg-gradient-to-br from-blue-50 to-gray-100 dark:from-gray-700 dark:to-gray-800' : ''
              ]"
            >
              <img
                v-if="app.coverImg"
                :src="app.coverImg"
                alt="App cover"
                class="w-full h-full object-cover"
              />
              <span v-else class="text-sm font-medium">
                {{ app.name.charAt(0) }}
              </span>
            </div>

            <!-- 名称部分 -->
            <span
              class="line-clamp-1 overflow-hidden text-ellipsis w-32 block whitespace-nowrap font-semibold text-base text-gray-800 dark:text-gray-100"
            >
              {{ app.name }}
            </span>
          </div>

          <!-- 收藏标记 -->
          <div v-if="isMineApp(app)" class="text-yellow-400">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </div>
        </div>

        <div class="w-full">
          <span
            class="min-h-[2rem] text-xs line-clamp-2 text-gray-500 dark:text-gray-400"
          >
            {{ app.des }}
          </span>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div
      v-if="filteredAppList.length === 0"
      class="flex flex-col items-center justify-center py-8 text-gray-500 dark:text-gray-400"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mb-2 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
      <span class="text-sm font-medium">暂无应用</span>
    </div>
  </div>
</template> 

<style scoped>
.app-item {
  position: relative;
  overflow: hidden;
}

.app-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 0;
  background: linear-gradient(to bottom, #3b82f6, #60a5fa);
  transition: height 0.2s ease;
  border-top-left-radius: 0.75rem;
  border-bottom-left-radius: 0.75rem;
}

.app-item:hover::before {
  height: 100%;
}

.dark .app-item::before {
  background: linear-gradient(to bottom, #4f46e5, #818cf8);
}
</style> 