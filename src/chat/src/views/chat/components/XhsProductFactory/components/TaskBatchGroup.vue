<script setup lang="ts">
import { ref } from 'vue';
import TaskItem from './TaskItem.vue';
import { Task, Activity, BatchStatus } from '../types';
import { getBatchCompletionStatus, getBatchStatus, getBatchTitle, isBatchCollapsed } from '../utils';
import { ScanCode } from '@icon-park/vue-next';

// 定义组件 props
const props = defineProps<{
  batchId: string;
  tasks: Task[];
  activities: Activity[];
}>();

// 定义组件 emit
const emit = defineEmits<{
  (e: 'refresh', taskId: string): void;
  (e: 'viewQrCode', task: Task): void;
  (e: 'viewNoteDetail', task: Task): void;
  (e: 'viewActivity', activityId: string): void;
  (e: 'viewActivityQrCode', activityId: string, event?: Event): void;
  (e: 'editNote', task: Task): void;
  (e: 'retryTask', task: Task): void;
}>();

// 批次折叠状态
const batchCollapsedState = ref<Record<string, boolean>>({});

// 切换批次折叠状态
function toggleBatchCollapse() {
  if (!batchCollapsedState.value[props.batchId]) {
    batchCollapsedState.value[props.batchId] = true;
  } else {
    batchCollapsedState.value[props.batchId] = !batchCollapsedState.value[props.batchId];
  }
}

// 判断批次是否折叠
function isCollapsed(): boolean {
  return isBatchCollapsed(batchCollapsedState.value, props.batchId);
}

// 获取批次状态
function getBatchStatusValue(): BatchStatus {
  return getBatchStatus(props.tasks, props.batchId);
}

// 获取批次状态类名
function getBatchStatusClass(): string {
  const status = getBatchStatusValue();
  switch (status) {
    case 'pending': return 'bg-yellow-400 dark:bg-yellow-600';
    case 'running': return 'bg-blue-500 dark:bg-blue-600';
    case 'completed': return 'bg-green-500 dark:bg-green-600';
    case 'failed': return 'bg-red-500 dark:bg-red-600';
    case 'mixed': return 'bg-purple-500 dark:bg-purple-600';
    default: return 'bg-gray-500 dark:bg-gray-600';
  }
}

// 获取批次状态文本
function getBatchStatusText(): string {
  const status = getBatchStatusValue();
  switch (status) {
    case 'pending': return '等待处理';
    case 'running': return '处理中';
    case 'completed': return '已完成';
    case 'failed': return '失败';
    case 'mixed': return '部分完成';
    default: return '未知';
  }
}

// 传递事件到父组件
function onRefresh(taskId: string) {
  emit('refresh', taskId);
}

// 查看二维码
function viewQrCode(task: Task) {
  console.log('批次组内 - 查看二维码:', task);
  emit('viewQrCode', task);
}

function onViewNoteDetail(task: Task) {
  emit('viewNoteDetail', task);
}

// 编辑笔记
function onEditNote(task: Task) {
  console.log('批次组内 - 编辑笔记:', task);
  if (task.noteId) {
    emit('editNote', { ...task, id: task.noteId });
  } else {
    console.error('无法编辑笔记：缺少noteId');
  }
}

function onViewActivity(activityId: string) {
  emit('viewActivity', activityId);
}

// 查看活动二维码
function viewActivityQrCode(activityId: string, event?: Event) {
  console.log('批次组内 - 查看活动二维码:', activityId);
  if (event) {
    event.stopPropagation();
  }
  emit('viewActivityQrCode', activityId, event);
}

// 获取活动名称
function getActivityName(activityId: string): string {
  if (!activityId || !props.activities || props.activities.length === 0) return '';

  const activity = props.activities.find(a => a.id === activityId);
  return activity ? activity.name : '';
}

// 重试任务
function onRetryTask(task: Task) {
  console.log('批次组内 - 重试任务:', task);
  emit('retryTask', task);
}
</script>

