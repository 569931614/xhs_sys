<template>
  <div v-if="visible" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm">
    <div class="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-xl border border-gray-200 dark:border-gray-700 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
      <!-- 标题栏 -->
      <div class="flex justify-between items-center mb-4 pb-3 border-b border-gray-200 dark:border-gray-700">
        <h3 class="text-xl font-bold text-gray-800 dark:text-gray-200 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-2 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          编辑笔记
        </h3>
        <button 
          @click="handleClose" 
          class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <!-- 内容区域 -->
      <div class="flex-1 overflow-y-auto">
        <div v-if="loading" class="flex items-center justify-center h-full">
          <div class="flex flex-col items-center">
            <div class="h-10 w-10 border-4 border-t-pink-500 rounded-full animate-spin mb-4"></div>
            <p class="text-gray-600 dark:text-gray-300">加载笔记中...</p>
          </div>
        </div>
        
        <div v-else-if="error" class="flex items-center justify-center h-full">
          <div class="text-center p-4">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p class="text-red-500 mb-4">{{ error }}</p>
            <button 
              @click="handleClose" 
              class="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-all duration-200"
            >
              关闭
            </button>
          </div>
        </div>
        
        <form v-else @submit.prevent="handleSubmit" class="space-y-6">
          <!-- 类型显示 -->
          <div v-if="formData.type" class="p-3 bg-gray-50 dark:bg-gray-700 rounded-md mb-4">
            <div class="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
              </svg>
              笔记类型: <span class="ml-1 font-semibold">{{ formData.type === 'video' ? '视频' : '图文' }}</span>
            </div>
          </div>
          
          <!-- 视频笔记特有部分 -->
          <div v-if="formData.type === 'video'" class="space-y-6">
            <!-- 视频封面图片 -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">视频封面</label>
              
              <!-- 封面预览区域 -->
              <div v-if="formData.cover" class="mb-4">
                <div class="relative rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 group max-w-md mx-auto">
                  <img 
                    :src="formData.cover" 
                    class="w-full h-auto object-contain max-h-[300px] cursor-pointer"
                    @error="handleImageError($event, -1)"
                    @click="showImagePreview(formData.cover)"
                  />
                  <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <button 
                      type="button"
                      @click.stop="formData.cover = ''" 
                      class="p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all duration-200"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
              
              <!-- 添加封面图片按钮 -->
              <div class="flex space-x-3">
                <label 
                  for="cover-upload" 
                  class="flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  上传封面图片
                  <input 
                    id="cover-upload" 
                    type="file" 
                    accept="image/*" 
                    class="hidden" 
                    @change="handleCoverUpload"
                  />
                </label>
                
                <button 
                  type="button" 
                  @click="addCoverUrl" 
                  class="flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  添加封面链接
                </button>
              </div>
              
              <!-- 封面URL输入 -->
              <div v-if="showCoverUrlInput" class="mt-3 flex">
                <input 
                  v-model="newCoverUrl" 
                  type="text" 
                  class="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-l-md shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 dark:bg-gray-700 dark:text-white"
                  placeholder="输入封面图片URL"
                />
                <button 
                  type="button"
                  @click="confirmAddCoverUrl" 
                  class="px-4 py-2 bg-pink-500 text-white rounded-r-md hover:bg-pink-600 transition-all duration-200"
                >
                  添加
                </button>
              </div>
            </div>
            
            <!-- 视频链接 -->
          <div>
              <label for="video" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">视频链接</label>
              <input 
                id="video" 
                v-model="formData.video" 
                type="text" 
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 dark:bg-gray-700 dark:text-white"
                placeholder="视频链接URL"
              />
            </div>
            
            <!-- 视频预览 -->
            <div v-if="formData.video" class="mb-4">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">视频预览</label>
              <div class="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                <video controls class="w-full h-auto" preload="metadata">
                  <source :src="formData.video" type="video/mp4">
                  您的浏览器不支持视频播放
                </video>
              </div>
            </div>
          </div>
          
          <!-- 图片管理 - 仅在非视频类型时显示 -->
          <div v-if="formData.type !== 'video'">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">图片</label>
            
            <!-- 图片预览区域 -->
            <div v-if="formData.images && formData.images.length > 0" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-4">
              <div 
                v-for="(image, index) in formData.images" 
                :key="index"
                class="relative rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 group aspect-[3/4]"
              >
                <img 
                  :src="image" 
                  class="w-full h-full object-cover cursor-pointer"
                  @error="handleImageError($event, index)"
                  @click="showImagePreview(image)"
                />
                <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <button 
                    type="button"
                    @click.stop="removeImage(index)" 
                    class="p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all duration-200"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
            
            <!-- 添加图片按钮 -->
            <div class="flex space-x-3">
              <label 
                for="image-upload" 
                class="flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                上传图片
                <input 
                  id="image-upload" 
                  type="file" 
                  accept="image/*" 
                  multiple 
                  class="hidden" 
                  @change="handleImageUpload"
                />
              </label>
              
              <button 
                type="button" 
                @click="addImageUrl" 
                class="flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                添加图片链接
              </button>
            </div>
            
            <!-- 图片URL输入 -->
            <div v-if="showImageUrlInput" class="mt-3 flex">
              <input 
                v-model="newImageUrl" 
                type="text" 
                class="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-l-md shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 dark:bg-gray-700 dark:text-white"
                placeholder="输入图片URL"
              />
              <button 
                type="button"
                @click="confirmAddImageUrl" 
                class="px-4 py-2 bg-pink-500 text-white rounded-r-md hover:bg-pink-600 transition-all duration-200"
              >
                添加
              </button>
            </div>
          </div>
          
          <!-- 标题输入 -->
          <div>
            <label for="title" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">标题</label>
            <input 
              id="title" 
              v-model="formData.title" 
              type="text" 
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 dark:bg-gray-700 dark:text-white"
              placeholder="笔记标题"
            />
          </div>
          
          <!-- 内容输入 -->
          <div>
            <label for="content" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">内容</label>
            <textarea 
              id="content" 
              v-model="formData.content" 
              rows="10" 
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 dark:bg-gray-700 dark:text-white"
              placeholder="笔记内容"
            ></textarea>
          </div>
        </form>
      </div>
      
      <!-- 底部按钮 -->
      <div class="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button 
          @click="handleClose" 
          class="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
        >
          取消
        </button>
        <button 
          @click="handleSubmit" 
          :disabled="submitting"
          class="px-4 py-2 bg-pink-500 text-white rounded-md hover:bg-pink-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
        >
          <span v-if="!submitting">保存修改</span>
          <span v-else class="flex items-center">
            <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            保存中...
          </span>
        </button>
      </div>
    </div>
  </div>

  <!-- 图片预览模态框 -->
  <div v-if="showImagePreviewModal" class="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm">
    <div class="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-xl border border-gray-200 dark:border-gray-700 w-full max-w-4xl">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-bold text-gray-800 dark:text-gray-200">
          图片预览
        </h3>
        <button 
          @click="closeImagePreview" 
          class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <div class="flex justify-center">
        <img :src="previewImageUrl" alt="预览图片" class="max-w-full max-h-[70vh] object-contain" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, onMounted } from 'vue';
