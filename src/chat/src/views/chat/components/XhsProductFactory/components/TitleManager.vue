<template>
  <div>
    <div class="mb-6">
      <label class="block text-gray-700 dark:text-gray-300 mb-2 font-medium">
        产品选题
        <span class="text-red-500">*</span>
      </label>
      <div class="flex items-center">
        <div class="relative flex-1">
          <input
            v-model="currentTitle"
            @keyup.enter="addTitle"
            type="text"
            placeholder="输入产品选题（如：适合初学者的手工DIY耳环制作）"
            class="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 rounded-l-md focus:outline-none focus:ring-2 focus:ring-pink-500 dark:text-white transition-all duration-200"
          />
        </div>
        <button
          @click.stop.prevent="addTitle"
          class="px-4 py-2 bg-pink-500 text-white rounded-r-md hover:bg-pink-600 transition-all duration-200 flex items-center"
          :disabled="!currentTitle.trim()"
          type="button"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span>添加</span>
        </button>
        <button
          @click.stop.prevent="openAiTopicGenerator"
          class="ml-2 px-3 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-all duration-200 flex items-center"
          :class="{'opacity-50 cursor-not-allowed': !aiTopicButtonEnabled}"
          :title="aiTopicButtonEnabled ? 'AI智能生成选题' : '积分不足，无法使用AI选题功能，请升级套餐'"
          type="button"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span class="hidden sm:inline">AI生成选题</span>
          <span class="sm:hidden">AI选题</span>
        </button>
      </div>
      
      <!-- 选题列表 -->
      <div class="mt-3 border border-gray-200 dark:border-gray-700 rounded-md p-2 min-h-[100px] max-h-[300px] overflow-y-auto">
        <div v-if="titles.length === 0" class="flex flex-col items-center justify-center h-full py-6 text-gray-400 dark:text-gray-500">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
          </svg>
          <p class="mt-2 text-sm">请添加至少一个选题</p>
        </div>
        
        <transition-group name="list" tag="div" class="space-y-2">
          <div 
            v-for="(title, index) in titles" 
            :key="index"
            class="flex items-center py-2 px-3 rounded-md bg-gray-50 dark:bg-gray-800 group hover:bg-gray-100 dark:hover:bg-gray-750 transition-all duration-200"
          >
            <!-- 编辑模式 -->
            <div v-if="editingIndex === index" class="flex-1 flex">
              <input 
                v-model="editingValue"
                ref="editInput"
                @keyup.enter="saveTitle"
                @keyup.esc="cancelEdit"
                type="text"
                class="w-full px-3 py-1 border border-gray-300 dark:border-gray-700 dark:bg-gray-900 rounded focus:outline-none focus:ring-2 focus:ring-pink-500 dark:text-white transition-all duration-200"
              />
              <div class="flex">
                <button
                  type="button"
                  @click="saveTitle"
                  class="ml-2 text-xs px-2 py-1 text-green-600 hover:text-green-700 hover:bg-green-50 dark:text-green-400 dark:hover:text-green-300 dark:hover:bg-green-900/20 rounded transition-all duration-200"
                  title="保存"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                </button>
                <button
                  type="button"
                  @click="cancelEdit"
                  class="text-xs px-2 py-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20 rounded transition-all duration-200"
                  title="取消"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <!-- 显示模式 -->
            <div v-else class="flex-1 text-gray-700 dark:text-gray-300 truncate flex items-center" :title="title">
              <span class="inline-flex items-center justify-center flex-shrink-0 w-6 h-6 bg-pink-100 dark:bg-pink-900/50 text-pink-600 dark:text-pink-400 rounded-full text-xs font-medium mr-2">{{ index + 1 }}</span>
              <span class="truncate">{{ title }}</span>
            </div>
            
            <template v-if="editingIndex !== index">
              <button
                type="button"
                @click.stop.prevent="startEdit(index, title)"
                class="opacity-0 group-hover:opacity-100 text-xs px-2 py-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/20 rounded transition-all duration-200"
                title="编辑"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button
                type="button"
                @click.stop.prevent="removeTitle(index)"
                class="opacity-0 group-hover:opacity-100 text-xs px-2 py-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20 rounded transition-all duration-200"
                title="删除"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </template>
          </div>
        </transition-group>
        
        <!-- 选题列表底部 -->
        <div class="mt-2 text-xs text-gray-500 dark:text-gray-400 flex items-center justify-between px-2">
          <span class="flex items-center text-pink-500">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            鼠标悬停可查看编辑和删除选项
          </span>
          <span>
            共 {{ titles.length }} 个选题
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, onMounted } from 'vue';
import { checkFunctionPoint } from '../utils';
import { ElMessage } from 'element-plus';

// 定义接收的属性
const props = defineProps<{
  modelValue: string[];
}>();

// 定义向父组件发出的事件
const emit = defineEmits<{
  (e: 'update:modelValue', value: string[]): void;
  (e: 'request-ai-topic'): void;
}>();

// 当前输入的标题
const currentTitle = ref('');
// 本地选题列表
const titles = ref<string[]>(props.modelValue || []);
// 编辑状态变量
const editingIndex = ref<number | null>(null);
const editingValue = ref<string>('');
// 编辑输入框的引用
const editInput = ref<HTMLInputElement | null>(null);
// AI选题按钮权限状态
const aiTopicButtonEnabled = ref(true);

// 组件挂载时检查权限
onMounted(() => {
  checkAiTopicButtonPermission();
});

// 检查AI选题按钮权限
async function checkAiTopicButtonPermission() {
  aiTopicButtonEnabled.value = await checkFunctionPoint('ai_title');
}

// 添加选题
function addTitle() {
  const title = currentTitle.value.trim();
  if (title) {
    // 检查是否已存在相同选题
    if (!titles.value.includes(title)) {
      const newTitles = [...titles.value, title];
      titles.value = newTitles;
      emit('update:modelValue', newTitles);
      currentTitle.value = '';
    } else {
      // 可以在这里添加重复选题的提示
      currentTitle.value = '';
    }
  }
}

// 开始编辑选题
function startEdit(index: number, title: string) {
  editingIndex.value = index;
  editingValue.value = title;
  
  // 在编辑模式下，确保下一个 DOM 更新周期后获取焦点
  nextTick(() => {
    if (editInput.value) {
      editInput.value.focus();
    }
  });
}

// 保存编辑后的选题
function saveTitle() {
  if (editingIndex.value !== null) {
    const newTitle = editingValue.value.trim();
    if (newTitle) {
      const newTitles = [...titles.value];
      newTitles[editingIndex.value] = newTitle;
      titles.value = newTitles;
      emit('update:modelValue', newTitles);
    }
    editingIndex.value = null;
    editingValue.value = '';
  }
}

// 取消编辑
function cancelEdit() {
  editingIndex.value = null;
  editingValue.value = '';
}

// 删除选题
function removeTitle(index: number) {
  const newTitles = [...titles.value];
  newTitles.splice(index, 1);
  titles.value = newTitles;
  emit('update:modelValue', newTitles);
}

// 打开AI选题生成器
function openAiTopicGenerator(event: Event) {
  // 阻止事件冒泡和默认行为
  event?.preventDefault();
  event?.stopPropagation();
  
  // 检查权限
  if (!aiTopicButtonEnabled.value) {
    ElMessage.warning('积分不足，无法使用AI选题功能，请升级套餐');
    return;
  }
  
  // 触发父组件的请求AI选题事件
  emit('request-ai-topic');
}
</script>

<style scoped>
.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}
.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style> 