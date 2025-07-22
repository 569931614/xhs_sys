<template>
  <div class="mb-6">
    <label class="block text-gray-700 dark:text-gray-300 mb-2 font-medium">
      品牌产品
      <span class="text-red-500">*</span>
    </label>
    <input
      v-model="brandProductValue"
      type="text"
      placeholder="输入品牌和产品名称（如：欧诗漫OSM光感小白瓶）"
      class="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 dark:text-white transition-all duration-200"
      required
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

// 定义props
const props = defineProps<{
  modelValue: string;
}>();

// 定义事件
const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
}>();

// 双向绑定
const brandProductValue = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
});
</script> 