import axios from 'axios';
import { useAuthStore } from '@/store';

// 获取认证store
const authStore = useAuthStore();

// 定义组件属性
const props = defineProps<{
  visible: boolean;
  noteId?: string;
}>();

// 定义事件
const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void;
  (e: 'success', data: any): void;
  (e: 'error', message: string): void;
}>();

// 状态变量
const loading = ref(false);
const submitting = ref(false);
const error = ref('');
const showImageUrlInput = ref(false);
const newImageUrl = ref('');
const showCoverUrlInput = ref(false);
const newCoverUrl = ref('');

// 表单数据
const formData = reactive({
  title: '',
  content: '',
  images: [] as string[],
  type: '',
  video: '',
  cover: ''
});

// 原始数据，用于检测是否有变更
const originalData = reactive({
  title: '',
  content: '',
  images: [] as string[],
  type: '',
  video: '',
  cover: ''
});

// 图片预览相关变量
const showImagePreviewModal = ref(false);
const previewImageUrl = ref('');

// 监听visible变化，加载笔记数据
watch(() => props.visible, async (newVal) => {
  if (newVal && props.noteId) {
    await fetchNoteData();
  } else {
    resetForm();
  }
});

// 监听noteId变化，重新加载数据
watch(() => props.noteId, async (newVal) => {
  if (props.visible && newVal) {
    await fetchNoteData();
  }
});

