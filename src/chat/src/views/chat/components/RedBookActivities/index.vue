<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import { useAuthStore, useAppCatStore } from '@/store';
import { 
  fetchXhsPostsAPI,
  fetchXhsActivitiesStatsAPI,
  createXhsActivityAPI,
  deleteXhsActivityAPI,
  ensureDefaultActivityAPI,
  updateXhsActivityAPI
} from '@/api/xhs';
import { Plus, ScanCode, Edit } from '@icon-park/vue-next';
import { useRouter } from 'vue-router';

// 声明全局router对象的类型
declare global {
  interface Window {
    router?: any;
  }
}

// 获取路由实例
const router = useRouter();

// 状态管理
const authStore = useAuthStore();
const appCatStore = useAppCatStore();
const loading = ref(false);
const error = ref<string | null>(null);
const refreshTrigger = ref(0);
const isInitialized = ref(false);
const isLoginRequired = ref(false);

// 搜索功能
const searchQuery = ref('');
const filteredActivities = computed(() => {
  if (!searchQuery.value.trim()) {
    return activities.value;
  }
  
  const query = searchQuery.value.toLowerCase().trim();
  return activities.value.filter(activity => 
    activity.name.toLowerCase().includes(query) || 
    activity.type.toLowerCase().includes(query) ||
    activity.status.toLowerCase().includes(query)
  );
});

// 活动类型列表
const activities = ref<Activity[]>([]);

// 新建活动类型弹窗状态
const showAddModal = ref(false);
const newActivity = ref({
  name: '',
  type: 'normal',
});

// 编辑活动类型弹窗状态
const showEditModal = ref(false);
const editingActivity = ref<Activity | null>(null);

// 二维码弹窗状态
const showQRCodeModal = ref(false);
const currentQRCodeActivity = ref<Activity | null>(null);

// 二维码链接
const qrCodeURL = computed(() => {
  if (!currentQRCodeActivity.value) return '';
  
  // 构建分享链接，包含活动ID
  const shareLink = encodeURIComponent(`${window.location.origin}/chat#/xhs-auto-api?identifier=${currentQRCodeActivity.value.id}`);
  
  // 使用QR服务生成二维码
  return `https://xhs.aivip1.top/api/html-render/qrcode?data=${shareLink}`;
});

// 类型定义
interface Activity {
  id: string;
  name: string;
  type: string;
  status: 'active' | 'paused' | 'completed';
  totalNotes: number;
  availableNotes: number;
  publishedNotes: number;
  isDefault?: boolean;
}

// 全局消息服务
const message = window?.$message;

// 检查用户登录状态
const checkUserLogin = computed(() => {
  return !!authStore.token && !!authStore?.userInfo?.id;
});

// 生成唯一ID的函数
const generateRandomId = (prefix: string = '') => {
  // 使用简短时间戳的最后6位 + 随机字符串，提高唯一性
  const timestamp = Date.now().toString().slice(-6);
  const randomStr = Math.random().toString(36).substring(2, 7);
  return prefix ? `${prefix}_${timestamp}${randomStr}` : `${timestamp}${randomStr}`;
};

// 初始化默认活动类型
const initDefaultActivity = () => {
  // 检查是否已存在默认活动
  const defaultExists = activities.value.some(activity => activity.isDefault);
  
  if (!defaultExists) {
    activities.value.push({
      id: generateRandomId('d'),
      name: '日常使用',
      type: 'normal',
      status: 'active',
      totalNotes: 0,
      availableNotes: 0,
      publishedNotes: 0,
      isDefault: true
    });
  }
};

// 监听刷新触发器
watch(() => refreshTrigger.value, async () => {
  await fetchActivitiesData();
});

// 添加一个延迟处理函数
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// 组件初始化函数，添加重试逻辑
async function initializeComponent(retryCount = 0) {
  console.log('RedBookActivities组件初始化...，重试次数:', retryCount);
  if (isInitialized.value && retryCount === 0) {
    console.log('RedBookActivities组件已初始化，跳过');
    return;
  }
  
  console.log('RedBookActivities组件首次初始化，准备获取数据');
  isInitialized.value = true;
  
  try {
    // 先尝试请求数据
    await fetchActivitiesData();
    console.log('RedBookActivities组件初始化完成');
  } catch (err) {
    console.error('初始化过程中出错:', err);
    
    // 如果是第一次加载且出错，等待一会再重试一次
    if (retryCount < 2) {
      console.log(`初始化失败，将在1秒后重试(${retryCount + 1}/2)`);
      await delay(1000);
      await initializeComponent(retryCount + 1);
    } else {
      console.error('重试次数达到上限，初始化失败');
      error.value = '加载失败，请刷新页面重试';
    }
  }
}

