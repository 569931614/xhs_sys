<template>
  <div class="account-analysis-container p-4">
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 max-w-5xl mx-auto">
      <h1 class="text-2xl font-bold mb-6 text-center text-gray-800 dark:text-gray-200">账号分析</h1>
      
      <div class="mb-8">
        <!-- 移除平台Tab，使用统一表单 -->
        <div class="account-form">
          <div class="grid md:grid-cols-3 gap-4">
            <div class="md:col-span-2 mb-4">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">账号链接</label>
              <input 
                v-model="accountLink" 
                type="text" 
                class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-500 focus:ring-opacity-50 dark:bg-gray-700 dark:text-white"
                placeholder="请输入抖音或小红书账号链接，系统会自动识别平台"
              />
              <p v-if="detectedPlatform" class="text-sm mt-1" :class="detectedPlatform === 'douyin' ? 'text-blue-500' : 'text-pink-500'">
                已检测到{{ detectedPlatform === 'douyin' ? '抖音' : '小红书' }}链接
              </p>
              <p v-else class="text-sm text-gray-500 mt-1">支持抖音或小红书账号链接</p>
            </div>
            
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">分析模式</label>
              <select 
                v-model="analysisMode" 
                class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-500 focus:ring-opacity-50 dark:bg-gray-700 dark:text-white"
              >
                <option value="10">全面分析</option>
                <option value="1">简单分析</option>
              </select>
            </div>
          </div>
          
          <button 
            @click="analyzeAccount" 
            class="w-full py-2 px-4 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
            :disabled="!accountLink || isLoading"
          >
            <span v-if="isLoading">分析中...</span>
            <span v-else>开始分析</span>
          </button>
        </div>
      </div>
      
      <!-- 历史分析记录 -->
      <div class="analysis-history mt-8">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-medium text-gray-800 dark:text-gray-200">分析历史</h2>
          <button 
            @click="fetchAnalysisTasks" 
            class="flex items-center text-sm text-primary-600 hover:text-primary-700"
            :disabled="isLoadingTasks"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            刷新
          </button>
        </div>
        
        <div v-if="isLoadingTasks" class="flex justify-center py-8">
          <div class="loading-spinner"></div>
        </div>
        
        <div v-else-if="!analysisTasks || analysisTasks.length === 0" class="text-center py-8 text-gray-500 dark:text-gray-400">
          暂无分析记录
        </div>
        
        <div v-else class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th class="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">平台</th>
                <th class="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">链接</th>
                <th class="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">状态</th>
                <th class="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">用户名</th>
                <th class="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">粉丝数</th>
                <th class="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">点赞数</th>
                <th class="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">时间</th>
                <th class="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              <tr v-for="task in analysisTasks" :key="task.id" class="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td class="px-3 py-4 whitespace-nowrap">
                  <span class="px-2 py-1 text-xs rounded-full" :class="{
                    'bg-blue-100 text-blue-800': task.type_name === '抖音',
                    'bg-pink-100 text-pink-800': task.type_name === '小红书',
                    'bg-green-100 text-green-800': task.status === '已完成',
                    'bg-yellow-100 text-yellow-800': task.status === '进行中',
                    'bg-red-100 text-red-800': task.status === '失败'
                  }">
                    {{ task.type_name }}
                  </span>
                </td>
                <td class="px-3 py-4 text-sm text-gray-600 dark:text-gray-300 max-w-xs truncate">
                  <div class="max-w-xs overflow-hidden text-ellipsis">{{ task.fx_url }}</div>
                </td>
                <td class="px-3 py-4 whitespace-nowrap">
                  <span class="px-2 py-1 text-xs rounded-full" 
                    :class="{
                      'bg-green-100 text-green-800': task.status === '已完成',
                      'bg-yellow-100 text-yellow-800': task.status === '进行中',
                      'bg-red-100 text-red-800': task.status === '失败'
                    }">
                    {{ task.status }}
                  </span>
                </td>
                
                <td v-if="task.account_name" class="px-3 py-4 text-sm text-gray-600 dark:text-gray-300 max-w-xs truncate">
                  <div class="max-w-xs overflow-hidden text-ellipsis font-medium">{{ task.account_name }}</div>
                </td>
                <td v-else class="px-3 py-4 text-sm text-gray-400 dark:text-gray-500">-</td>
                
                <td v-if="task.followers_count" class="px-3 py-4 text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">
                  <span class="px-2 py-1 text-xs bg-blue-50 dark:bg-blue-800 text-blue-700 dark:text-white rounded-full font-medium">
                    {{ task.followers_count }}
                  </span>
                </td>
                <td v-else class="px-3 py-4 text-sm text-gray-400 dark:text-gray-500">-</td>
                
                <td v-if="task.likes_count" class="px-3 py-4 text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">
                  <span class="px-2 py-1 text-xs bg-red-50 dark:bg-red-800 text-red-700 dark:text-white rounded-full font-medium">
                    {{ task.likes_count }}
                  </span>
                </td>
                <td v-else class="px-3 py-4 text-sm text-gray-400 dark:text-gray-500">-</td>
                
                <td class="px-3 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {{ formatDate(task.create_time) }}
                </td>
                <td class="px-3 py-4 whitespace-nowrap text-sm">
                  <div class="flex space-x-3">
                    <button 
                      v-if="task.status === '已完成' || task.status === '失败'"
                      @click="viewAnalysisResult(task)" 
                      class="text-primary-600 hover:text-primary-800 font-medium"
                    >
                      查看结果
                    </button>
                    
                    <button
                      v-if="task.status === '进行中' || task.status === '刷新中...'"
                      @click="refreshTask(task)"
                      class="text-blue-600 hover:text-blue-800 font-medium"
                      :disabled="task.status === '刷新中...'"
                    >
                      刷新状态
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
    
    <!-- 新的分析结果弹窗组件 -->
    <Modal 
      v-if="visible" 
      :show="visible" 
      @update:show="(value: boolean) => visible = value"
    >
      <div class="analysis-modal-content">
        <div class="flex justify-between items-center mb-2 px-3 pt-2">
          <div class="text-base font-bold text-gray-800 dark:text-gray-200">分析结果</div>
          <div class="flex items-center gap-2">
            <span v-if="loading" class="text-xs text-gray-500 dark:text-gray-400">{{ loadingText }}</span>
            <Button 
              v-if="taskCompleted && taskResult?.status === 'success'" 
              size="xs"
              @click="handleRefresh" 
              :loading="refreshLoading"
            >
              <RefreshIcon class="w-3 h-3 mr-1" />
              刷新
            </Button>
            <CloseButton @click="visible = false" />
          </div>
        </div>
        <div class="result-content p-2 md:p-3 overflow-y-auto max-h-[calc(95vh-3rem)]">
          <div v-if="loading" class="p-3 flex flex-col items-center justify-center">
            <Spinner size="md" />
            <div class="mt-2 text-xs text-gray-600 dark:text-gray-400">{{ loadingText }}</div>
          </div>
          <div v-else-if="!taskResult?.status || taskResult?.status === 'fail'" class="p-3 flex flex-col items-center justify-center">
            <div class="text-red-500 mb-1">
              <WarningIcon class="w-8 h-8" />
            </div>
            <div class="text-xs text-gray-600 dark:text-gray-400 text-center">
              {{ taskResult?.message || '分析失败，请稍后重试' }}
            </div>
          </div>
          <div v-else-if="taskResult?.status === 'success'" class="analysis-result-container">
            <div v-if="fxContent" v-html="fxContent" class="analysis-result"></div>
            <div v-else class="p-3 text-xs text-gray-600 dark:text-gray-400">暂无分析结果，请稍后重试</div>
          </div>
        </div>
      </div>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { useMessage } from 'naive-ui';
