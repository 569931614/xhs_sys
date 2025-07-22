<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, watch } from 'vue';
import { getUserTasksAPI, getTaskResultAPI, batchGetTaskResultsAPI } from '@/api/xhsProductFactory';
import TaskItem from './TaskItem.vue';
import TaskBatchGroup from './TaskBatchGroup.vue';
import { Task, TaskGroup, Activity } from '../types';
import { getGroupedTasks, getBatchTitle } from '../utils';

// 定义组件 props
const props = defineProps<{
  tasks: Task[];
  activities: Activity[];
  loadingTasks: boolean;
  autoRefreshEnabled?: boolean;
}>();

// 定义组件 emit
const emit = defineEmits<{
  (e: 'refresh', taskId: string): void;
  (e: 'refreshAll'): void;
  (e: 'viewQrCode', task: Task): void;
  (e: 'viewNoteDetail', task: Task): void;
  (e: 'viewActivity', activityId: string): void;
  (e: 'viewActivityQrCode', activityId: string, event?: Event): void;
  (e: 'error', message: string): void;
  (e: 'editNote', task: Task): void;
  (e: 'retryTask', task: Task): void;
}>();

// 使用计算属性对任务进行分组
const groupedTasks = computed(() => {
  return getGroupedTasks(props.tasks);
});

// 任务列表
const tasks = ref<Task[]>([]);
const loading = ref(false);
const autoRefreshInterval = ref<number | NodeJS.Timeout | null>(null);
const pendingTasks = ref<string[]>([]);

// 将任务按品牌产品分组
const taskGroups = computed(() => {
  const groups: { [key: string]: TaskGroup } = {};
  
  // 先按照批次ID分组
  const batchGroups: { [key: string]: Task[] } = {};
  
  for (const task of tasks.value) {
    // 如果任务有批次ID，按批次分组
    if (task.batchId) {
      if (!batchGroups[task.batchId]) {
        batchGroups[task.batchId] = [];
      }
      batchGroups[task.batchId].push(task);
    } else {
      // 否则每个任务单独作为一个组，使用任务ID作为key
      const key = `task_${task.id}`;
      groups[key] = {
        brandProduct: task.brandProduct,
        createTime: task.createTime,
        tasks: [task]
      };
    }
  }
  
  // 处理批次分组，将它们添加到正常分组中
  for (const batchId in batchGroups) {
    if (batchGroups[batchId].length > 0) {
      const batchTasks = batchGroups[batchId];
      const firstTask = batchTasks[0];
      const key = `batch_${batchId}`;
      
      groups[key] = {
        brandProduct: firstTask.brandProduct,
        createTime: firstTask.createTime,
        tasks: batchTasks.sort((a, b) => {
          // 按批次索引排序
          return (a.batchIndex || 0) - (b.batchIndex || 0);
        })
      };
    }
  }
  
  // 转换为数组并按时间排序
  return Object.values(groups).sort((a, b) => {
    return new Date(b.createTime).getTime() - new Date(a.createTime).getTime();
  });
});

// 获取活动名称
function getActivityName(activityId: string): string {
  if (!activityId || !props.activities || props.activities.length === 0) return '';
  
  const activity = props.activities.find(a => a.id === activityId);
  return activity ? activity.name : '';
}

// 格式化任务日期
function formatTaskDate(dateString: string): string {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    
    // 格式化为 YYYY-MM-DD HH:MM
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  } catch (e) {
    return dateString;
  }
}

// 获取任务列表
async function fetchTasks() {
  try {
    loading.value = true;
    console.log('开始获取任务列表...');
    const fetchedTasks = await getUserTasksAPI();
    console.log(`获取到 ${fetchedTasks.length} 个任务`, fetchedTasks);
    
    // 去重处理：根据任务ID进行去重
    const uniqueTasks = new Map();
    for (const task of fetchedTasks) {
      // 如果相同ID的任务已经存在，则只保留最新的一个（通常按时间排序后最新的会在前面）
      if (!uniqueTasks.has(task.id)) {
        uniqueTasks.set(task.id, task);
      }
    }
    
    // 将去重后的任务转换为数组
    tasks.value = Array.from(uniqueTasks.values());
    console.log(`去重后剩余 ${tasks.value.length} 个任务`);
    
    // 检查是否有待处理的任务
    checkPendingTasks();
  } catch (error: any) {
    console.error('获取任务列表失败:', error);
    emit('error', error.message || '获取任务列表失败');
  } finally {
    loading.value = false;
  }
}

// 检查是否有待处理的任务
function checkPendingTasks() {
  pendingTasks.value = tasks.value
    .filter(task => task.status === 'pending' || task.status === 'running')
    .map(task => task.id);
  
  console.log(`检测到 ${pendingTasks.value.length} 个待处理任务`);
  
  // 如果有待处理任务，并且启用了自动刷新，则启动定时器
  if (pendingTasks.value.length > 0 && props.autoRefreshEnabled) {
    startAutoRefresh();
  } else if (pendingTasks.value.length === 0) {
    stopAutoRefresh();
  }
}