// 确保有默认活动
async function ensureDefaultActivity() {
  try {
    await ensureDefaultActivityAPI();
  } catch (error) {
    // 这里不需要显示错误，因为fetchActivitiesData中会处理错误
  }
}

// 获取活动类型数据
async function fetchActivitiesData() {
  console.log('fetchActivitiesData被调用，loading状态:', loading.value, '登录状态:', checkUserLogin.value);
  if (loading.value) {
    console.log('正在加载中，跳过请求');
    return;
  }
  
  // 检查登录状态
  if (!checkUserLogin.value) {
    console.log('用户未登录，显示登录提示');
    isLoginRequired.value = true;
    return;
  }
  
  try {
    console.log('开始请求活动列表数据...');
    loading.value = true;
    
    // 获取活动类型统计信息
    const response = await fetchXhsActivitiesStatsAPI();
    console.log('活动列表API响应得到:', response);
    
    if (response?.data) {
      // 清空现有活动数据
      activities.value = [];
      
      // 直接使用返回的数据数组
      const activitiesData = Array.isArray(response.data) ? response.data : 
                           response.data.data && Array.isArray(response.data.data) ? response.data.data : 
                           [response.data];
      
      // 更新活动列表
      activities.value = activitiesData.map((activity: any) => ({
        id: activity.id || generateRandomId('a'),
        name: activity.name,
        type: activity.type,
        status: activity.status,
        isDefault: activity.isDefault,
        totalNotes: activity.totalNotes,
        availableNotes: activity.availableNotes,
        publishedNotes: activity.publishedNotes
      }));
      
      // 如果没有活动，则确保至少有一个默认活动
      if (activities.value.length === 0) {
        initDefaultActivity();
      }
    } else {
      // 如果没有返回数据，则初始化默认活动
      activities.value = [];
      initDefaultActivity();
    }
  } catch (error: any) {
    // 检查是否是认证问题
    if (error?.message?.includes('401') || error?.response?.status === 401) {
      isLoginRequired.value = true;
      error.value = '请先登录后再使用此功能';
    } else {
      message?.error('获取活动类型失败，请稍后重试');
      error.value = error?.message || '获取活动类型失败';
    }
    
    // 确保默认活动存在
    activities.value = [];
    initDefaultActivity();
  } finally {
    loading.value = false;
  }
}

// 添加新活动类型
const handleAddActivity = async () => {
  if (!newActivity.value.name.trim()) {
    message?.error('活动名称不能为空');
    return;
  }
  
  // 检查名称是否重复
  const isDuplicate = activities.value.some(
    activity => activity.name === newActivity.value.name.trim()
  );
  
  if (isDuplicate) {
    message?.error('活动名称已存在，请使用其他名称');
    return;
  }
  
  try {
    // 调用API创建活动，使用用户选择的类型
    const response = await createXhsActivityAPI({
      name: newActivity.value.name.trim(),
      type: newActivity.value.type,  // 使用用户选择的类型
      status: 'active'
    });
    
    if (response?.data) {
      message?.success('添加活动成功');
      
      // 重新加载活动列表
      refreshTrigger.value += 1;
    } else {
      message?.error('添加活动失败，请稍后重试');
    }
  } catch (error: any) {
    console.error('创建活动类型失败', error?.message || error);
    message?.error('添加活动失败: ' + (error?.message || '未知错误'));
  }
  
  // 重置表单
  newActivity.value = {
    name: '',
    type: 'normal'
  };
  
  // 关闭弹窗
  showAddModal.value = false;
};

