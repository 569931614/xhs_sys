<template>
  <div class="mb-6">
    <label class="block text-gray-700 dark:text-gray-300 mb-2 font-medium">
      生成数量设置
    </label>

    <div class="flex items-center">
      <span class="text-sm text-gray-600 dark:text-gray-400 mr-2">生成篇数:</span>
      <input
        v-model="batchCount"
        type="number"
        min="1"
        max="10"
        class="px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all duration-200 w-24"
      />
      <span class="ml-2 text-xs text-gray-500 dark:text-gray-400 flex items-center">
        <svg class="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        设置要生成的笔记篇数，如有多个模板将循环使用
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  modelValue: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
}>();

const batchCount = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
});
</script> 