// 开始自动刷新
function startAutoRefresh() {
  // 如果已经有定时器，先停止
  stopAutoRefresh();
  
  console.log('启动自动刷新定时器, 间隔5秒');
  autoRefreshInterval.value = setInterval(async () => {
    // 如果没有待处理任务，停止定时器
    if (pendingTasks.value.length === 0) {
      stopAutoRefresh();
      return;
    }
    
    console.log(`自动刷新: 更新 ${pendingTasks.value.length} 个任务状态`);
    
    try {
      // 批量获取任务结果
      const response = await batchGetTaskResultsAPI(pendingTasks.value);
      console.log('获取到任务结果:', response);
      
      // 更新任务状态
      let hasUpdates = false;
      let resultsArray: any[] = [];
      
      // 处理不同的响应格式，确保获取正确的results数组
      if (response && response.results && Array.isArray(response.results)) {
        // 直接包含results字段的格式
        resultsArray = response.results;
      } else if (response && response.data && response.data.results && Array.isArray(response.data.results)) {
        // 嵌套格式: data.results
        resultsArray = response.data.results;
      } else if (Array.isArray(response)) {
        // 直接是数组的格式
        resultsArray = response;
      } else if (response && response.data && Array.isArray(response.data)) {
        // data字段是数组的格式
        resultsArray = response.data;
      }
      
      console.log(`处理 ${resultsArray.length} 个任务状态更新`);
      
      // 遍历结果数组，更新任务状态
      for (const result of resultsArray) {
        if (!result || !result.id) {
          console.warn('收到无效的任务结果项:', result);
          continue;
        }
        
        const taskIndex = tasks.value.findIndex(task => task.id === result.id);
        if (taskIndex !== -1) {
          console.log(`找到任务 ${result.id}，当前状态: ${tasks.value[taskIndex].status}, 新状态: ${result.status}`);
          
          const oldStatus = tasks.value[taskIndex].status;
          
          // 创建更新后的任务对象
          const updatedTask = { 
            ...tasks.value[taskIndex],
          };
          
          // 更新状态字段
          if (result.status && ['pending', 'running', 'completed', 'failed'].includes(result.status)) {
            updatedTask.status = result.status;
          }
          
          // 更新笔记ID
          if (result.noteId) {
            updatedTask.noteId = result.noteId;
          } else if (result.data && typeof result.data === 'string' && result.data.includes('id=')) {
            // 从URL中提取noteId
            try {
              const noteId = result.data.split('id=')[1]?.split('&')[0];
              if (noteId) {
                updatedTask.noteId = noteId;
              }
            } catch (e) {
              console.warn('从URL提取noteId失败:', e);
            }
          }
          
          // 更新结果字段
          if (result.data) {
            updatedTask.result = { qrCode: result.data };
          }
          
          // 更新错误信息
          if (result.status === 'failed' && result.message) {
            updatedTask.error = result.message;
          }
          
          // 应用更新
          tasks.value[taskIndex] = updatedTask;
          
          // 检查状态是否已更新
          if (oldStatus !== updatedTask.status) {
            console.log(`任务 ${result.id} 状态已更新: ${oldStatus} -> ${updatedTask.status}`);
            hasUpdates = true;
          }
        } else {
          console.warn(`找不到匹配的任务: ${result.id}`);
        }
      }
      
      // 如果有更新，重新检查待处理任务
      if (hasUpdates) {
        console.log('检测到任务状态变更，重新检查待处理任务');
        checkPendingTasks();
      } else {
        console.log('没有检测到任务状态变更');
      }
    } catch (error) {
      console.error('自动刷新任务状态失败:', error);
      
      // 如果自动更新失败，尝试完整刷新任务列表
      try {
        console.log('尝试完整刷新任务列表');
        await fetchTasks();
      } catch (e) {
        console.error('完整刷新任务列表失败:', e);
      }
    }
  }, 5000); // 每5秒刷新一次
}

// 停止自动刷新
function stopAutoRefresh() {
  if (autoRefreshInterval.value) {
    console.log('停止自动刷新定时器');
    clearInterval(autoRefreshInterval.value as number);
    autoRefreshInterval.value = null;
  }
}

// 手动刷新任务列表
function refreshTasks() {
  fetchTasks();
}

// 刷新任务列表
function refreshTaskList() {
  emit('refreshAll');
}

// 刷新单个任务
function onRefresh(taskId: string) {
  emit('refresh', taskId);
}

// 查看二维码
function viewQrCode(task: Task) {
  console.log('查看二维码, 任务:', task);
  emit('viewQrCode', task);
}