// 删除活动类型
const handleDeleteActivity = async (id: string) => {
  // 不允许删除默认活动
  const targetActivity = activities.value.find(a => a.id === id);
  if (targetActivity?.isDefault) {
    message?.error('不能删除默认活动类型');
    return;
  }
  
  try {
    // 调用API删除活动
    await deleteXhsActivityAPI(id);
    
    // 从本地列表中移除
    activities.value = activities.value.filter(a => a.id !== id);
    
    message?.success('删除活动类型成功');
  } catch (error: any) {
    console.error('删除活动类型失败', error?.message || error);
    message?.error('删除活动类型失败: ' + (error?.message || '未知错误'));
  }
};

// 显示二维码
const showQRCode = (activity: Activity) => {
  currentQRCodeActivity.value = activity;
  showQRCodeModal.value = true;
};

// 跳转到活动详情页
const navigateToActivity = (id: string) => {
  try {
    // 获取当前点击的活动
    const activity = activities.value.find(a => a.id === id);
    
    // 检查是否是默认活动（"日常使用"）
    if (activity?.isDefault) {
      // 对于默认活动，设置特殊标记: "default"，而不是实际的ID
      appCatStore.showApp({
        id: 'xhs-notes',
        name: '小红书笔记',
        type: 'built-in',
        path: 'xhs-notes',
        params: { activityId: 'default' }
      });
      
      // 为保持兼容性，在localStorage中存储特殊值
      localStorage.setItem('currentActivityId', 'default');
      
      // 显示成功消息
      message?.success(`正在打开默认活动: ${activity.name}`);
    } else {
      // 非默认活动，使用常规ID
      appCatStore.showApp({
        id: 'xhs-notes',
        name: '小红书笔记',
        type: 'built-in',
        path: 'xhs-notes',
        params: { activityId: id }
      });
      
      // 记录当前活动ID，以便在笔记组件中使用
      localStorage.setItem('currentActivityId', id);
      
      // 显示成功消息
      message?.success(`正在打开活动: ${activity?.name}`);
    }
  } catch (error) {
    message?.error('打开活动失败，请稍后重试');
  }
};

// 获取状态显示样式
const getStatusStyle = (status: string) => {
  switch (status) {
    case 'active':
      return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800';
    case 'paused':
      return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800';
    case 'completed':
      return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700';
    default:
      return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700';
  }
};

// 获取状态文本
const getStatusText = (status: string) => {
  switch (status) {
    case 'active':
      return '活跃';
    case 'paused':
      return '暂停';
    case 'completed':
      return '完成';
    default:
      return status;
  }
};

// 处理登录点击
const handleLogin = () => {
  authStore.setLoginDialog(true);
};

// 监听组件挂载，确保初始化
onMounted(() => {
  console.log('RedBookActivities组件挂载完成，立即初始化');
  initializeComponent();
});

// 添加watch，监听页面显示状态，确保组件在可见时初始化
watch(() => appCatStore.showEmbeddedApp, (newVal) => {
  console.log('appCatStore.showEmbeddedApp变化:', newVal);
  if (newVal && appCatStore.currentEmbeddedApp?.path === 'xhs-activities') {
    console.log('检测到小红书活动类型组件显示，准备初始化');
    // 等待DOM更新后再初始化
    nextTick(() => {
      initializeComponent();
    });
  }
}, { immediate: true });

// 添加强制刷新函数
function forceRefresh() {
  console.log('强制刷新活动列表');
  refreshTrigger.value += 1;
}

// 通过刷新机制触发初始化
watch(() => appCatStore.currentEmbeddedApp, (newVal) => {
  if (newVal?.path === 'xhs-activities') {
    console.log('检测到活动类型成为当前显示组件，准备刷新数据');
    // 如果组件已经初始化过，强制刷新数据
    if (isInitialized.value) {
      console.log('组件已初始化，强制刷新数据');
      nextTick(() => {
        forceRefresh();
      });
    }
  }
}, { deep: true });

// 确保在路由或参数变化时也能刷新
const currentPath = window?.location?.hash;
watch(() => currentPath, (newVal, oldVal) => {
  if (newVal !== oldVal && newVal.includes('xhs-activities')) {
    console.log('检测到路由变化到活动类型组件，刷新数据');
    nextTick(() => {
      initializeComponent();
    });
  }
});

