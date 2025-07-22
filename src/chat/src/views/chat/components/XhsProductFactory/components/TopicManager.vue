<script setup lang="ts">
import { ref, nextTick } from 'vue';
import { ProductForm } from '../types';

// 定义组件 props
const props = defineProps<{
  productForm: ProductForm;
  titlesList: string[];
}>();

// 定义组件 emit
const emit = defineEmits<{
  (e: 'update:productForm', form: ProductForm): void;
  (e: 'update:titlesList', titles: string[]): void;
  (e: 'showStatusMessage', message: string, type: 'success' | 'error' | 'info'): void;
}>();

// 添加编辑状态变量
const editingIndex = ref<number | null>(null);
const editingValue = ref<string>('');

// 添加选题
function addTitle() {
  console.log('addTitle函数被调用');
  const newTitle = props.productForm.title.trim();
  console.log('当前选题:', newTitle);
  
  if (newTitle) {
    try {
      // 更新两个选题列表，确保响应式
      const updatedTitlesList = [...props.titlesList, newTitle];
      emit('update:titlesList', updatedTitlesList);
      
      // 更新表单中的titles
      const updatedForm = { 
        ...props.productForm, 
        titles: updatedTitlesList,
        title: '' // 清空选题输入框
      };
      emit('update:productForm', updatedForm);
      
      // 调试信息
      console.log('选题已添加:');
      console.log('- updatedTitlesList:', updatedTitlesList);
      console.log('- productForm.titles:', updatedForm.titles);
      
      // 显示消息提示用户添加成功（使用成功状态且短暂显示）
      showSuccessMessage(`已添加: ${newTitle}`);
      
      // 让输入框重新获取焦点，方便连续添加
      nextTick(() => {
        const inputElement = document.querySelector('.topic-input') as HTMLInputElement;
        if (inputElement) inputElement.focus();
      });
    } catch (error) {
      console.error('添加选题出错:', error);
      emit('showStatusMessage', '添加选题失败，请重试', 'error');
    }
  } else {
    console.warn('选题为空，不添加');
  }
}

// 开始编辑选题
function startEdit(index: number) {
  editingIndex.value = index;
  editingValue.value = props.titlesList[index];
  
  // 等待DOM更新后聚焦到编辑框
  nextTick(() => {
    const editInput = document.querySelector('.edit-input-' + index) as HTMLInputElement;
    if (editInput) {
      editInput.focus();
      editInput.select(); // 全选文本方便修改
    }
  });
}

// 保存编辑后的选题
function saveEdit() {
  if (editingIndex.value !== null) {
    const newValue = editingValue.value.trim();
    if (newValue) {
      // 保存编辑后的值
      const oldValue = props.titlesList[editingIndex.value];
      const updatedTitlesList = [...props.titlesList];
      updatedTitlesList[editingIndex.value] = newValue;
      
      // 更新选题列表
      emit('update:titlesList', updatedTitlesList);
      
      // 更新表单中的titles
      const updatedForm = { 
        ...props.productForm, 
        titles: updatedTitlesList 
      };
      emit('update:productForm', updatedForm);
      
      // 显示成功消息
      showSuccessMessage(`已更新: ${newValue}`);
      console.log(`选题已编辑: "${oldValue}" -> "${newValue}"`);
    }
    // 退出编辑模式
    editingIndex.value = null;
  }
}

// 取消编辑
function cancelEdit() {
  editingIndex.value = null;
}

// 删除选题
function removeTitle(index: number) {
  console.log(`removeTitle函数被调用，删除索引: ${index}`);
  
  try {
    // 更新两个选题列表，确保响应式
    const removedTitle = props.titlesList[index];
    const updatedTitlesList = [...props.titlesList];
    updatedTitlesList.splice(index, 1);
    
    // 更新选题列表
    emit('update:titlesList', updatedTitlesList);
    
    // 更新表单中的titles
    const updatedForm = { 
      ...props.productForm, 
      titles: updatedTitlesList 
    };
    emit('update:productForm', updatedForm);
    
    // 退出编辑模式
    if (editingIndex.value === index) {
      editingIndex.value = null;
    } else if (editingIndex.value !== null && editingIndex.value > index) {
      // 如果删除的是当前编辑选题之前的项，需要调整编辑索引
      editingIndex.value--;
    }
    
    // 调试信息
    console.log('选题已删除:');
    console.log('- updatedTitlesList:', updatedTitlesList);
    console.log('- updatedForm.titles:', updatedForm.titles);

    // 显示删除成功消息
    showSuccessMessage(`已删除: ${removedTitle}`);
  } catch (error) {
    console.error('删除选题出错:', error);
    emit('showStatusMessage', '删除选题失败，请重试', 'error');
  }
}

// 显示简短的成功消息（2秒后自动消失）
function showSuccessMessage(message: string) {
  const successToast = document.createElement('div');
  successToast.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-fadeIn';
  successToast.innerHTML = `
    <div class="flex items-center">
      <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
      </svg>
      ${message}
    </div>
  `;
  document.body.appendChild(successToast);
  
  // 2秒后移除
  setTimeout(() => {
    successToast.classList.add('animate-fadeOut');
    setTimeout(() => {
      document.body.removeChild(successToast);
    }, 300);
  }, 2000);
}

// 处理按回车键添加选题
function handleEnterKey(event: KeyboardEvent) {
  if (event.key === 'Enter') {
    event.preventDefault();
    addTitle();
  }
}
</script>