import { useAuthStore } from '@/store';
import service from '@/utils/request/axios';
import Modal from '@/components/common/Modal.vue';
import Button from '@/components/common/Button.vue';
import CloseButton from '@/components/common/CloseButton.vue';
import Spinner from '@/components/common/Spinner.vue';
import RefreshIcon from '@/components/icons/RefreshIcon.vue';
import WarningIcon from '@/components/icons/WarningIcon.vue';

const message = useMessage();
const authStore = useAuthStore();

// 表单数据
const accountLink = ref('');
const analysisMode = ref('10');
const detectedPlatform = ref<'douyin' | 'xiaohongshu' | null>(null);

// 加载状态
const isLoading = ref(false);
const isLoadingTasks = ref(false);

// 分析任务
const analysisTasks = ref<any[]>([]);

// 自动刷新定时器
const autoRefreshTimer = ref<number | null>(null);

// 分析结果弹窗
const visible = ref(false);
const loading = ref(false);
const loadingText = ref('正在获取分析结果...');
const taskCompleted = ref(false);
const refreshLoading = ref(false);
const taskResult = ref<any>(null);
const fxContent = ref('');

// 格式化日期
const formatDate = (dateStr: string) => {
  if (!dateStr) return 'N/A';
  
  try {
    const date = new Date(dateStr);
    
    // 检查日期是否有效
    if (isNaN(date.getTime())) {
      console.warn('无效的日期字符串:', dateStr);
      return 'N/A';
    }
    
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.error('日期格式化错误:', error);
    return 'N/A';
  }
};

// 开始自动刷新定时器
const startAutoRefresh = () => {
  // 清除可能存在的旧定时器
  if (autoRefreshTimer.value) {
    clearInterval(autoRefreshTimer.value);
    autoRefreshTimer.value = null;
  }
  
  // 设置2分钟的刷新间隔
  autoRefreshTimer.value = window.setInterval(() => {
    // 检查是否有进行中的任务
    const hasPendingTasks = analysisTasks.value.some(task => 
      task.status === '进行中' || task.status === '刷新中...'
    );
    
    // 只有存在进行中的任务才刷新
    if (hasPendingTasks) {
      console.log('自动刷新任务列表 - 发现进行中的任务');
      fetchAnalysisTasks();
    } else {
      // 如果没有进行中的任务，停止自动刷新
      stopAutoRefresh();
    }
  }, 2 * 60 * 1000); // 2分钟
  
  console.log('启动自动刷新定时器，间隔: 2分钟');
};

// 停止自动刷新定时器
const stopAutoRefresh = () => {
  if (autoRefreshTimer.value) {
    clearInterval(autoRefreshTimer.value);
    autoRefreshTimer.value = null;
    console.log('停止自动刷新定时器');
  }
};

// 检测平台类型
const detectPlatform = () => {
  if (!accountLink.value) {
    detectedPlatform.value = null;
    return;
  }
  
  try {
    // 尝试解析URL或提取域名部分
    let link = accountLink.value.toLowerCase().trim();
    
    // 检查链接格式
    if (!link.startsWith('http://') && !link.startsWith('https://')) {
      // 尝试添加协议前缀
      link = 'https://' + link;
    }
    
    // 尝试构造URL对象来验证链接有效性
    try {
      new URL(link);
    } catch (e) {
      console.warn('无效的URL格式:', link);
      detectedPlatform.value = null;
      return;
    }
    
    if (link.includes('douyin.com') || 
        link.includes('iesdouyin.com') || 
        link.includes('snssdk.com') || 
        link.includes('toutiao.com')) {
      detectedPlatform.value = 'douyin';
    } else if (link.includes('xiaohongshu.com') || 
               link.includes('xhscdn.com') || 
               link.includes('xhs.')) {
      detectedPlatform.value = 'xiaohongshu';
    } else {
      detectedPlatform.value = null;
    }
  } catch (error) {
    console.error('检测平台类型出错:', error);
    detectedPlatform.value = null;
  }
};

// 监听链接变化自动检测平台
watch(accountLink, () => {
  detectPlatform();
});

// 分析账号（统一处理抖音和小红书）
const analyzeAccount = async () => {
  if (!accountLink.value) {
    message.error('请输入账号链接');
    return;
  }
  
  // 重新检测平台类型
  detectPlatform();
  
  // 检查链接格式
  try {
    let testLink = accountLink.value;
    if (!testLink.startsWith('http://') && !testLink.startsWith('https://')) {
      testLink = 'https://' + testLink;
    }
    new URL(testLink);
  } catch (e) {
    message.error('请输入有效的账号链接');
    return;
  }
  
  // 检查是否是用户主页链接（包含'user'关键字）
  if (!accountLink.value.toLowerCase().includes('user')) {
    message.warning('请使用用户主页链接');
    return;
  }
  
  // 如果无法检测到平台类型，提示用户
  if (!detectedPlatform.value) {
    message.warning('无法识别链接平台类型，请确保输入抖音或小红书的账号链接');
    // 仍然允许提交，后端会再次尝试识别
  }
  
  try {
    isLoading.value = true;
    
    // 构造请求数据，使用接口定义类型
    interface AnalysisRequest {
      link: string;
      mode: string;
      platform?: 'douyin' | 'xiaohongshu';
      type_name?: string;
    }
    
    const requestData: AnalysisRequest = {
      link: accountLink.value,
      mode: analysisMode.value
    };
    
    // 如果已经检测到平台，可以提供辅助信息
    if (detectedPlatform.value) {
      requestData.platform = detectedPlatform.value;
      requestData.type_name = detectedPlatform.value === 'douyin' ? '抖音' : '小红书';
    }
    
    const response = await service.post('account-analysis/create-task', requestData)
      .catch(error => {
        console.error('API请求失败:', error);
        
        // 处理常见错误情况
        if (error.response) {
          // 服务器返回了错误状态码
          const status = error.response.status;
          const errorMsg = error.response.data?.message || '未知错误';
          
          if (status === 401) {
            message.error('请先登录后再使用此功能');
          } else if (status === 403) {
            message.error('您没有权限执行此操作');
          } else if (status === 429) {
            message.error('请求过于频繁，请稍后再试');
          } else {
            message.error(`请求失败: ${errorMsg}`);
          }
        } else if (error.request) {
          // 请求已发出，但未收到响应
          message.error('服务器无响应，请检查网络连接');
        } else {
          // 请求配置出错
          message.error(`请求错误: ${error.message}`);
        }
        
        throw error; // 重新抛出错误，让外层catch捕获
    });
    
    if (response.data.success) {
      // 保存返回的任务信息
      const taskData = response.data.data;
      
      console.log('创建分析任务成功，返回数据:', taskData);
      
      message.success('创建账号分析任务成功');
      accountLink.value = '';
      fetchAnalysisTasks();
    } else {
      message.error(response.data.message || '创建账号分析任务失败');
    }
  } catch (error) {
    console.error('分析账号出错:', error);
    // 主要错误已经在内部catch中处理，这里只捕获漏网之鱼
  } finally {
    isLoading.value = false;
  }
};