// 显示编辑弹窗
const showEditActivityModal = (activity: Activity, event: Event) => {
  // 阻止事件冒泡，避免触发卡片点击
  event.stopPropagation();
  
  // 手动创建一个全新的对象，确保所有字段都被正确复制
  const editActivity = {
    id: activity.id,
    name: activity.name || '',
    type: activity.type || 'normal',
    status: activity.status || 'active',
    totalNotes: activity.totalNotes || 0,
    availableNotes: activity.availableNotes || 0,
    publishedNotes: activity.publishedNotes || 0,
    isDefault: activity.isDefault || false
  };
  
  // 先设置完整的活动对象
  editingActivity.value = editActivity;
  
  // 打印一下值，确认正确性
  console.log('正在编辑活动:', editingActivity.value);
  
  // 确保在下一个渲染周期打开弹窗
  nextTick(() => {
    showEditModal.value = true;
  });
};

// 编辑活动类型
const handleEditActivity = async () => {
  if (!editingActivity.value) return;
  
  if (!editingActivity.value.name.trim()) {
    message?.error('活动名称不能为空');
    return;
  }
  
  // 检查名称是否重复（排除当前编辑的活动）
  const isDuplicate = activities.value.some(
    activity => activity.name === editingActivity.value?.name.trim() && activity.id !== editingActivity.value?.id
  );
  
  if (isDuplicate) {
    message?.error('活动名称已存在，请使用其他名称');
    return;
  }
  
  try {
    // 调用API更新活动
    const response = await updateXhsActivityAPI(editingActivity.value.id, {
      name: editingActivity.value.name.trim(),
      type: editingActivity.value.type,
      status: editingActivity.value.status
    });
    
    if (response?.data) {
      message?.success('更新活动成功');
      
      // 重新加载活动列表
      refreshTrigger.value += 1;
    } else {
      message?.error('更新活动失败，请稍后重试');
    }
  } catch (error: any) {
    console.error('更新活动类型失败', error?.message || error);
    message?.error('更新活动失败: ' + (error?.message || '未知错误'));
  }
  
  // 关闭弹窗
  showEditModal.value = false;
  editingActivity.value = null;
};
</script>