<template>
  <div>
    <!-- 选题输入 -->
    <div class="mb-6">
      <label class="block text-gray-700 dark:text-gray-300 mb-2 font-medium">
        选题
        <span class="text-red-500">*</span>
      </label>
      <div class="flex flex-col sm:flex-row shadow-sm">
        <input
          :value="productForm.title"
          @input="$emit('update:productForm', { ...productForm, title: ($event.target as HTMLInputElement).value })"
          type="text"
          placeholder="例如: 山茶油有什么效果"
          class="topic-input w-full px-3 py-2 rounded-t-md sm:rounded-l-md sm:rounded-tr-none border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all duration-200"
          @keyup.enter="addTitle"
        />
        <button
          @click="addTitle"
          type="button"
          class="flex items-center justify-center px-3 py-2 bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-b-md sm:rounded-r-md sm:rounded-bl-none hover:from-pink-600 hover:to-pink-700 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 active:from-pink-700 active:to-pink-800 transform active:scale-95"
          :disabled="!productForm.title.trim()"
          :class="{ 'opacity-60 cursor-not-allowed': !productForm.title.trim() }"
        >
          <span class="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            添加
          </span>
        </button>
      </div>
      <p class="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
        <span class="flex items-center">
          <svg class="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          提示: 输入选题后按回车键或点击添加按钮
        </span>
      </p>
    </div>
    
    <!-- 选题列表容器 -->
    <div v-if="titlesList.length > 0" class="mb-6 bg-gray-50/90 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg border border-gray-200/80 dark:border-gray-700/90 shadow-sm overflow-hidden transition-all duration-300 animate-fadeIn">
      <!-- 选题列表头部 -->
      <div class="p-3 bg-gray-100/90 dark:bg-gray-750/90 border-b border-gray-200/80 dark:border-gray-700/90">
        <div class="flex justify-between items-center">
          <h3 class="text-sm font-medium text-gray-800 dark:text-gray-200 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1.5 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            已添加选题 <span class="inline-flex items-center justify-center w-5 h-5 ml-1 bg-pink-500 text-white text-xs rounded-full">{{ titlesList.length }}</span>
          </h3>
          <p class="text-xs text-gray-500 dark:text-gray-400">
            将按顺序依次生成，如选题数小于生成数量将循环使用
          </p>
        </div>
      </div>

      <!-- 选题列表内容 -->
      <div class="p-3 bg-gray-50/70 dark:bg-gray-800/60">
        <transition-group name="list" tag="div" class="space-y-2">
          <div 
            v-for="(title, index) in titlesList" 
            :key="'title-' + index"
            class="group flex items-center justify-between p-2 rounded-md border border-gray-100 dark:border-gray-700 hover:border-pink-200 dark:hover:border-pink-800 hover:bg-pink-50 dark:hover:bg-pink-900/10 transition-all duration-200"
          >
            <!-- 选题序号与内容 -->
            <div class="flex items-center flex-1 min-w-0">
              <div class="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full mr-2 text-xs font-medium text-white bg-gradient-to-r from-pink-500 to-pink-600">
                {{ index + 1 }}
              </div>
  
              <!-- 编辑模式 -->
              <input
                v-if="editingIndex === index" 
                v-model="editingValue" 
                :class="'edit-input-' + index"
                class="flex-1 min-w-0 px-2 py-1 border border-pink-300 dark:border-pink-700 rounded focus:outline-none focus:ring-2 focus:ring-pink-500 dark:bg-gray-800 dark:text-white"
                @keyup.enter="saveEdit"
                @keyup.esc="cancelEdit"
              />
              
              <!-- 查看模式 -->
              <p v-else class="flex-1 min-w-0 text-gray-700 dark:text-gray-300 truncate" :title="title">
                {{ title }}
              </p>
            </div>
          
            <!-- 操作按钮 -->
            <div class="flex items-center space-x-1 ml-2">
              <!-- 编辑模式按钮 -->
              <template v-if="editingIndex === index">
                <button 
                  @click="saveEdit" 
                  class="text-xs px-2 py-1 text-white bg-green-500 hover:bg-green-600 rounded transition-colors duration-200"
                  title="保存"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                </button>
                <button 
                  @click="cancelEdit" 
                  class="text-xs px-2 py-1 text-white bg-gray-400 hover:bg-gray-500 rounded transition-colors duration-200"
                  title="取消"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </template>
              
              <!-- 查看模式按钮 -->
              <template v-else>
                <button 
                  @click="startEdit(index)" 
                  class="opacity-0 group-hover:opacity-100 text-xs px-2 py-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/20 rounded transition-all duration-200"
                  title="编辑"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button 
                  @click.stop="removeTitle(index)"
                  class="opacity-0 group-hover:opacity-100 text-xs px-2 py-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20 rounded transition-all duration-200"
                  title="删除"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </template>
            </div>
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
            共 {{ titlesList.length }} 个选题
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.list-enter-active,
.list-leave-active {
  transition: all 0.5s ease;
}
.list-enter-from {
  opacity: 0;
  transform: translateY(30px);
}
.list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
.animate-fadeIn {
  animation: fadeIn 0.5s ease-out;
}
.animate-fadeOut {
  animation: fadeOut 0.3s ease-out forwards;
}
@keyframes fadeIn {
  0% {
    opacity: 0;
    transform: translateY(10px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}
@keyframes fadeOut {
  0% {
    opacity: 1;
    transform: translateY(0);
  }
  100% {
    opacity: 0;
    transform: translateY(-10px);
  }
}
</style> 