// 获取分析任务列表
const fetchAnalysisTasks = async () => {
  try {
    isLoadingTasks.value = true;
    
    // 先清空现有数据，避免旧数据显示
    analysisTasks.value = [];
    
    // 使用配置好的service发送请求，移除/api前缀
    const response = await service.get('account-analysis/tasks')
      .catch(error => {
        console.error('获取任务列表API请求失败:', error);
        
        // 处理常见错误情况
        if (error.response) {
          const status = error.response.status;
          if (status === 401) {
            message.error('请先登录后再使用此功能');
          } else {
            message.error(`获取任务列表失败: ${error.response.data?.message || '未知错误'}`);
          }
        } else if (error.request) {
          message.error('服务器无响应，请检查网络连接');
        } else {
          message.error(`请求错误: ${error.message}`);
        }
        
        throw error;
      });
    
    console.log('获取任务列表响应:', response);
    
    // 检查响应结构
    if (response.data && response.data.success) {
      let taskData;
      
      // 处理可能的嵌套响应结构
      if (response.data.data && typeof response.data.data === 'object') {
        // 嵌套响应结构 (data.data)
        if (response.data.data.data && Array.isArray(response.data.data.data)) {
          taskData = response.data.data.data;
        } else if (Array.isArray(response.data.data)) {
          taskData = response.data.data;
        } else {
          taskData = [];
        }
      } else {
        taskData = [];
      }
      
      // 确保结果是数组
      analysisTasks.value = Array.isArray(taskData) ? taskData : [];
      
      // 添加日志以便调试
      console.log('处理后的分析任务列表:', {
        taskDataType: typeof taskData,
        isArray: Array.isArray(taskData),
        tasksLength: analysisTasks.value.length,
        tasks: analysisTasks.value
      });
      
      // 检查是否有进行中的任务，如果有则启动自动刷新
      const hasPendingTasks = analysisTasks.value.some(task => 
        task.status === '进行中' || task.status === '刷新中...'
      );
      
      if (hasPendingTasks) {
        startAutoRefresh();
      } else {
        stopAutoRefresh();
      }
    } else {
      console.warn('获取分析任务列表失败:', response.data);
      message.error(response.data?.message || '获取分析任务列表失败');
      analysisTasks.value = [];
      
      // 停止自动刷新
      stopAutoRefresh();
    }
  } catch (error) {
    console.error('获取分析任务列表出错:', error);
    // 主要错误已在内部catch中处理
    analysisTasks.value = [];
    
    // 停止自动刷新
    stopAutoRefresh();
  } finally {
    isLoadingTasks.value = false;
  }
};