// 加载笔记数据
async function fetchNoteData() {
  if (!props.noteId) return;
  
  loading.value = true;
  error.value = '';
  
  try {
    // 获取token
    const token = authStore.token || localStorage.getItem('token');
    
    if (!token) {
      error.value = '未登录或认证已过期，请重新登录';
      return;
    }
    
    console.log('正在获取笔记数据，ID:', props.noteId);
    
    // 发送请求时添加Authorization头
    const response = await axios.get(`/api/xhs/${encodeURIComponent(props.noteId)}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    console.log('获取笔记数据响应:', response.data);
    
    // 处理嵌套的响应结构
    let noteData;
    if (response.data && response.data.data && response.data.data.data) {
      // 嵌套的数据结构：response.data.data.data
      noteData = response.data.data.data;
    } else if (response.data && response.data.data) {
      // 单层嵌套：response.data.data
      noteData = response.data.data;
    } else {
      // 直接数据：response.data
      noteData = response.data;
    }
    
    if (noteData) {
      console.log('解析到的笔记数据:', noteData);
      
      // 更新表单数据
      formData.title = noteData.title || '';
      formData.content = noteData.content || '';
      formData.images = noteData.images || [];
      formData.type = noteData.type || '';
      formData.video = noteData.video || '';
      formData.cover = noteData.cover || '';
      
      // 保存原始数据
      originalData.title = noteData.title || '';
      originalData.content = noteData.content || '';
      originalData.images = [...(noteData.images || [])];
      originalData.type = noteData.type || '';
      originalData.video = noteData.video || '';
      originalData.cover = noteData.cover || '';
    } else {
      error.value = '获取笔记数据失败，返回数据格式不正确';
      console.error('无法解析笔记数据:', response.data);
    }
  } catch (err: any) {
    console.error('获取笔记数据失败:', err);
    if (err.response && err.response.status === 401) {
      error.value = '认证失败，请重新登录';
    } else if (err.response && err.response.status === 404) {
      error.value = '笔记不存在或已被删除';
    } else {
      error.value = err.message || '获取笔记数据失败，请稍后重试';
    }
  } finally {
    loading.value = false;
  }
}

// 重置表单
function resetForm() {
  formData.title = '';
  formData.content = '';
  formData.images = [];
  originalData.title = '';
  originalData.content = '';
  originalData.images = [];
  originalData.type = '';
  originalData.video = '';
  originalData.cover = '';
  error.value = '';
  showImageUrlInput.value = false;
  newImageUrl.value = '';
  showCoverUrlInput.value = false;
  newCoverUrl.value = '';
}

// 关闭弹窗
function handleClose() {
  // 检查是否有未保存的修改
  if (hasChanges() && !confirm('有未保存的修改，确定要关闭吗？')) {
    return;
  }
  
  emit('update:visible', false);
  resetForm();
}

// 检查是否有修改
function hasChanges(): boolean {
  return (
    formData.title !== originalData.title ||
    formData.content !== originalData.content ||
    !arraysEqual(formData.images, originalData.images) ||
    formData.type !== originalData.type ||
    formData.video !== originalData.video ||
    formData.cover !== originalData.cover
  );
}

// 比较两个数组是否相等
function arraysEqual(a: any[], b: any[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

// 提交表单
async function handleSubmit() {
  if (!props.noteId) {
    console.error('提交失败：noteId为空');
    return;
  }
  
  console.log('开始处理表单提交，noteId:', props.noteId);
  
  // 检查是否有修改
  if (!hasChanges()) {
    console.log('没有检测到修改，关闭弹窗');
    emit('update:visible', false);
    return;
  }
  
  submitting.value = true;
  error.value = '';
  
  try {
    // 准备要更新的数据 - 只发送已修改的字段
    const updateData: any = {};
    
    if (formData.title !== originalData.title) {
      updateData.title = formData.title || '';
      console.log('检测到标题修改');
    }
    
    if (formData.content !== originalData.content) {
      updateData.content = formData.content || '';
      console.log('检测到内容修改');
    }
    
    if (!arraysEqual(formData.images, originalData.images)) {
      updateData.images = formData.images || [];
      console.log('检测到图片修改');
    }
    
    if (formData.type !== originalData.type) {
      updateData.type = formData.type || '';
      console.log('检测到类型修改');
    }
    
    if (formData.video !== originalData.video) {
      updateData.video = formData.video || '';
      console.log('检测到视频修改');
    }
    
    if (formData.cover !== originalData.cover) {
      updateData.cover = formData.cover || '';
      console.log('检测到封面修改');
    }
    
    // 如果没有任何修改，直接关闭弹窗
    if (Object.keys(updateData).length === 0) {
      console.log('没有字段被修改，关闭弹窗');
      emit('update:visible', false);
      return;
    }
    
    // 获取token
    const token = authStore.token || localStorage.getItem('token');
    
    if (!token) {
      error.value = '未登录或认证已过期，请重新登录';
      console.error('提交失败：未找到有效token');
      return;
    }
    
    const apiUrl = `/api/xhs/${encodeURIComponent(props.noteId)}`;
    console.log(`准备发送PATCH请求到: ${apiUrl}`);
    console.log('请求头:', { Authorization: `Bearer ${token.substring(0, 10)}...`, 'Content-Type': 'application/json' });
    console.log('请求体:', JSON.stringify(updateData, null, 2));
    
    // 发送更新请求
    const response = await axios({
      method: 'PATCH',
      url: apiUrl,
      data: updateData,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('收到更新响应:', {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      data: response.data
    });
    
    // 处理可能的嵌套响应结构
    let responseData = response.data;
    let success = false;
    
    if (responseData.data && responseData.data.code === 200) {
      // 嵌套结构
      success = true;
      console.log('检测到嵌套成功响应');
      emit('success', responseData.data.data);
    } else if (responseData.code === 200) {
      // 直接结构
      success = true;
      console.log('检测到直接成功响应');
      emit('success', responseData.data);
    } else {
      console.warn('未检测到成功状态码:', responseData);
    }
    
    if (success) {
      console.log('更新成功，关闭弹窗');
      emit('update:visible', false);
      return;
    }
    
    // 如果没有成功标识，则抛出错误
    console.error('未检测到成功状态，抛出错误');
    throw new Error(responseData.message || responseData.data?.message || '更新笔记失败');
  } catch (err: any) {
    console.error('更新笔记失败，详细错误:', err);
    
    // 记录请求和响应信息
    if (err.config) {
      console.error('请求配置:', {
        url: err.config.url,
        method: err.config.method,
        headers: err.config.headers,
        data: err.config.data
      });
    }
    
    // 详细的错误处理
    if (err.response) {
      // 服务器返回了错误状态码
      const statusCode = err.response.status;
      const responseData = err.response.data;
      
      console.error(`服务器返回错误(${statusCode}):`, {
        data: responseData,
        headers: err.response.headers
      });
      
      if (statusCode === 401) {
        error.value = '认证失败，请重新登录';
      } else if (statusCode === 403) {
        error.value = '您没有权限修改此笔记';
      } else if (statusCode === 404) {
        error.value = '笔记不存在或已被删除';
      } else if (statusCode === 500) {
        // 尝试从响应中获取更详细的错误信息
        if (responseData && responseData.message) {
          error.value = `服务器错误: ${responseData.message}`;
          console.error('服务器错误详情:', responseData.message);
        } else {
          error.value = '服务器内部错误，请稍后重试';
          console.error('服务器返回500错误，但没有详细信息');
          
          // 尝试使用备用方法
          tryAlternativeUpdate();
        }
      } else {
        error.value = responseData?.message || `请求失败(${statusCode})`;
      }
    } else if (err.request) {
      // 请求已发送但没有收到响应
      console.error('请求已发送但没有收到响应:', err.request);
      error.value = '服务器无响应，请检查网络连接';
    } else {
      // 请求设置时发生错误
      console.error('请求设置错误:', err.message);
      error.value = err.message || '更新笔记失败，请稍后重试';
    }
    
    emit('error', error.value);
  } finally {
    submitting.value = false;
  }
}

// 尝试备用更新方法
async function tryAlternativeUpdate() {
  if (!props.noteId) return;
  
  console.log('尝试备用更新方法...');
  try {
    const token = authStore.token || localStorage.getItem('token');
    if (!token) return;
    
    // 只更新标题和内容，不更新图片
    const minimalUpdateData = {
      title: formData.title || '',
      content: formData.content || ''
    };
    
    console.log('使用备用方法发送请求，数据:', minimalUpdateData);
    
    const response = await fetch(`/api/xhs/${encodeURIComponent(props.noteId)}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(minimalUpdateData)
    });
    
    const responseData = await response.json();
    console.log('备用方法响应:', responseData);
    
    if (response.ok) {
      console.log('备用方法更新成功');
      emit('success', responseData.data);
      emit('update:visible', false);
    }
  } catch (backupError) {
    console.error('备用更新方法也失败:', backupError);
  }
}

