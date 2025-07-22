<template>
  <div class="mb-6">
    <label class="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
      补充信息
      <span class="text-xs text-gray-500 dark:text-gray-400 ml-1">(选填)</span>
    </label>
    <textarea
      v-model="modelValue"
      class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-500 dark:focus:ring-pink-400 focus:border-transparent transition-all duration-200"
      placeholder="请输入补充信息，如产品特点、活动信息等，将传递给工作流"
      rows="4"
    ></textarea>
    <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
      补充信息将作为额外参数传递给工作流，帮助生成更精准的笔记内容
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  modelValue?: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
}>();

const modelValue = computed({
  get: () => props.modelValue || '',
  set: (value) => emit('update:modelValue', value)
});
</script> 