<template>
  <div class="batch-group border border-purple-200 dark:border-purple-800 rounded-lg overflow-hidden mb-4">
    <!-- 批次标题行 -->
    <div @click="toggleBatchCollapse" 
      class="batch-header flex flex-col sm:flex-row sm:justify-between sm:items-center p-4 bg-purple-50 dark:bg-purple-900/30 cursor-pointer hover:bg-purple-100 dark:hover:bg-purple-800/40 transition-colors">
      <div class="flex items-center mb-2 sm:mb-0">
        <svg xmlns="http://www.w3.org/2000/svg" 
             :class="{'transform rotate-90': !isCollapsed()}"
             class="h-5 w-5 mr-2 text-purple-600 dark:text-purple-400 transition-transform duration-200" 
             viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
        </svg>
        <div>
          <h3 class="font-bold text-purple-800 dark:text-purple-200">
            {{ tasks[0].brandProduct }}
          </h3>
          <div class="flex items-center">
            <p v-if="tasks[0].activityId && getActivityName(tasks[0].activityId)" class="text-sm text-gray-600 dark:text-gray-400 truncate max-w-xs sm:max-w-md">
              活动名称: {{ getActivityName(tasks[0].activityId) }}
            </p>
          </div>
        </div>
      </div>
      
      <!-- 批次状态指示器 -->
      <div class="flex flex-wrap gap-2 items-center">
        <!-- 批次进度 -->
        <div class="mr-2">
          <div class="flex items-center text-xs">
            <span class="text-green-600 dark:text-green-400 font-medium mr-1">{{ getBatchCompletionStatus(tasks).completed }}</span>
            <span class="text-gray-500 dark:text-gray-400">/</span>
            <span class="text-gray-600 dark:text-gray-400 ml-1">{{ getBatchCompletionStatus(tasks).total }}</span>
            <span class="ml-1 text-gray-500 dark:text-gray-400">完成</span>
          </div>
          
          <!-- 进度条 -->
          <div class="w-20 sm:w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-1">
            <div class="bg-green-500 h-1.5 rounded-full" 
                 :style="{width: `${(getBatchCompletionStatus(tasks).completed / getBatchCompletionStatus(tasks).total) * 100}%`}">
            </div>
          </div>
        </div>
        
        <!-- 批次状态标签 -->
        <span
          :class="[getBatchStatusClass(), 'text-white text-xs px-2 py-1 rounded-full']"
        >
          {{ getBatchStatusText() }}
        </span>
        
        <!-- 活动操作按钮 -->
        <button
          v-if="tasks[0].activityId"
          @click.stop="onViewActivity(tasks[0].activityId)"
          class="text-sm font-medium px-3 py-1.5 bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-all duration-200 flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          活动
        </button>

        <!-- 活动二维码按钮 -->
        <button 
          v-if="tasks[0].activityId"
          @click.stop="viewActivityQrCode(tasks[0].activityId, $event)" 
          class="text-sm font-medium px-3 py-1.5 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-all duration-200 flex items-center"
          title="查看活动笔记二维码"
        >
          <ScanCode theme="outline" size="18" class="mr-1.5" />
          活动码
        </button>
      </div>
    </div>
    
    <!-- 批次任务内容（可折叠） -->
    <div v-if="!isCollapsed()" class="batch-content divide-y divide-gray-100 dark:divide-gray-800">
      <TaskItem
        v-for="task in tasks"
        :key="task.id"
        :task="task"
        :is-batch-task="true"
        :activities="activities"
        @refresh="onRefresh"
        @view-qr-code="viewQrCode"
        @view-note-detail="onViewNoteDetail"
        @view-activity="onViewActivity"
        @view-activity-qr-code="viewActivityQrCode"
        @edit-note="onEditNote"
        @retry-task="onRetryTask"
      />
    </div>
  </div>
</template> 