// 处理图片上传
async function handleImageUpload(event: Event) {
  const input = event.target as HTMLInputElement;
  if (!input.files || input.files.length === 0) return;
  
  const files = Array.from(input.files);
  
  // 检查文件类型和大小
  const validFiles = files.filter(file => {
    const isValidType = file.type.startsWith('image/');
    const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB限制
    return isValidType && isValidSize;
  });
  
  if (validFiles.length !== files.length) {
    alert('部分文件无效。请确保所有文件都是图片且大小不超过10MB。');
  }
  
  if (validFiles.length === 0) return;
  
  // 将文件转换为base64
  for (const file of validFiles) {
    try {
      const base64 = await fileToBase64(file);
      formData.images.push(base64);
    } catch (err) {
      console.error('转换图片失败:', err);
    }
  }
  
  // 重置input，允许再次选择相同的文件
  input.value = '';
}

// 文件转base64
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
}

// 处理图片加载错误
function handleImageError(event: Event, index: number) {
  const img = event.target as HTMLImageElement;
  img.src = 'https://via.placeholder.com/150?text=图片加载失败';
}

// 移除图片
function removeImage(index: number) {
  formData.images.splice(index, 1);
}

// 显示图片URL输入框
function addImageUrl() {
  showImageUrlInput.value = true;
  newImageUrl.value = '';
  
  // 聚焦到输入框
  setTimeout(() => {
    const input = document.querySelector('input[placeholder="输入图片URL"]') as HTMLInputElement;
    if (input) input.focus();
  }, 100);
}