// 查看分析结果
const viewAnalysisResult = async (task: any) => {
  if (task.status !== '已完成' && task.status !== '失败') {
    message.info('任务尚未完成，请稍后查看');
    return;
  }
  
  try {
    visible.value = true;
    loading.value = true;
    loadingText.value = '正在获取分析结果...';
    
    const response = await service.get(`account-analysis/result?task_id=${task.task_id}&id=${task.id}`)
      .catch(error => {
        console.error('获取分析结果API请求失败:', error);
        
        // 处理常见错误情况
        if (error.response) {
          const status = error.response.status;
          if (status === 401) {
            message.error('请先登录后再使用此功能');
          } else {
            message.error(`获取分析结果失败: ${error.response.data?.message || '未知错误'}`);
          }
        } else if (error.request) {
          message.error('服务器无响应，请检查网络连接');
        } else {
          message.error(`请求错误: ${error.message}`);
        }
        
        throw error;
      });
    
    if (response.data.success) {
      // 检查任务状态
      if (task.status === '失败') {
        // 对于失败的任务，显示友好提示
        taskResult.value = {
          status: 'fail',
          message: task.ip_content || '分析任务执行失败，请稍后重试'
        };
      } else {
        // 获取任务数据，处理可能的嵌套数据结构
        let taskData = response.data.data;
        
        // 检查是否存在嵌套数据结构
        if (taskData && taskData.data && typeof taskData.data === 'object') {
          console.log('检测到嵌套数据结构，使用内层数据');
          taskData = taskData.data;
        }
        
        console.log('处理后的任务数据:', taskData);
        taskResult.value = {
          status: 'success',
          data: taskData
        };
        
        // 优先处理HTML分析内容和账号信息
        if (taskData?.fx_content) {
          try {
            // 尝试解析JSON数据
            const fxContentData = JSON.parse(taskData.fx_content);
            
            // 构建HTML展示用户数据
            let htmlContent = '<div class="analysis-result">';
            
            // 添加用户基本信息
            if (fxContentData.user_data) {
              const userData = fxContentData.user_data;
              // 使用格式化函数处理数据展示
              const formattedFollowers = formatNumberWithUnit(userData.followers_count);
              const formattedFollowing = formatNumberWithUnit(userData.following_count);
              const formattedLikes = formatNumberWithUnit(userData.likes_count);
              
              // 处理头像URL
              const profileImageUrl = getProxiedImageUrl(userData.profile_picture, true);
              
              htmlContent += `
                <div class="account-info-container bg-gray-50 dark:bg-gray-900 rounded-lg overflow-hidden shadow-md mb-3">
                  <h2 class="text-base font-bold p-2 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">账号基本信息</h2>
                  
                  <div class="p-3">
                    <div class="flex mb-4">
                      <div class="mr-4 flex-shrink-0">
                        <img src="${profileImageUrl}" alt="${userData.nickname}" class="w-16 h-16 rounded-full border-2 border-gray-200 dark:border-gray-700 object-cover shadow-sm">
                      </div>
                      <div class="flex-grow flex flex-col justify-center overflow-hidden">
                        <h3 class="font-bold text-lg text-gray-900 dark:text-white truncate">${userData.nickname}</h3>
                        <p class="text-sm text-gray-600 dark:text-gray-400 truncate">${userData.location || '未知地区'}</p>
                      </div>
                    </div>

                    <div class="grid grid-cols-2 gap-3 mb-3">
                      <div class="border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 px-3 py-2.5">
                        <span class="text-gray-600 dark:text-gray-400">抖音号: </span>
                        <span class="text-gray-900 dark:text-white font-medium">${userData.douyin_account || '未知'}</span>
                      </div>
                      
                      <div class="border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 px-3 py-2.5">
                        <span class="text-gray-600 dark:text-gray-400">性别: </span>
                        <span class="text-gray-900 dark:text-white font-medium">${userData.age || '未知'}</span>
                      </div>
                      
                      <div class="border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 px-3 py-2.5">
                        <span class="text-gray-600 dark:text-gray-400">IP属地: </span>
                        <span class="text-gray-900 dark:text-white font-medium">${userData.ip_location || '未知'}</span>
                      </div>
                      
                      <div class="border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 px-3 py-2.5">
                        <span class="text-gray-600 dark:text-gray-400">作品数: </span>
                        <span class="text-gray-900 dark:text-white font-medium">${userData.works_count || '0'}</span>
                      </div>
                    </div>
                    
                    <div class="mb-3">
                      <div class="border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 p-2.5">
                        <span class="text-gray-600 dark:text-gray-400">简介: </span>
                        <span class="text-gray-900 dark:text-white break-words">${userData.signature || '无数据'}</span>
                      </div>
                    </div>
                    
                    <div class="grid grid-cols-3 gap-3">
                      <div class="p-3 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                        <div class="text-center">
                          <div class="text-base md:text-lg font-bold text-white text-shadow break-words leading-tight px-1">${formattedFollowers}</div>
                          <div class="text-xs md:text-sm font-medium text-white opacity-90 mt-1">粉丝</div>
                        </div>
                      </div>
                      <div class="p-3 bg-gradient-to-br from-purple-500 to-purple-700 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                        <div class="text-center">
                          <div class="text-base md:text-lg font-bold text-white text-shadow break-words leading-tight px-1">${formattedFollowing}</div>
                          <div class="text-xs md:text-sm font-medium text-white opacity-90 mt-1">关注</div>
                        </div>
                      </div>
                      <div class="p-3 bg-gradient-to-br from-red-500 to-red-700 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                        <div class="text-center">
                          <div class="text-base md:text-lg font-bold text-white text-shadow break-words leading-tight px-1">${formattedLikes}</div>
                          <div class="text-xs md:text-sm font-medium text-white opacity-90 mt-1">获赞</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              `;
            }
            
            // 添加视频数据
            if (fxContentData.videos && fxContentData.videos.length > 0) {
              htmlContent += `
                <div class="videos-container bg-gray-50 dark:bg-gray-900 rounded-lg overflow-hidden shadow-md mb-3">
                  <h2 class="text-base font-bold p-2 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">热门视频</h2>
                  <div class="video-grid grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 p-3">
              `;
              
              // 最多展示12个视频
              const videoLimit = Math.min(fxContentData.videos.length, 12);
              for (let i = 0; i < videoLimit; i++) {
                const video = fxContentData.videos[i];
                const videoLikes = formatNumberWithUnit(video.likes_count);
                // 处理视频缩略图URL
                const thumbnailUrl = getProxiedImageUrl(video.cover_image, false);
                
                htmlContent += `
                  <div class="video-card bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-300">
                    <div class="relative">
                      <img src="${thumbnailUrl}" alt="${video.video_title}" class="w-full h-28 object-cover">
                      <div class="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded-full">
                        ${videoLikes} 赞
                      </div>
                    </div>
                    <div class="p-2">
                      <div class="text-sm font-medium text-gray-900 dark:text-gray-100 overflow-hidden line-clamp-2 h-10" title="${video.video_title}">${video.video_title}</div>
                      <a href="${video.original_link}" target="_blank" class="text-xs text-primary-600 dark:text-primary-400 mt-1.5 inline-block hover:underline">查看原视频</a>
                    </div>
                  </div>
                `;
              }
              
              htmlContent += '</div></div>';
            }
            
            // 如果有ip_html_content，添加到账号信息后面
            if (taskData?.ip_html_content) {
              // 处理HTML内容中的小红书图片链接
              let processedHtml = taskData.ip_html_content;
              
              // 替换HTML中的img标签src属性，添加代理服务
              processedHtml = processedHtml.replace(
                /<img[^>]+src=["']([^"']+)["'][^>]*>/gi,
                (match: string, src: string) => {
                  if (src.includes('xhscdn.com')) {
                    const proxiedSrc = getProxiedImageUrl(src, false);
                    return match.replace(src, proxiedSrc);
                  }
                  return match;
                }
              );
              
              htmlContent += `
                <div class="analysis-container bg-gray-50 dark:bg-gray-900 rounded-lg overflow-hidden shadow-md mt-4">
                  <h2 class="text-base font-bold p-2 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">详细分析报告</h2>
                  <div class="p-0">
                    <iframe 
                      id="analysis-frame" 
                      style="width:100%; height:800px; border:none; border-radius:0 0 8px 8px; overflow:auto;" 
                      srcdoc="${processedHtml.replace(/"/g, '&quot;')}"
                      onload="this.style.height = Math.max(600, this.contentWindow.document.body.scrollHeight + 50) + 'px';"
                    ></iframe>
                  </div>
                </div>
              `;
            }
            
            // 关闭最外层div
            htmlContent += '</div>';
            
            fxContent.value = htmlContent;
          } catch (error) {
            console.error('解析fx_content失败:', error);
            
            // 如果解析JSON失败，但有HTML内容，仍然展示HTML报告
            if (taskData?.ip_html_content) {
              fxContent.value = `
                <div class="analysis-result">
                  <iframe 
                    id="analysis-frame" 
                    style="width:100%; height:800px; border:none; border-radius:8px; overflow:auto;" 
                    srcdoc="${taskData.ip_html_content.replace(/"/g, '&quot;')}"
                    onload="this.style.height = Math.max(600, this.contentWindow.document.body.scrollHeight + 50) + 'px';"
                  ></iframe>
                </div>
              `;
            } else {
              // 如果没有HTML内容，显示JSON
              fxContent.value = '<pre class="whitespace-pre-wrap text-sm bg-gray-50 dark:bg-gray-800 p-4 rounded text-gray-900 dark:text-white">' + taskData.fx_content + '</pre>';
            }
          }
        }
        // 如果只有HTML内容
        else if (taskData?.ip_html_content) {
          try {
            // 处理HTML内容中的小红书图片链接
            let processedHtml = taskData.ip_html_content;
            
            // 替换HTML中的img标签src属性，添加代理服务
            processedHtml = processedHtml.replace(
              /<img[^>]+src=["']([^"']+)["'][^>]*>/gi,
              (match: string, src: string) => {
                if (src.includes('xhscdn.com')) {
                  const proxiedSrc = getProxiedImageUrl(src, false);
                  return match.replace(src, proxiedSrc);
                }
                return match;
              }
            );
            
            fxContent.value = `
              <div class="analysis-result">
                <iframe 
                  id="analysis-frame" 
                  style="width:100%; height:800px; border:none; border-radius:8px; overflow:auto;" 
                  srcdoc="${processedHtml.replace(/"/g, '&quot;')}"
                  onload="this.style.height = Math.max(600, this.contentWindow.document.body.scrollHeight + 50) + 'px';"
                ></iframe>
              </div>
            `;
          } catch (error) {
            console.error('处理HTML内容失败:', error);
            // 直接使用div包装HTML内容作为备用方案
            fxContent.value = `<div class="analysis-result p-4 bg-white dark:bg-gray-800 rounded-lg shadow">${taskData.ip_html_content}</div>`;
          }
        } else {
          fxContent.value = '<div class="p-4 text-center text-gray-500">暂无分析数据</div>';
        }
      }
      
      taskCompleted.value = true;
    } else {
      taskResult.value = {
        status: 'fail',
        message: response.data.message || '获取分析结果失败'
      };
    }
  } catch (error) {
    console.error('获取分析结果出错:', error);
    taskResult.value = {
      status: 'fail',
      message: '获取分析结果出错，请稍后再试'
    };
  } finally {
    loading.value = false;
  }
};