// 查看笔记详情
function onViewNoteDetail(task: Task) {
  emit('viewNoteDetail', task);
}

// 编辑笔记
function onEditNote(task: Task) {
  console.log('编辑笔记, 任务:', task);
  emit('editNote', task);
}

// 查看活动
function onViewActivity(activityId: string) {
  emit('viewActivity', activityId);
}

// 查看活动二维码
function viewActivityQrCode(activityId: string, event?: Event) {
  console.log('查看活动二维码, 活动ID:', activityId);
  emit('viewActivityQrCode', activityId, event);
}

// 处理查看笔记详情
function handleViewNoteDetail(task: Task) {
  emit('viewNoteDetail', task);
}

// 处理查看活动
function handleViewActivity(activityId: string) {
  emit('viewActivity', activityId);
}

// 处理重试任务
function onRetryTask(task: Task) {
  console.log('TaskList - 重试任务:', task);
  emit('retryTask', task);
}

// 格式化错误消息
function formatErrorMessage(error: string): string {
  if (!error) return '处理失败';
  
  // 简化错误消息
  if (error.length > 50) {
    return error.substring(0, 50) + '...';
  }
  
  return error;
}

// 格式化日期
function formatDate(dateString: string): string {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    
    // 格式化为 YYYY-MM-DD HH:MM
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  } catch (e) {
    return dateString;
  }
}

// 任务状态颜色类
function statusClass(status: string): string {
  switch (status) {
    case 'pending':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
    case 'running':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
    case 'completed':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
    case 'failed':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  }
}

// 任务状态文本
function statusText(status: string): string {
  switch (status) {
    case 'pending':
      return '等待中';
    case 'running':
      return '处理中';
    case 'completed':
      return '已完成';
    case 'failed':
      return '失败';
    default:
      return status;
  }
}

// 生命周期钩子
onMounted(() => {
  fetchTasks();
});

onUnmounted(() => {
  stopAutoRefresh();
});

// 监听props变化
watch(() => props.autoRefreshEnabled, (newValue) => {
  if (newValue && pendingTasks.value.length > 0) {
    startAutoRefresh();
  } else {
    stopAutoRefresh();
  }
});

// 暴露给父组件的方法
defineExpose({
  refreshTasks,
  tasks
});
</script>

<template>
  <div class="task-list mt-8">
    <!-- 任务列表标题 -->
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-xl font-bold text-gray-800 dark:text-gray-200 flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-2 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        生成任务列表
      </h2>
      <button 
        @click="refreshTasks" 
        class="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-200 flex items-center text-sm"
        :disabled="loading"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        刷新
      </button>
    </div>
    
    <!-- 加载状态 -->
    <div v-if="loading" class="flex justify-center items-center py-8">
      <div class="flex flex-col items-center">
        <div class="h-10 w-10 border-4 border-t-pink-500 rounded-full animate-spin mb-4"></div>
        <p class="text-gray-600 dark:text-gray-400">加载任务中...</p>
      </div>
    </div>
    
    <!-- 空状态 -->
    <div v-else-if="tasks.length === 0" class="bg-white dark:bg-gray-800 rounded-lg p-6 text-center shadow-sm border border-gray-200 dark:border-gray-700">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      <p class="text-gray-600 dark:text-gray-400 mb-4">暂无生成任务</p>
      <p class="text-gray-500 dark:text-gray-500 text-sm">填写表单并点击"生成笔记"按钮开始创建笔记</p>
    </div>
    
    <!-- 任务列表内容 -->
    <div v-else class="space-y-4">
      <!-- 分组显示任务 -->
      <div v-for="(group, groupIndex) in taskGroups" :key="`group-${groupIndex}`" class="task-group bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-sm border border-gray-200 dark:border-gray-700">
        <!-- 批次任务组 -->
        <template v-if="group.tasks.length > 1 && group.tasks[0].batchId">
        <TaskBatchGroup
            :batchId="group.tasks[0].batchId"
          :tasks="group.tasks"
            :activities="activities"
          @refresh="onRefresh"
            @viewQrCode="viewQrCode"
            @viewNoteDetail="onViewNoteDetail"
            @viewActivity="onViewActivity"
            @viewActivityQrCode="viewActivityQrCode"
            @editNote="onEditNote"
            @retryTask="onRetryTask"
          />
        </template>
        
        <!-- 单个任务 -->
        <template v-else-if="group.tasks.length === 1">
            <TaskItem
            :task="group.tasks[0]"
            :activities="activities"
              @refresh="onRefresh"
              @view-qr-code="viewQrCode"
              @view-note-detail="onViewNoteDetail"
              @view-activity="onViewActivity"
              @view-activity-qr-code="viewActivityQrCode"
            @edit-note="onEditNote"
            @retry-task="onRetryTask"
            />
        </template>
      </div>
    </div>
  </div>
</template> 