<template>
  <div class="redbook-activities-container p-4">
    <!-- 登录提示 -->
    <div v-if="isLoginRequired" class="flex flex-col items-center justify-center py-20">
      <div class="text-gray-500 dark:text-gray-400 mb-4 text-center">
        请先登录后再使用此功能
      </div>
      <button 
        @click="handleLogin"
        class="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
      >
        去登录
      </button>
    </div>
    
    <!-- 正常内容 -->
    <template v-else>
      <div class="mb-6 flex justify-between items-center">
        <div class="relative flex items-center">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="搜索活动..."
            class="pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 w-64"
          />
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 absolute left-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <button 
          @click="showAddModal = true"
          class="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg flex items-center shadow-sm transition-all duration-200 transform hover:scale-105"
        >
          <Plus theme="filled" class="mr-1" size="18" />
          <span>添加活动</span>
        </button>
      </div>
      
      <!-- 活动类型列表 -->
      <div v-if="loading" class="flex justify-center items-center py-10">
        <div class="loader"></div>
      </div>
      
      <div v-else-if="error" class="py-10 text-center text-red-500">
        {{ error }}
      </div>
      
      <div v-else-if="activities.length === 0" class="py-10 text-center text-gray-500">
        暂无活动类型，请添加
      </div>
      
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <div 
          v-for="activity in filteredActivities" 
          :key="activity.id"
          class="bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow p-5 border border-gray-100 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-300 relative overflow-hidden cursor-pointer"
          @click="navigateToActivity(activity.id)"
        >
          <!-- 活动名称和顶部按钮 -->
          <div class="flex justify-between items-center mb-2">
            <h3 class="text-lg font-medium text-gray-800 dark:text-gray-200 line-clamp-1 break-all mr-2">
              {{ activity.name }}
            </h3>
            
            <div class="flex items-center space-x-1">
              <button 
                @click.stop="showQRCode(activity)" 
                class="text-gray-400 hover:text-blue-500 transition-colors p-1 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/20"
                title="查看二维码"
              >
                <ScanCode theme="outline" size="18" />
              </button>
              
              <button 
                @click.stop="showEditActivityModal(activity, $event)" 
                class="text-gray-400 hover:text-green-500 transition-colors p-1 rounded-full hover:bg-green-50 dark:hover:bg-green-900/20"
                title="编辑活动"
              >
                <Edit theme="outline" size="18" />
              </button>
              
              <button 
                v-if="!activity.isDefault"
                @click.stop="handleDeleteActivity(activity.id)" 
                class="text-gray-400 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20"
                title="删除活动"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
          
          <!-- 标签行 -->
          <div class="flex flex-wrap gap-1 mb-3">
            <span 
              v-if="activity.isDefault" 
              class="text-xs px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full"
            >
              默认
            </span>
            
            <span 
              class="inline-flex items-center text-xs px-2 py-0.5 rounded-full"
              :class="activity.type === 'video' ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' : 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400'"
            >
              <span v-if="activity.type === 'video'" class="mr-1">🎬</span>
              <span v-else class="mr-1">📸</span>
              {{ activity.type === 'video' ? '视频' : '图文' }}
            </span>
            
            <span 
              class="text-xs px-3 py-0.5 rounded-full font-medium" 
              :class="getStatusStyle(activity.status)"
            >
              {{ activity.status === 'active' ? '活跃' : 
                 activity.status === 'paused' ? '暂停' : 
                 activity.status === 'completed' ? '完成' : activity.status }}
            </span>
          </div>
          
          <!-- 统计数据部分 -->
          <div 
            class="grid grid-cols-3 gap-2 w-full mt-1"
          >
            <div class="text-center py-1 rounded-md bg-gray-100 dark:bg-gray-700/50 flex flex-col justify-center">
              <div class="text-xl font-bold text-gray-700 dark:text-gray-300 mb-1">{{ activity.totalNotes }}</div>
              <div class="text-xs text-gray-500 dark:text-gray-400">笔记总数</div>
            </div>
            <div class="text-center py-1 rounded-md bg-green-50 dark:bg-green-900/20 flex flex-col justify-center">
              <div class="text-xl font-bold text-green-600 dark:text-green-400 mb-1">{{ activity.availableNotes }}</div>
              <div class="text-xs text-green-600/70 dark:text-green-500">可发布数</div>
            </div>
            <div class="text-center py-1 rounded-md bg-blue-50 dark:bg-blue-900/20 flex flex-col justify-center">
              <div class="text-xl font-bold text-blue-600 dark:text-blue-400 mb-1">{{ activity.publishedNotes }}</div>
              <div class="text-xs text-blue-600/70 dark:text-blue-500">已发布数</div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 添加活动弹窗 -->
      <div v-if="showAddModal" class="fixed inset-0 flex items-center justify-center z-50 animate-fadeIn">
        <div class="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm" @click="showAddModal = false"></div>
        <div class="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md mx-4 z-10 shadow-xl animate-scaleIn">
          <h2 class="text-xl font-bold mb-6 text-gray-800 dark:text-gray-200">添加活动</h2>
          
          <div class="mb-5">
            <label class="block text-gray-700 dark:text-gray-300 mb-2 font-medium">活动名称</label>
            <input 
              v-model="newActivity.name"
              type="text" 
              class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 text-gray-800 dark:text-white transition-all"
              placeholder="请输入活动名称"
            />
          </div>
          
          <div class="mb-6">
            <label class="block text-gray-700 dark:text-gray-300 mb-3 font-medium">内容类型</label>
            <div class="flex space-x-4">
              <label 
                class="flex-1 relative cursor-pointer" 
                :class="{ 'opacity-100': newActivity.type === 'normal', 'opacity-70': newActivity.type !== 'normal' }"
              >
                <input 
                  type="radio" 
                  name="activityType" 
                  value="normal" 
                  v-model="newActivity.type"
                  class="absolute opacity-0 h-0 w-0" 
                />
                <div 
                  class="p-4 flex flex-col items-center justify-center rounded-lg border transition-all duration-200 h-24"
                  :class="newActivity.type === 'normal' 
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 dark:border-primary-700 shadow-sm' 
                    : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800'"
                >
                  <div class="text-3xl mb-2">📸</div>
                  <div class="text-sm font-medium" :class="newActivity.type === 'normal' ? 'text-primary-700 dark:text-primary-400' : 'text-gray-700 dark:text-gray-400'">
                    图文
                  </div>
                </div>
              </label>
              
              <label 
                class="flex-1 relative cursor-pointer" 
                :class="{ 'opacity-100': newActivity.type === 'video', 'opacity-70': newActivity.type !== 'video' }"
              >
                <input 
                  type="radio" 
                  name="activityType" 
                  value="video" 
                  v-model="newActivity.type"
                  class="absolute opacity-0 h-0 w-0" 
                />
                <div 
                  class="p-4 flex flex-col items-center justify-center rounded-lg border transition-all duration-200 h-24"
                  :class="newActivity.type === 'video' 
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 dark:border-primary-700 shadow-sm' 
                    : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800'"
                >
                  <div class="text-3xl mb-2">🎬</div>
                  <div class="text-sm font-medium" :class="newActivity.type === 'video' ? 'text-primary-700 dark:text-primary-400' : 'text-gray-700 dark:text-gray-400'">
                    视频
                  </div>
                </div>
              </label>
            </div>
          </div>
          
          <div class="flex justify-end space-x-3 mt-6">
            <button 
              @click="showAddModal = false"
              class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              取消
            </button>
            <button 
              @click="handleAddActivity"
              class="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg transition-colors shadow-sm"
            >
              添加
            </button>
          </div>
        </div>
      </div>
      
      <!-- 二维码弹窗 -->
      <div v-if="showQRCodeModal && currentQRCodeActivity" class="fixed inset-0 flex items-center justify-center z-50 animate-fadeIn">
        <div class="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm" @click="showQRCodeModal = false"></div>
        <div class="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md mx-4 z-10 shadow-xl animate-scaleIn">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-xl font-bold text-gray-800 dark:text-gray-200">
              {{ currentQRCodeActivity.name }} 二维码
            </h2>
            <button 
              @click="showQRCodeModal = false"
              class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div class="flex flex-col items-center justify-center py-4">
            <div class="bg-white p-4 rounded-lg shadow-sm mb-4">
              <img :src="qrCodeURL" alt="QR Code" class="w-64 h-64" />
            </div>
            <p class="text-sm text-gray-600 dark:text-gray-400 text-center mt-2 mb-6">
              扫描二维码访问活动
            </p>
          </div>
          
          <div class="flex justify-center">
            <button 
              @click="showQRCodeModal = false"
              class="px-6 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg transition-colors shadow-sm"
            >
              关闭
            </button>
          </div>
        </div>
      </div>
      
      <!-- 编辑活动弹窗 -->
      <div v-if="showEditModal && editingActivity" class="fixed inset-0 flex items-center justify-center z-50 animate-fadeIn">
        <div class="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm" @click="showEditModal = false"></div>
        <div class="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md mx-4 z-10 shadow-xl animate-scaleIn">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-xl font-bold text-gray-800 dark:text-gray-200">编辑活动</h2>
            <button 
              @click="showEditModal = false"
              class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <!-- 调试信息，方便排查 -->
          <pre v-if="false" class="text-xs mb-2 p-2 bg-gray-100 dark:bg-gray-700 rounded">{{ JSON.stringify(editingActivity, null, 2) }}</pre>
          
          <div class="mb-5">
            <label class="block text-gray-700 dark:text-gray-300 mb-2 font-medium">活动名称</label>
            <input 
              :value="editingActivity.name"
              @input="editingActivity.name = ($event.target as HTMLInputElement).value"
              type="text" 
              class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 text-gray-800 dark:text-white transition-all"
              placeholder="请输入活动名称"
            />
          </div>
          
          <div class="mb-6">
            <label class="block text-gray-700 dark:text-gray-300 mb-3 font-medium">内容类型</label>
            <div class="flex space-x-4">
              <label 
                class="flex-1 relative cursor-pointer" 
                :class="{ 'opacity-100': editingActivity.type === 'normal', 'opacity-70': editingActivity.type !== 'normal' }"
              >
                <input 
                  type="radio" 
                  name="editActivityType" 
                  value="normal" 
                  :checked="editingActivity.type === 'normal'"
                  @change="editingActivity.type = 'normal'"
                  class="absolute opacity-0 h-0 w-0" 
                />
                <div 
                  class="p-4 flex flex-col items-center justify-center rounded-lg border transition-all duration-200 h-24"
                  :class="editingActivity.type === 'normal' 
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 dark:border-primary-700 shadow-sm' 
                    : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800'"
                >
                  <div class="text-3xl mb-2">📸</div>
                  <div class="text-sm font-medium" :class="editingActivity.type === 'normal' ? 'text-primary-700 dark:text-primary-400' : 'text-gray-700 dark:text-gray-400'">
                    图文
                  </div>
                </div>
              </label>
              
              <label 
                class="flex-1 relative cursor-pointer" 
                :class="{ 'opacity-100': editingActivity.type === 'video', 'opacity-70': editingActivity.type !== 'video' }"
              >
                <input 
                  type="radio" 
                  name="editActivityType" 
                  value="video" 
                  :checked="editingActivity.type === 'video'"
                  @change="editingActivity.type = 'video'"
                  class="absolute opacity-0 h-0 w-0" 
                />
                <div 
                  class="p-4 flex flex-col items-center justify-center rounded-lg border transition-all duration-200 h-24"
                  :class="editingActivity.type === 'video' 
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 dark:border-primary-700 shadow-sm' 
                    : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800'"
                >
                  <div class="text-3xl mb-2">🎬</div>
                  <div class="text-sm font-medium" :class="editingActivity.type === 'video' ? 'text-primary-700 dark:text-primary-400' : 'text-gray-700 dark:text-gray-400'">
                    视频
                  </div>
                </div>
              </label>
            </div>
          </div>
          
          <div class="mb-6">
            <label class="block text-gray-700 dark:text-gray-300 mb-2 font-medium">活动状态</label>
            <select 
              :value="editingActivity.status"
              @change="editingActivity.status = ($event.target as HTMLSelectElement).value as 'active' | 'paused' | 'completed'"
              class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 text-gray-800 dark:text-white transition-all"
            >
              <option value="active">活跃</option>
              <option value="paused">暂停</option>
              <option value="completed">完成</option>
            </select>
          </div>
          
          <div class="flex justify-end space-x-3 mt-6">
            <button 
              @click="showEditModal = false"
              class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              取消
            </button>
            <button 
              @click="handleEditActivity"
              class="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg transition-colors shadow-sm"
            >
              保存
            </button>
          </div>
        </div>
      </div>
      
      <!-- 右下角悬浮添加按钮 -->
      <button
        @click="showAddModal = true"
        class="fixed right-8 bottom-8 w-14 h-14 rounded-full bg-primary-600 hover:bg-primary-500 text-white shadow-lg flex items-center justify-center transition-all duration-200 transform hover:scale-110 z-20"
        title="添加活动"
      >
        <Plus theme="filled" size="28" />
      </button>
    </template>
  </div>
