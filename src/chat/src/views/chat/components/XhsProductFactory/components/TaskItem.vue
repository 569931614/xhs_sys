<script setup lang="ts">
import { ScanCode } from '@icon-park/vue-next';
import { Task, Activity } from '../types';
import { formatErrorMessage } from '../utils';

// 定义组件 props
const props = defineProps<{
  task: Task;
  isBatchTask?: boolean;
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

// 计算任务状态标签的样式
const statusClass = (status: string) => {
  switch (status) {
    case 'pending': return 'bg-yellow-400 dark:bg-yellow-600';
    case 'running': return 'bg-blue-500 dark:bg-blue-600';
    case 'completed': return 'bg-green-500 dark:bg-green-600';
    case 'failed': return 'bg-red-500 dark:bg-red-600';
    default: return 'bg-gray-500 dark:bg-gray-600';
  }
};

// 格式化任务状态文本
const statusText = (status: string) => {
  switch (status) {
    case 'pending': return '等待处理';
    case 'running': return '处理中';
    case 'completed': return '已完成';
    case 'failed': return '失败';
    default: return '未知';
  }
};

// 刷新任务状态
function refreshTask() {
  emit('refresh', props.task.id);
}

// 查看任务二维码
function viewQrCode() {
  emit('viewQrCode', props.task);
}

// 查看笔记详情
function viewNoteDetail() {
  emit('viewNoteDetail', props.task);
}

// 编辑笔记
function editNote() {
  if (props.task.noteId) {
    emit('editNote', { ...props.task, id: props.task.noteId });
  } else {
    console.error('无法编辑笔记：缺少noteId');
  }
}

// 查看活动
function viewActivity() {
  if (props.task.activityId) {
    emit('viewActivity', props.task.activityId);
  }
}

// 查看活动二维码
function viewActivityQrCode(event?: Event) {
  if (props.task.activityId) {
    emit('viewActivityQrCode', props.task.activityId, event);
  }
}

// 重试任务
function retryTask() {
  emit('retryTask', props.task);
}
</script>

<template>
  <div class="task-item p-3 transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-800/50">
    <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center">
      <div class="flex items-center flex-grow mb-2 sm:mb-0">
        <p class="text-sm text-gray-600 dark:text-gray-400 mr-2 flex-shrink">
          {{ task.title }}
        </p>
        <span
          :class="[statusClass(task.status), 'text-white text-xs px-2 py-0.5 rounded-full whitespace-nowrap ml-2']"
        >
          {{ statusText(task.status) }}
        </span>
      </div>
      
      <div class="task-actions flex flex-wrap gap-2">
        <button
          v-if="task.status === 'pending' || task.status === 'running'"
          @click="refreshTask"
          class="text-sm font-medium px-3 py-1 bg-gray-200 dark:bg-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
        >
          刷新
        </button>
        
        <!-- 已完成任务的操作按钮组 -->
        <template v-if="task.status === 'completed'">
          <button
            @click="viewQrCode"
            class="text-sm font-medium px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-all duration-200 flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
            二维码
          </button>
          
          <button
            v-if="task.result"
            @click="viewNoteDetail"
            class="text-sm font-medium px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-600 transition-all duration-200 flex items-center"
            title="查看笔记详情"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            详情
          </button>
        </template>

        <!-- 失败任务的操作按钮组 -->
        <template v-else-if="task.status === 'failed'">
          <button
            @click="retryTask"
            class="text-sm font-medium px-3 py-1 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-all duration-200 flex items-center"
            title="重试任务"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            重试
          </button>

          <!-- 失败任务的错误信息 -->
          <p class="text-sm font-medium text-red-500 truncate max-w-full sm:max-w-xs">
            {{ formatErrorMessage(task.error || '处理失败') }}
          </p>
        </template>
      </div>
    </div>
  </div>
</template> 