// 确认添加图片URL
function confirmAddImageUrl() {
  if (!newImageUrl.value.trim()) return;
  
  formData.images.push(newImageUrl.value.trim());
  newImageUrl.value = '';
  showImageUrlInput.value = false;
}

// 显示图片预览
function showImagePreview(imageUrl: string) {
  previewImageUrl.value = imageUrl;
  showImagePreviewModal.value = true;
}

// 关闭图片预览
function closeImagePreview() {
  showImagePreviewModal.value = false;
}

// 处理封面图片上传
async function handleCoverUpload(event: Event) {
  const input = event.target as HTMLInputElement;
  if (!input.files || input.files.length === 0) return;
  
  const file = input.files[0]; // 只取第一张图片作为封面
  
  // 检查文件类型和大小
  const isValidType = file.type.startsWith('image/');
  const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB限制
  
  if (!isValidType || !isValidSize) {
    alert('封面图片无效。请确保文件是图片且大小不超过10MB。');
    return;
  }
  
  try {
    const base64 = await fileToBase64(file);
    formData.cover = base64;
  } catch (err) {
    console.error('转换封面图片失败:', err);
  }
  
  // 重置input，允许再次选择相同的文件
  input.value = '';
}

// 显示封面URL输入框
function addCoverUrl() {
  showCoverUrlInput.value = true;
  newCoverUrl.value = '';
  
  // 聚焦到输入框
  setTimeout(() => {
    const input = document.querySelector('input[placeholder="输入封面图片URL"]') as HTMLInputElement;
    if (input) input.focus();
  }, 100);
}

// 确认添加封面URL
function confirmAddCoverUrl() {
  if (!newCoverUrl.value.trim()) return;
  
  formData.cover = newCoverUrl.value.trim();
  newCoverUrl.value = '';
  showCoverUrlInput.value = false;
}

// 组件挂载时，如果有noteId且visible为true，则加载数据
onMounted(async () => {
  if (props.visible && props.noteId) {
    await fetchNoteData();
  }
});
</script>

<style scoped>
/* 可选的自定义样式 */
</style> 