// 刷新任务结果
const handleRefresh = async () => {
  if (!taskCompleted.value || !taskResult.value?.data?.id) {
    return;
  }
  
  try {
    refreshLoading.value = true;
    
    const task = taskResult.value.data;
    const response = await service.get(`account-analysis/result?task_id=${task.task_id}&id=${task.id}`);
    
    if (response.data.success) {
      // 重新加载结果
      viewAnalysisResult({
        id: task.id,
        task_id: task.task_id,
        status: '已完成'
      });
    } else {
      message.error(response.data.message || '刷新分析结果失败');
    }
  } catch (error) {
    console.error('刷新分析结果出错:', error);
    message.error('刷新分析结果出错，请稍后再试');
  } finally {
    refreshLoading.value = false;
  }
};

// 修改刷新任务的函数，添加本地状态更新
const refreshTask = async (task: any) => {
  if (task.status !== '进行中') {
    message.info('任务状态不是进行中，无法刷新');
    return;
  }
  
  try {
    // 先标记为"刷新中"状态，以便UI反馈
    const taskIndex = analysisTasks.value.findIndex(t => t.id === task.id);
    if (taskIndex !== -1) {
      // 备份原始状态，以防请求失败需要恢复
      const originalStatus = analysisTasks.value[taskIndex].status;
      // 更新UI状态
      analysisTasks.value[taskIndex].status = '刷新中...';
      
      try {
      const response = await service.post('account-analysis/refresh-task', {
        task_id: task.task_id,
        id: task.id
      });
      
      if (response?.data?.success) {
        message.success('任务刷新请求已发送');
        
        // 延迟3秒后自动刷新任务列表，以获取可能的最新状态
        setTimeout(() => {
          fetchAnalysisTasks();
        }, 3000);
      } else {
        // 恢复原始状态
        analysisTasks.value[taskIndex].status = originalStatus;
        message.error(response?.data?.message || '刷新任务失败');
      }
      } catch (apiError: any) {
        // 恢复原始状态
        analysisTasks.value[taskIndex].status = originalStatus;
        
        // 处理常见错误情况
        if (apiError.response) {
          const status = apiError.response.status;
          if (status === 401) {
            message.error('请先登录后再使用此功能');
    } else {
            message.error(`刷新失败: ${apiError.response.data?.message || '未知错误'}`);
          }
        } else if (apiError.request) {
          message.error('服务器无响应，请检查网络连接');
        } else {
          message.error(`请求错误: ${apiError.message}`);
        }
      }
    } else {
      // 如果找不到任务索引，直接发送请求
      try {
      const response = await service.post('account-analysis/refresh-task', {
        task_id: task.task_id,
        id: task.id
      });
      
      if (response?.data?.success) {
        message.success('任务刷新请求已发送');
        
        // 延迟3秒后自动刷新任务列表
        setTimeout(() => {
          fetchAnalysisTasks();
        }, 3000);
      } else {
        message.error(response?.data?.message || '刷新任务失败');
        }
      } catch (apiError: any) {
        // 处理常见错误情况
        if (apiError.response) {
          const status = apiError.response.status;
          if (status === 401) {
            message.error('请先登录后再使用此功能');
          } else {
            message.error(`刷新失败: ${apiError.response.data?.message || '未知错误'}`);
          }
        } else if (apiError.request) {
          message.error('服务器无响应，请检查网络连接');
        } else {
          message.error(`请求错误: ${apiError.message}`);
        }
      }
    }
  } catch (error) {
    console.error('刷新任务出错:', error);
    message.error('刷新任务出错，请稍后再试');
    
    // 恢复任何可能被更改的状态
    const taskIndex = analysisTasks.value.findIndex(t => t.id === task.id);
    if (taskIndex !== -1 && analysisTasks.value[taskIndex].status === '刷新中...') {
      analysisTasks.value[taskIndex].status = '进行中';
    }
  }
};