</template>

<style scoped>
.redbook-activities-container {
  width: 100%;
  margin: 0 auto;
}

.loader {
  border: 3px solid #f3f3f3;
  border-radius: 50%;
  border-top: 3px solid #4f46e5;
  width: 30px;
  height: 30px;
  animation: spin 1s linear infinite;
}

/* 活动卡片样式优化 */
.grid > div {
  position: relative;
  min-height: 100px;
  display: flex;
  flex-direction: column;
}

/* 标题样式优化 */
.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 统计数据区域样式 */
.grid-cols-3 > div {
  height: 44px;
  padding: 4px;
  align-items: center;
  justify-content: center;
}

.grid-cols-3 .text-xl {
  line-height: 1;
  margin-bottom: 10px;
  font-size: 1.3rem;
}

.grid-cols-3 .text-xs {
  margin-bottom: 0;
  line-height: 1;
  font-size: 0.8rem;
}

/* 标签样式 */
.flex.flex-wrap.gap-1 span {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 20px;
  white-space: nowrap;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .grid {
    grid-template-columns: repeat(2, 1fr) !important;
  }
}

@media (max-width: 640px) {
  .grid {
    grid-template-columns: repeat(1, 1fr) !important;
  }
  
  .mb-6.flex.justify-between.items-center {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
  
  .relative.flex.items-center {
    width: 100%;
  }
  
  .relative.flex.items-center input {
    width: 100%;
  }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.animate-fadeIn {
  animation: fadeIn 0.3s ease-out;
}

@keyframes scaleIn {
  from { transform: scale(0.95); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

.animate-scaleIn {
  animation: scaleIn 0.3s ease-out;
}
</style> 