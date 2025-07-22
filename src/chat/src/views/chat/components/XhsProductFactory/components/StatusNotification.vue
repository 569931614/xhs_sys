<template>
  <div>
    <div 
      v-if="message" 
      class="fixed top-4 left-1/2 transform -translate-x-1/2 max-w-md w-full px-4 py-3 rounded-lg shadow-lg z-50 flex items-center"
      :class="statusClass"
    >
      <div class="mr-3 flex-shrink-0">
        <svg v-if="type === 'success'" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-green-500 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <svg v-else-if="type === 'error'" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-red-500 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-blue-500 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <div class="flex-1 text-sm">{{ message }}</div>
      <button @click="clearMessage" class="ml-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

// 定义props
const props = defineProps<{
  message: string;
  type: 'success' | 'error' | 'info' | '';
}>();

// 定义事件
const emit = defineEmits<{
  (e: 'clear'): void;
}>();

// 计算状态样式类
const statusClass = computed(() => {
  switch (props.type) {
    case 'success':
      return 'bg-green-50 text-green-800 dark:bg-green-900/30 dark:text-green-200';
    case 'error':
      return 'bg-red-50 text-red-800 dark:bg-red-900/30 dark:text-red-200';
    case 'info':
      return 'bg-blue-50 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200';
    default:
      return 'bg-gray-50 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
  }
});

// 清除消息
function clearMessage() {
  emit('clear');
}
</script> 