// 格式化数字的辅助函数
const formatNumberWithUnit = (num: number | string): string => {
  // 如果为空值，返回0
  if (!num) return '0';
  
  // 如果已经是带单位的字符串（如"1.5万"），直接返回
  if (typeof num === 'string' && (num.includes('万') || num.includes('亿'))) {
    return num;
  }
  
  // 其余情况按原逻辑处理
  try {
    // 如果是字符串，尝试转换为数字
    let numValue: number;
    if (typeof num === 'string') {
      // 移除除了数字和小数点以外的字符
      const cleanNum = num.replace(/[^\d.]/g, '');
      numValue = parseFloat(cleanNum);
    } else {
      numValue = num;
    }
    
    // 检查是否为有效数字
    if (isNaN(numValue) || numValue === 0) return '0';
    
    // 格式化为亿
    if (numValue >= 100000000) {
      const val = numValue / 100000000;
      // 如果值是整数，则不显示小数点
      if (val % 1 === 0) {
        return val.toString() + '亿';
      }
      // 否则保留一位小数，但如果小数是.0则移除
      return val.toFixed(1).replace(/\.0$/, '') + '亿';
    } 
    // 格式化为万
    else if (numValue >= 10000) {
      const val = numValue / 10000;
      // 如果值是整数，则不显示小数点
      if (val % 1 === 0) {
        return val.toString() + '万';
      }
      // 否则保留一位小数，但如果小数是.0则移除
      return val.toFixed(1).replace(/\.0$/, '') + '万';
    } 
    // 小于10000的数字直接返回
    else {
      return numValue.toString();
    }
  } catch (e) {
    console.error('格式化数字出错:', e, num);
    // 发生错误时，如果是字符串就返回原始值，否则返回0
    return typeof num === 'string' ? num : '0';
  }
};

// 图片URL处理函数 - 使用占位图片或代理服务解决403问题
const getProxiedImageUrl = (originalUrl: string, isAvatar: boolean = false) => {
  if (!originalUrl) {
    return isAvatar 
      ? 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiNmMWYxZjEiLz48Y2lyY2xlIGN4PSI1MCIgY3k9IjM1IiByPSIyMCIgZmlsbD0iI2NjYyIvPjxwYXRoIGQ9Ik0yNSw4MCBDMjUsNjAgNzUsNjAgNzUsODAiIGZpbGw9IiNjY2MiLz48L3N2Zz4='
      : 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMjAiIGhlaWdodD0iMTgwIiB2aWV3Qm94PSIwIDAgMzIwIDE4MCI+PHJlY3Qgd2lkdGg9IjMyMCIgaGVpZ2h0PSIxODAiIGZpbGw9IiNmMWYxZjEiLz48Y2lyY2xlIGN4PSIxNjAiIGN5PSI5MCIgcj0iMzAiIGZpbGw9IiNjY2MiLz48cGF0aCBkPSJNMTQ1LDkwIEwxODAsMTEwIEwxNDUsMTMwIFoiIGZpbGw9IiNhYWEiLz48L3N2Zz4=';
  }
  
  // 检查是否是小红书域名
  if (originalUrl.includes('xhscdn.com')) {
    try {
      // 使用可信任的图片代理服务
      const encodedUrl = encodeURIComponent(originalUrl);
      return `https://images.weserv.nl/?url=${encodedUrl}&default=${encodeURIComponent(
        isAvatar 
          ? 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiNmMWYxZjEiLz48Y2lyY2xlIGN4PSI1MCIgY3k9IjM1IiByPSIyMCIgZmlsbD0iI2NjYyIvPjxwYXRoIGQ9Ik0yNSw4MCBDMjUsNjAgNzUsNjAgNzUsODAiIGZpbGw9IiNjY2MiLz48L3N2Zz4='
          : 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMjAiIGhlaWdodD0iMTgwIiB2aWV3Qm94PSIwIDAgMzIwIDE4MCI+PHJlY3Qgd2lkdGg9IjMyMCIgaGVpZ2h0PSIxODAiIGZpbGw9IiNmMWYxZjEiLz48Y2lyY2xlIGN4PSIxNjAiIGN5PSI5MCIgcj0iMzAiIGZpbGw9IiNjY2MiLz48cGF0aCBkPSJNMTQ1LDkwIEwxODAsMTEwIEwxNDUsMTMwIFoiIGZpbGw9IiNhYWEiLz48L3N2Zz4='
      )}`;
    } catch (error) {
      console.error('处理图片URL失败:', error);
    }
  }
  
  // 非小红书域名返回原URL
  return originalUrl;
};

// 处理IP内容，增强显示效果
const processIpContent = (content: string): string => {
  if (!content) return '';
  
  let processed = content;
  
  // 转换分隔符和格式
  processed = processed
    // 替换水平分隔线
    .replace(/---+/g, '<hr class="my-3 border-gray-200 dark:border-gray-600">')
    
    // 增强数字编号项
    .replace(/(\d+)([、.])([^<\n]{2,})/g, '<div class="mb-2 mt-2 pl-2 py-1 border-l-4 border-blue-500 dark:border-blue-400 font-medium text-gray-900 dark:text-white">$1$2 $3</div>')
    
    // 增强中文序号项
    .replace(/([一二三四五六七八九十][、.])([^<\n]{2,})/g, '<div class="my-3 text-lg font-bold text-gray-900 dark:text-white">$1 $2</div>')
    
    // 增强引用和括号内容
    .replace(/(（[^）]+）|【[^】]+】|「[^」]+」|『[^』]+』)/g, '<span class="font-bold text-blue-600 dark:text-blue-400">$1</span>')
    
    // 处理加粗内容
    .replace(/(\*\*|__)(.*?)\1/g, '<span class="font-bold text-gray-900 dark:text-white">$2</span>')
    
    // 处理段落标题样式
    .replace(/(核心方向|内容特点|账号定位|目标受众|账号特色)/g, '<span class="inline-block bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded font-bold my-1">$1</span>')
    
    // 处理提示和特殊标记
    .replace(/(注意|提示|警告|重要|关键)[:：]/g, '<span class="inline-block bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-2 py-1 rounded font-bold my-1">$1:</span>')
    
    // 处理换行，确保段落分明
    .replace(/([^\n>])(\n)([^\n<])/g, '$1<br>$3')
    
    // 处理段落，改善可读性
    .replace(/<br><br>/g, '</p><p class="mt-3">');
  
  // 确保包含在段落标签中
  processed = '<p>' + processed + '</p>';
  
  return processed;
};

onMounted(() => {
  console.log('账号分析组件已挂载，开始获取任务列表');
  
  // 确保清空旧数据
  analysisTasks.value = [];
  
  // 获取任务列表
  fetchAnalysisTasks();
});

// 在组件卸载时清理资源
onUnmounted(() => {
  // 清理定时器
  stopAutoRefresh();
  console.log('账号分析组件已卸载，清理资源');
});
</script>

