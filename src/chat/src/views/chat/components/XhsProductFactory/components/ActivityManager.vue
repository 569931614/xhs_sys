<template>
  <div>
    <div class="mb-6">
      <label class="block text-gray-700 dark:text-gray-300 mb-2 font-medium">
        选择活动
      </label>
      
      <div class="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
        <div class="relative flex-1">
          <select
            v-model="selectedActivityId"
            class="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 dark:text-white transition-all duration-200 appearance-none"
            :disabled="loading"
          >
            <option v-for="activity in activities" :key="activity.id" :value="activity.id">
              {{ activity.name }} 
              <template v-if="activity.isDefault">(默认)</template>
              <template v-if="activity.totalNotes > 0">
                (可用:{{ activity.availableNotes }}/总数:{{ activity.totalNotes }})
              </template>
            </option>
          </select>
          <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
        
        <button
          type="button"
          @click="showActivityModal = true"
          class="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-all duration-200 flex items-center justify-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          新建活动
        </button>
        
        <button
          type="button"
          @click="viewActivities"
          class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-all duration-200 flex items-center justify-center"
          title="查看所有活动"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          查看活动
        </button>
        
        <button
          type="button"
          @click="refreshActivities"
          class="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-200 flex items-center justify-center"
          title="刷新活动列表"
          :disabled="loading"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" :class="{ 'animate-spin': loading }" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>
    </div>
    
    <!-- 添加活动弹窗 -->
    <div v-if="showActivityModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-75 backdrop-blur-sm">
      <div class="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full shadow-2xl transform transition-all duration-300 scale-100">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-bold text-gray-800 dark:text-gray-200">
            创建新活动
          </h3>
          <button type="button" @click="showActivityModal = false" class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div class="mb-4">
          <label class="block text-gray-700 dark:text-gray-300 mb-2 text-sm font-medium">
            活动名称
            <span class="text-red-500">*</span>
          </label>
          <input 
            v-model="newActivity.name"
            type="text"
            placeholder="例如：双11促销活动"
            class="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 dark:text-white transition-all duration-200"
          />
        </div>
        
        <div class="mb-4">
          <label class="block text-gray-700 dark:text-gray-300 mb-2 text-sm font-medium">
            活动类型
          </label>
          <div class="flex space-x-4">
            <label class="flex items-center">
              <input 
                v-model="newActivity.type"
                type="radio"
                value="normal"
                class="form-radio h-4 w-4 text-pink-500 focus:ring-pink-500"
              />
              <span class="ml-2 text-gray-700 dark:text-gray-300">普通活动</span>
            </label>
            <label class="flex items-center">
              <input 
                v-model="newActivity.type"
                type="radio"
                value="special"
                class="form-radio h-4 w-4 text-pink-500 focus:ring-pink-500"
              />
              <span class="ml-2 text-gray-700 dark:text-gray-300">特殊活动</span>
            </label>
          </div>
        </div>
        
        <div class="mb-4">
          <label class="block text-gray-700 dark:text-gray-300 mb-2 text-sm font-medium">
            活动状态
          </label>
          <div class="flex space-x-4">
            <label class="flex items-center">
              <input 
                v-model="newActivity.status"
                type="radio"
                value="active"
                class="form-radio h-4 w-4 text-pink-500 focus:ring-pink-500"
              />
              <span class="ml-2 text-gray-700 dark:text-gray-300">活跃</span>
            </label>
            <label class="flex items-center">
              <input 
                v-model="newActivity.status"
                type="radio"
                value="inactive"
                class="form-radio h-4 w-4 text-pink-500 focus:ring-pink-500"
              />
              <span class="ml-2 text-gray-700 dark:text-gray-300">非活跃</span>
            </label>
          </div>
        </div>
        
        <div class="flex justify-end space-x-2 mt-6">
          <button
            type="button"
            @click="showActivityModal = false"
            class="px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-750 transition-all duration-200"
          >
            取消
          </button>
          <button
            type="button"
            @click="createActivity"
            class="px-4 py-2 bg-pink-500 text-white rounded-md hover:bg-pink-600 transition-all duration-200 flex items-center"
            :disabled="!newActivity.name || creatingActivity"
          >
            <svg v-if="creatingActivity" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {{ creatingActivity ? '创建中...' : '创建活动' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { fetchXhsActivitiesStatsAPI, createXhsActivityAPI } from '@/api/xhs';
import { useRouter } from 'vue-router';
import { useAppCatStore } from '@/store';

// 获取路由实例
const router = useRouter();
// 获取应用状态管理
const appCatStore = useAppCatStore();

// 定义活动接口
interface Activity {
  id: string;
  name: string;
  type: string;
  status: string;
  isDefault: boolean;
  totalNotes: number;
  availableNotes: number;
  publishedNotes: number;
}

// 定义props
const props = defineProps<{
  modelValue: string;
}>();

// 定义事件
const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
  (e: 'error', message: string): void;
}>();

// 状态
const activities = ref<Activity[]>([]);
const loading = ref(false);
const creatingActivity = ref(false);
const showActivityModal = ref(false);
const newActivity = ref({
  name: '',
  type: 'normal',
  status: 'active'
});
const selectedActivityId = ref(props.modelValue || '');

// 监视selectedActivityId的变化，同步到父组件
watch(selectedActivityId, (newValue) => {
  emit('update:modelValue', newValue);
});

// 监听props.modelValue的变化，更新selectedActivityId
watch(() => props.modelValue, (newValue) => {
  selectedActivityId.value = newValue;
});

// 生成唯一ID的函数
const generateRandomId = (prefix: string = '') => {
  const timestamp = Date.now().toString().slice(-6);
  const randomStr = Math.random().toString(36).substring(2, 7);
  return prefix ? `${prefix}_${timestamp}${randomStr}` : `${timestamp}${randomStr}`;
};

// 初始化默认活动
const initDefaultActivity = () => {
  // 检查是否已存在默认活动
  const defaultExists = activities.value.some(activity => activity.isDefault);
  
  if (!defaultExists) {
    const defaultActivity = {
      id: generateRandomId('d'),
      name: '日常使用',
      type: 'normal',
      status: 'active',
      totalNotes: 0,
      availableNotes: 0,
      publishedNotes: 0,
      isDefault: true
    };
    
    activities.value.push(defaultActivity);
    
    if (!selectedActivityId.value) {
      selectedActivityId.value = defaultActivity.id;
      emit('update:modelValue', defaultActivity.id);
    }
  }
};

// 获取活动列表
async function fetchActivities() {
  try {
    loading.value = true;
    console.log('开始获取活动列表...');
    const response = await fetchXhsActivitiesStatsAPI();
    
    console.log('获取到活动列表数据:', response);
    
    // 处理不同格式的响应
    let activitiesData: any[] = [];
    
    if (response) {
      if (Array.isArray(response)) {
        // 直接是数组格式
        console.log('响应是数组格式');
        activitiesData = response;
      } else if (typeof response === 'object') {
        const responseObj = response as Record<string, any>;
        
        if (responseObj.data && Array.isArray(responseObj.data)) {
          // data字段是数组
          console.log('响应的data字段是数组');
          activitiesData = responseObj.data;
        } else if (responseObj.data && typeof responseObj.data === 'object') {
          // data字段是单个对象
          console.log('响应的data字段是对象');
          activitiesData = [responseObj.data];
        } else if (responseObj.items && Array.isArray(responseObj.items)) {
          // items字段是数组
          console.log('响应的items字段是数组');
          activitiesData = responseObj.items;
        } else {
          // 其他情况尝试转换为数组
          console.log('尝试将响应转为数组');
          activitiesData = Object.values(responseObj).filter(item => item && typeof item === 'object');
        }
      }
    }
    
    console.log('解析后的活动数据:', activitiesData);
    
    // 规范化活动数据，确保每个活动有所有必要字段
    const normalizedActivities = activitiesData.map((activity: any) => {
      return {
        id: activity.id || generateRandomId('a'),
        name: activity.name || '未命名活动',
        type: activity.type || 'normal',
        status: activity.status || 'active',
        isDefault: !!activity.isDefault,
        totalNotes: activity.totalNotes || 0,
        availableNotes: activity.availableNotes || 0,
        publishedNotes: activity.publishedNotes || 0
      };
    });
    
    activities.value = normalizedActivities;
    console.log('已更新活动列表数组:', activities.value);
    
    // 如果还没有选择活动，但列表非空，则选择第一个
    if ((!selectedActivityId.value || !activities.value.find(a => a.id === selectedActivityId.value)) && activities.value.length > 0) {
      selectedActivityId.value = activities.value[0].id;
      emit('update:modelValue', selectedActivityId.value);
      console.log('自动选择第一个活动:', selectedActivityId.value);
    }
    
    // 确保有默认活动
    initDefaultActivity();
  } catch (error: any) {
    console.error('获取活动列表失败:', error);
    emit('error', error.message || '获取活动列表失败');
    // 初始化默认活动
    activities.value = [];
    initDefaultActivity();
  } finally {
    loading.value = false;
  }
}

// 创建新活动
async function createActivity() {
  if (!newActivity.value.name) {
    return;
  }
  
  try {
    creatingActivity.value = true;
    console.log('开始创建活动:', newActivity.value);
    
    // 调用API创建活动
    const response = await createXhsActivityAPI({
      name: newActivity.value.name,
      type: newActivity.value.type,
      status: newActivity.value.status
    });
    
    console.log('创建活动API响应:', response);
    
    // 添加到活动列表
    if (response && response.data && response.data.id) {
      const newActivityObj = {
        id: response.data.id,
        name: newActivity.value.name,
        type: newActivity.value.type,
        status: newActivity.value.status,
        isDefault: false,
        totalNotes: 0,
        availableNotes: 0,
        publishedNotes: 0
      };
      
      activities.value.push(newActivityObj);
      console.log('新活动已添加到列表:', newActivityObj);
      
      // 选择新创建的活动
      selectedActivityId.value = newActivityObj.id;
      emit('update:modelValue', newActivityObj.id);
      
      // 重置表单
      newActivity.value = {
        name: '',
        type: 'normal',
        status: 'active'
      };
      
      // 关闭弹窗
      showActivityModal.value = false;
    } else {
      console.error('创建活动失败，响应无效:', response);
      throw new Error('创建活动失败，服务器未返回有效数据');
    }
  } catch (error: any) {
    console.error('创建活动失败:', error);
    emit('error', error.message || '创建活动失败');
  } finally {
    creatingActivity.value = false;
  }
}

// 刷新活动列表
function refreshActivities() {
  fetchActivities();
}

// 查看所有活动
function viewActivities() {
  // 清除之前的活动ID
  localStorage.removeItem('currentActivityId');
  
  // 使用与侧边栏相同的方式显示活动类型应用
  appCatStore.showApp({
    id: 'xhs-activities-app',
    name: '活动类型',
    type: 'built-in',
    path: 'xhs-activities'
  });
}

// 生命周期钩子
onMounted(() => {
  fetchActivities();
});

// 暴露给父组件的方法
defineExpose({
  refreshActivities,
  viewActivities,
});
</script> 