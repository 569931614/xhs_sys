<template>
  <div class="mb-6 bg-pink-50 dark:bg-pink-900/20 border border-pink-200 dark:border-pink-800/40 rounded-lg p-4 transition-all duration-300">
    <!-- 模板标题和操作区 -->
    <div class="flex justify-between items-center mb-3">
      <h3 class="text-lg font-medium text-pink-700 dark:text-pink-300 flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
        已选择模板
      </h3>
      <div class="flex gap-2">
        <button
          type="button"
          @click="$emit('close')"
          class="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
          title="关闭模板"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
    
    <!-- 模板列表展示区 -->
    <div class="bg-white dark:bg-gray-800 rounded-md p-4 max-h-[400px] overflow-auto border border-gray-200 dark:border-gray-700">
      <div class="grid grid-cols-1 gap-4">
        <div 
          v-for="(template, index) in templates" 
          :key="index" 
          class="relative border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-200"
          :class="[
            index === 0 ? 'border-l-4 border-l-pink-500' : 'border-l-4 border-l-blue-500',
            index === 0 ? 'bg-pink-50/30 dark:bg-pink-900/10' : index % 2 === 0 ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''
          ]"
        >
          <!-- 序号标签 -->
          <div class="absolute top-2 left-2 z-10">
            <span class="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white rounded-full" 
                  :class="index === 0 ? 'bg-pink-500' : 'bg-blue-500'">
              {{ index === 0 ? '主模板' : `模板 ${index + 1}` }}
            </span>
          </div>
          
          <!-- 删除按钮 -->
          <div class="absolute top-2 right-2 z-10">
            <button
              type="button"
              @click.stop="removeTemplate(index)"
              class="p-1 text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              title="删除模板"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <!-- 模板内容 -->
          <div class="p-4 pt-8">
            <div class="mb-3 flex justify-between items-start">
              <h4 class="font-medium text-gray-800 dark:text-gray-200 text-lg flex items-center">
                <span class="mr-2 text-gray-500 dark:text-gray-400 cursor-move" title="拖动排序">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                  </svg>
                </span>
                <span class="font-bold" :class="index === 0 ? 'text-pink-600 dark:text-pink-400' : 'text-blue-600 dark:text-blue-400'">
                  {{ template.title }}
                </span>
              </h4>
            </div>
            
            <!-- 内容布局 -->
            <div class="flex flex-col md:flex-row gap-4">
              <!-- 如果有封面图，显示封面图 -->
              <div v-if="template.coverImage" class="md:w-1/3">
                <img 
                  :src="template.coverImage" 
                  :alt="template.title" 
                  class="w-full h-[120px] object-cover rounded-md border border-gray-200 dark:border-gray-700"
                  @error="handleImageError"
                />
              </div>
              
              <!-- 显示模板内容预览 -->
              <div :class="template.coverImage ? 'md:w-2/3' : 'w-full'">
                <div class="whitespace-pre-wrap text-gray-700 dark:text-gray-300 text-sm line-clamp-3 bg-gray-50 dark:bg-gray-900 p-3 rounded-md">
                  {{ template.content.substring(0, 150) }}{{ template.content.length > 150 ? '...' : '' }}
                </div>
                <div class="flex justify-end mt-2">
                  <span class="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md">
                    {{ template.content.length }} 字符
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 如果没有模板，显示空状态 -->
      <div v-if="templates.length === 0" class="text-center py-8 text-gray-500 dark:text-gray-400">
        尚未选择任何模板
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits } from 'vue';
import { message } from '@/utils/message';

// 定义模板接口
interface Template {
  id: number | string;
  title: string;
  content: string;
  coverImage?: string;
  source: string;
}

// 定义接收的属性
const props = defineProps<{
  templates: Template[]
}>();

// 定义事件
const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'remove', index: number): void;
}>();

// 处理图片加载错误
function handleImageError(event: Event) {
  const target = event.target as HTMLImageElement;
  target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24"%3E%3Cpath fill="%23cccccc" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"%3E%3C/path%3E%3C/svg%3E';
}

// 删除单个模板
function removeTemplate(index: number) {
  // 发出删除事件，让父组件处理实际的删除操作
  emit('remove', index);
}
</script>

<style scoped>
/* 自定义滚动条 */
.overflow-auto::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.overflow-auto::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.overflow-auto::-webkit-scrollbar-thumb {
  background: #ec4899;
  border-radius: 3px;
}

.overflow-auto::-webkit-scrollbar-thumb:hover {
  background: #d1416b;
}

.dark .overflow-auto::-webkit-scrollbar-track {
  background: #374151;
}

.dark .overflow-auto::-webkit-scrollbar-thumb {
  background: #ec4899;
}

/* 多行文本截断 */
.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style> 