<style scoped>
.loading-spinner {
  border: 4px solid rgba(0, 0, 0, 0.1);
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border-left-color: #09f;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* 结果弹窗样式 */
.result-modal-overlay {
  @apply fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 backdrop-blur-sm;
}

.result-modal-container {
  @apply bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden border border-gray-100 dark:border-gray-700;
}

.result-modal-header {
  @apply flex justify-between items-center p-5 border-b-2 border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700;
}

.result-modal-title {
  @apply text-xl font-bold text-gray-900 dark:text-gray-100;
}

.result-modal-close {
  @apply text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 bg-white dark:bg-gray-600 rounded-full p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-500;
}

.result-modal-content {
  @apply p-4 md:p-5 overflow-y-auto max-h-[calc(90vh-10rem)];
}

.result-modal-footer {
  @apply flex justify-end p-5 border-t-2 border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700;
}

.result-modal-btn {
  @apply py-2.5 px-6 bg-primary-600 hover:bg-primary-700 dark:bg-primary-700 dark:hover:bg-primary-600 text-white font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors shadow-sm;
}

/* 暗色模式适应 */
:deep(.dark .bg-white) {
  @apply bg-gray-800;
}

:deep(.dark .text-gray-800) {
  @apply text-gray-200;
}

:deep(.dark .border-gray-200) {
  @apply border-gray-700;
}

/* 分析结果样式增强 */
:deep(.p-6 h2) {
  @apply text-lg font-bold my-3 text-gray-800 border-l-4 border-primary-500 pl-3;
}

:deep(.dark .p-6 h2) {
  @apply text-gray-100;
}

:deep(.p-6 ul) {
  @apply pl-6 mb-4 space-y-2;
}

:deep(.p-6 li) {
  @apply mb-2;
}

:deep(.p-6 strong) {
  @apply text-gray-800;
}

:deep(.dark .p-6 strong) {
  @apply text-gray-200;
}

:deep(.p-6 p) {
  @apply mb-3;
}

:deep(.p-6 [style*="color:red"]) {
  @apply text-red-600;
}

:deep(.dark .p-6 [style*="color:red"]) {
  @apply text-red-400;
}

:deep(.p-6 [style*="text-decoration: underline"]) {
  @apply underline text-primary-600;
}

:deep(.dark .p-6 [style*="text-decoration: underline"]) {
  @apply text-primary-400;
}

/* 表格响应式增强 */
@media (max-width: 768px) {
  .account-analysis-container .overflow-x-auto {
    margin-left: -1rem;
    margin-right: -1rem;
  }
}

/* fx_content 数据展示样式 */
:deep(.analysis-result) {
  color: #000;
}

:deep(.dark .analysis-result) {
  color: #fff;
}

:deep(.analysis-result h2) {
  font-size: 1.25rem;
  font-weight: 700;
  margin: 1rem 0 0.75rem;
  color: #000;
  border-left: 4px solid #3b82f6;
  padding-left: 0.75rem;
}

:deep(.dark .analysis-result h2) {
  color: #fff;
}

:deep(.analysis-result h3) {
  font-size: 1.125rem;
  font-weight: 700;
  color: #000;
  margin-bottom: 0.5rem;
}

:deep(.dark .analysis-result h3) {
  color: #fff;
}

:deep(.analysis-result .user-info) {
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  padding: 1rem;
  background-color: white;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

:deep(.dark .analysis-result .user-info) {
  background-color: #1f2937;
  border-color: #374151;
}

:deep(.user-info > div:first-child) {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

@media (min-width: 768px) {
  :deep(.user-info > div:first-child) {
    flex-direction: row;
    text-align: left;
  }
}

:deep(.analysis-result .stat div:first-child) {
  font-size: 1.25rem;
  font-weight: 700;
  color: #2563eb;
}

:deep(.dark .analysis-result .stat div:first-child) {
  color: #60a5fa;
}

:deep(.analysis-result .stat div:last-child) {
  font-size: 0.875rem;
  color: #374151;
  font-weight: 500;
}

:deep(.dark .analysis-result .stat div:last-child) {
  color: #d1d5db;
}

:deep(.analysis-result .user-details) {
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  padding: 1rem;
  background-color: white;
  margin-top: 0.75rem;
}

:deep(.dark .analysis-result .user-details) {
  background-color: #1f2937;
  border-color: #374151;
}

:deep(.analysis-result .user-details li) {
  padding: 0.5rem;
  border-radius: 0.375rem;
  background-color: #f9fafb;
  display: flex;
  align-items: center;
  font-size: 0.875rem;
  color: #111827;
  margin-bottom: 0.375rem;
}

:deep(.dark .analysis-result .user-details li) {
  background-color: #374151;
  color: #f3f4f6;
}

:deep(.analysis-result .user-details li span:first-child) {
  color: #4b5563;
  font-weight: 500;
  margin-right: 0.5rem;
  min-width: 4rem;
  display: inline-block;
}

:deep(.dark .analysis-result .user-details li span:first-child) {
  color: #d1d5db;
}

:deep(.analysis-result .video-card h4) {
  font-size: 0.875rem;
  font-weight: 600;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  height: 2.25rem;
  margin-bottom: 0.5rem;
  color: #111827;
}

:deep(.dark .analysis-result .video-card h4) {
  color: #f3f4f6;
}

:deep(.analysis-result .video-card a) {
  font-size: 0.75rem;
  font-weight: 600;
  color: #2563eb;
  display: inline-flex;
  align-items: center;
  margin-top: 0.25rem;
}

:deep(.analysis-result .video-card .like-count) {
  position: absolute; 
  bottom: 0.5rem; 
  right: 0.5rem; 
  background-color: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

:deep(.ip-content-section) {
  margin-top: 1rem;
  padding: 1rem;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  background-color: white;
  font-size: 0.875rem;
  line-height: 1.5;
  color: #111827;
}

:deep(.dark .ip-content-section) {
  background-color: #1f2937;
  border-color: #374151;
  color: #f3f4f6;
}

:deep(.ip-content-section h2) {
  font-size: 1.25rem;
  font-weight: 700;
  margin: 1rem 0 0.75rem;
  color: #000;
  border-left: 4px solid #3b82f6;
  padding-left: 0.75rem;
}

:deep(.dark .ip-content-section h2) {
  color: #fff;
}

:deep(.ip-content-section ul) {
  padding-left: 1.25rem;
  margin-bottom: 1rem;
  row-gap: 0.5rem;
  list-style-type: disc;
}

:deep(.ip-content-section li) {
  margin-bottom: 0.5rem;
  line-height: 1.5;
}

/* 结果弹窗样式 */
.result-modal-content {
  color: #111827;
  font-size: 1rem;
  line-height: 1.6;
}

.dark .result-modal-content {
  color: #f3f4f6;
}

:deep(.analysis-result img) {
  max-width: 100%;
  height: auto;
  border-radius: 0.375rem;
  object-fit: cover;
}

:deep(.analysis-result .video-grid) {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
  margin-top: 1rem;
}

@media (min-width: 768px) {
  :deep(.analysis-result .video-grid) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (min-width: 1024px) {
  :deep(.analysis-result .video-grid) {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

:deep(.analysis-result .video-card) {
  background-color: white;
  border-radius: 0.5rem;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;
  transform: translateY(0);
}

:deep(.dark .analysis-result .video-card) {
  background-color: #1f2937;
  border-color: #374151;
}

:deep(.analysis-result .video-card:hover) {
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  transform: translateY(-0.25rem);
}

:deep(.analysis-result .video-card .relative) {
  position: relative;
  overflow: hidden;
}

:deep(.analysis-result .video-card img) {
  width: 100%;
  height: 10rem;
  object-fit: cover;
  transition: transform 0.2s ease;
}

:deep(.analysis-result .video-card:hover img) {
  transform: scale(1.05);
}

:deep(.analysis-result .video-card .content-area) {
  padding: 0.75rem;
}

:deep(.analysis-result .video-card a::after) {
  content: "→";
  margin-left: 0.25rem;
}

:deep(.analysis-result .video-card a:hover) {
  color: #1d4ed8;
  text-decoration: underline;
}

:deep(.dark .analysis-result .video-card a) {
  color: #60a5fa;
}

:deep(.dark .analysis-result .video-card a:hover) {
  color: #93c5fd;
}

/* 分析结果样式 */
.analysis-modal-content {
  width: 100%;
  height: 100%;
}

.result-content :deep(h2) {
  @apply text-base font-bold border-l-0 pl-0 my-0;
}

.result-content :deep(h3) {
  @apply text-sm font-bold;
}

.result-content :deep(.user-info) {
  @apply bg-white dark:bg-gray-800 rounded border border-gray-100 dark:border-gray-700 shadow-sm;
}

.result-content :deep(.user-details) {
  @apply bg-white dark:bg-gray-800 rounded border border-gray-100 dark:border-gray-700 shadow-sm;
}

.result-content :deep(.ip-content-section) {
  @apply bg-white dark:bg-gray-800 rounded border border-gray-100 dark:border-gray-700 shadow-sm;
}

.result-content :deep(.ip-content-section ul) {
  @apply list-disc pl-4 mt-1 mb-2 space-y-1;
}

.result-content :deep(.ip-content-section p) {
  margin-bottom: 0.75rem;
}

/* 暗色模式适配 */
.result-content :deep(.dark .bg-white) {
  @apply bg-gray-800;
}

.result-content :deep(.dark .text-gray-800) {
  @apply text-gray-200;
}

.result-content :deep(.dark .border-gray-100) {
  @apply border-gray-700;
}

/* 粉丝数据样式 */
.result-content :deep(.fan-stats-container) {
  @apply w-full;
}

.result-content :deep(.fan-stats) {
  @apply shadow-md transform transition-all duration-300;
}

.result-content :deep(.fan-stat) {
  @apply shadow-sm hover:shadow-md transform transition-transform duration-300 hover:-translate-y-1 cursor-pointer;
}

/* 容器样式 */
.result-content :deep(.account-info-container),
.result-content :deep(.videos-container),
.result-content :deep(.analysis-container) {
  @apply transition-all duration-300 hover:shadow-lg;
}

/* 其他样式 */
.result-content :deep(.ip-content-section ul) {
  @apply list-disc pl-4 mt-1 mb-2 space-y-1;
}

.result-content :deep(.ip-content-section p) {
  margin-bottom: 0.75rem;
}

/* 暗色模式适配 */
.result-content :deep(.dark .bg-white) {
  @apply bg-gray-800;
}

.result-content :deep(.dark .bg-gray-50) {
  @apply bg-gray-900;
}

.result-content :deep(.dark .bg-gray-100) {
  @apply bg-gray-800;
}

.result-content :deep(.dark .text-gray-800) {
  @apply text-gray-200;
}

.result-content :deep(.dark .border-gray-100) {
  @apply border-gray-700;
}

.result-content :deep(.dark .border-gray-200) {
  @apply border-gray-700;
}

:deep(.ip-content-section p) {
  margin-bottom: 0.75rem;
  line-height: 1.6;
}

:deep(.ip-content-section strong) {
  color: #4b5563;
  font-weight: 600;
}

:deep(.dark .ip-content-section strong) {
  color: #e5e7eb;
}

:deep(.ip-content-section ul, .ip-content-section ol) {
  margin-left: 1.5rem;
  margin-bottom: 1rem;
}

:deep(.ip-content-section li) {
  margin-bottom: 0.5rem;
}

:deep(.ip-content-section h3, .ip-content-section h4) {
  font-weight: 600;
  margin-top: 1rem;
  margin-bottom: 0.5rem;
  color: #374151;
}

:deep(.dark .ip-content-section h3, .dark .ip-content-section h4) {
  color: #d1d5db;
}

/* 优化暗色模式下文本颜色 */
:deep(.dark .ip-content-section span.font-bold) {
  color: #f3f4f6 !important;
  font-weight: 700;
}

:deep(.dark .ip-content-section strong) {
  color: #e5e7eb !important;
}

:deep(.dark .ip-content-section h3, 
      .dark .ip-content-section h4, 
      .dark .ip-content-section h5) {
  color: #f3f4f6 !important;
}

:deep(.dark .analysis-result h2,
      .dark .analysis-result h3,
      .dark .analysis-result h4) {
  color: #f3f4f6 !important;
}

/* IP内容部分的暗色模式适配 */
:deep(.dark .ip-content-section) {
  color: #f9fafb !important;
}

:deep(.dark .ip-content-section > *) {
  color: #f9fafb !important;
}

:deep(.dark .ip-content-section > div) {
  color: #f9fafb !important;
}

:deep(.dark .ip-content-section > p) {
  color: #f9fafb !important;
}

/* 修复视频标题 */
:deep(.dark .result-content .text-gray-900) {
  color: #f9fafb !important;
}

/* 强制覆盖所有分析内容的文字颜色 */
:deep(.dark .analysis-result-container *:not(a):not(button)) {
  color: #f9fafb !important;
}

:deep(.dark .account-info-container *) {
  color: #f9fafb !important;
}

:deep(.dark .account-info-container .text-gray-600) {
  color: #d1d5db !important;
}

:deep(.dark .account-info-container .text-gray-400) {
  color: #9ca3af !important;
}

:deep(.dark .account-info-container h3) {
  color: #fff !important;
}

:deep(.dark .videos-container .video-card .text-sm) {
  color: #f9fafb !important;
}
</style> 