<template>
  <div v-if="visible" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm">
    <div class="w-[900px] max-w-[95vw] max-h-[90vh] flex flex-col bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-xl border border-gray-200 dark:border-gray-700">
      <!-- 头部栏 -->
      <div class="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <h3 class="text-lg font-bold text-gray-800 dark:text-gray-200 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          笔记模板市场
        </h3>
        <div class="flex items-center gap-2">
          <span class="text-sm text-gray-500 dark:text-gray-400">已选择: {{ selectedTemplates.length }}</span>
          <button 
            @click="$emit('close')" 
            class="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            title="关闭"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
      
      <!-- 搜索和筛选区域 -->
      <div class="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div class="flex flex-col sm:flex-row gap-4">
          <div class="flex-1">
            <div class="relative">
              <input 
                v-model="searchQuery" 
                type="text" 
                placeholder="搜索笔记模板..." 
                class="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                @keyup.enter="fetchTemplates(1)"
              />
              <button 
                class="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-pink-500"
                @click="fetchTemplates(1)"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
          </div>
          <div class="sm:w-48">
            <select 
              v-model="sortBy" 
              class="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
              @change="fetchTemplates(1)"
            >
              <option value="createTime">最新优先</option>
              <option value="likesCount">热门优先</option>
              <option value="viewsCount">多人查看</option>
              <option value="title">标题排序</option>
            </select>
          </div>
          <div class="sm:w-48">
            <select 
              v-model="sortOrder" 
              class="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
              @change="fetchTemplates(1)"
            >
              <option value="DESC">降序</option>
              <option value="ASC">升序</option>
            </select>
          </div>
        </div>
        
        <!-- 添加收藏筛选按钮 -->
        <div class="mt-4 flex items-center">
          <button 
            @click="toggleFavoriteFilter"
            class="px-4 py-2 rounded-md text-sm font-medium shadow-sm flex items-center mr-4"
            :class="favoriteOnly ? 'bg-pink-500 text-white' : 'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
            {{ favoriteOnly ? '我的收藏' : '全部模板' }}
          </button>
        </div>
        
        <!-- 笔记类型导航条 -->
        <div class="mt-4">
          <div class="text-sm text-gray-500 dark:text-gray-400 mb-2 flex justify-between items-center">
            <span>{{ selectedTypeId === null ? '显示全部笔记类型' : `当前分类: ${getSelectedTypeName()}` }}</span>
            <span v-if="noteTypes.length > 0" class="text-xs">共 {{ noteTypes.length }} 个分类</span>
          </div>
          <div class="overflow-x-auto pb-2 custom-scrollbar">
            <div class="flex space-x-2 min-w-max">
              <button 
                class="px-4 py-2 rounded-md transition-colors text-sm font-medium shadow-sm flex-shrink-0"
                :class="selectedTypeId === null ? 'bg-pink-500 text-white' : 'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'"
                @click="selectType(null)"
              >
                全部
              </button>
              <button 
                v-for="type in noteTypes" 
                :key="type.id"
                class="px-4 py-2 rounded-md transition-colors text-sm font-medium shadow-sm flex-shrink-0"
                :class="selectedTypeId === type.id ? 'bg-pink-500 text-white' : 'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'"
                @click="selectType(type.id)"
              >
                {{ type.name }}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 内容区域 -->
      <div class="flex-1 overflow-auto p-4 bg-gray-50 dark:bg-gray-900">
        <!-- 加载状态 -->
        <div v-if="loading" class="flex justify-center my-12">
          <div class="spinner"></div>
        </div>
        
        <!-- 笔记列表 -->
        <div v-else-if="templates.length > 0" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          <div 
            v-for="template in templates" 
            :key="template.id" 
            class="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 bg-white dark:bg-gray-800 dark:border-gray-700 cursor-pointer relative flex flex-col"
            @click="toggleTemplateSelection(template)"
          >
            <div class="aspect-w-3 aspect-h-4 bg-gray-100 dark:bg-gray-700 relative">
              <img 
                v-if="template.coverImage" 
                :src="template.coverImage" 
                :alt="template.title" 
                class="object-cover w-full h-full"
                @error="handleImageError($event, template)"
              />
              <div v-else class="w-full h-full flex items-center justify-center text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <!-- 收藏按钮 - 修复样式，确保只显示在右上角，并改为星星图标 -->
              <button 
                class="absolute top-2 right-2 p-1.5 rounded-full bg-white bg-opacity-80 hover:bg-opacity-100 dark:bg-gray-800 dark:bg-opacity-80 dark:hover:bg-opacity-100 transition-all duration-200 shadow-sm z-10"
                @click.stop="toggleFavorite(template)"
                title="收藏模板"
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  class="h-5 w-5" 
                  :class="template.userStatus?.favorited ? 'text-pink-500 fill-pink-500' : 'text-gray-500 dark:text-gray-400'" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor" 
                  stroke-width="2"
                >
                  <path 
                    stroke-linecap="round" 
                    stroke-linejoin="round" 
                    d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" 
                  />
                </svg>
              </button>
            </div>
            <div class="p-4 flex-1 flex flex-col">
              <h3 class="font-semibold text-gray-800 dark:text-gray-200 mb-2 line-clamp-2" :title="template.title">{{ template.title }}</h3>
              <p class="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-3" :title="template.content">{{ template.content }}</p>
              
              <!-- 底部信息区域 -->
              <div class="mt-auto pt-2 border-t border-gray-100 dark:border-gray-700">
                <div class="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
                  <span class="flex items-center gap-1 px-1">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <span>{{ template.viewsCount || 0 }}</span>
                  </span>
                  <span class="flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    <span>{{ template.likesCount || 0 }}</span>
                  </span>
                </div>
                
                <!-- 选择按钮 -->
                <button 
                  class="w-full mt-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm font-medium rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center justify-center"
                  :class="{ 'bg-pink-100 dark:bg-pink-900 text-pink-700 dark:text-pink-300 hover:bg-pink-200 dark:hover:bg-pink-800': isTemplateSelected(template) }"
                  @click.stop="toggleTemplateSelection(template)"
                >
                  <svg v-if="isTemplateSelected(template)" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  {{ isTemplateSelected(template) ? '已选择' : '选择模板' }}
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 空状态 -->
        <div v-else class="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p class="mt-4 text-gray-600 dark:text-gray-400">暂无笔记模板</p>
          <button 
            class="mt-4 px-4 py-2 bg-pink-500 text-white rounded-md hover:bg-pink-600 transition-colors"
            @click="fetchTemplates(1)"
          >
            刷新
          </button>
        </div>
        
        <!-- 分页 -->
        <div v-if="totalPages > 1" class="mt-8 flex justify-center">
          <div class="flex space-x-2">
            <button 
              class="px-3 py-1 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
              :disabled="currentPage === 1"
              @click="fetchTemplates(currentPage - 1)"
            >
              上一页
            </button>
            <button 
              v-for="page in displayedPages" 
              :key="page"
              class="px-3 py-1 rounded-md transition-colors"
              :class="page === currentPage ? 'bg-pink-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'"
              @click="fetchTemplates(page)"
            >
              {{ page }}
            </button>
            <button 
              class="px-3 py-1 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
              :disabled="currentPage === totalPages"
              @click="fetchTemplates(currentPage + 1)"
            >
              下一页
            </button>
          </div>
        </div>
      </div>
      
      <!-- 底部操作区 -->
      <div class="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex justify-between items-center">
        <div class="text-sm text-gray-600 dark:text-gray-400">
          已选择 {{ selectedTemplates.length }} 个模板
        </div>
        <div class="flex gap-2">
          <button 
            @click="$emit('close')" 
            class="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            取消
          </button>
          <button 
            @click="confirmSelection" 
            class="px-4 py-2 bg-pink-500 text-white rounded-md hover:bg-pink-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="selectedTemplates.length === 0"
          >
            确认选择 ({{ selectedTemplates.length }})
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import service from '@/utils/request/axios';
import { message } from '@/utils/message';

// 定义接口
interface NoteType {
  id: number;
  name: string;
  status?: boolean;
  sort?: number;
}

interface Template {
  id: number | string;
  title: string;
  content: string;
  coverImage?: string;
  typeId?: number;
  type?: NoteType;
  createTime?: string;
  updateTime?: string;
  likesCount?: number;
  viewsCount?: number;
  noteId?: string;
  source: string;
  userStatus?: { favorited: boolean; liked: boolean };
}

// 定义属性
const props = defineProps<{
  visible: boolean;
}>();

// 定义事件
const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'select', templates: Template[]): void;
}>();

// 状态变量
const templates = ref<Template[]>([]);
const selectedTemplates = ref<Template[]>([]);
const loading = ref(false);
const searchQuery = ref('');
const sortBy = ref('createTime');
const sortOrder = ref('DESC');
const currentPage = ref(1);
const pageSize = ref(12);
const total = ref(0);
const totalPages = ref(0);
const noteTypes = ref<NoteType[]>([]);
const selectedTypeId = ref<number | null>(null);
const statusMessage = ref('');
const statusType = ref<'success' | 'error' | 'info'>('info');
const favoriteOnly = ref(false);

// 计算属性
const displayedPages = computed(() => {
  const pages = [];
  const maxPages = 5;
  
  if (totalPages.value <= maxPages) {
    // 如果总页数小于等于最大显示页数，显示所有页码
    for (let i = 1; i <= totalPages.value; i++) {
      pages.push(i);
    }
  } else {
    // 否则，显示当前页附近的页码
    let startPage = Math.max(currentPage.value - Math.floor(maxPages / 2), 1);
    let endPage = startPage + maxPages - 1;
    
    if (endPage > totalPages.value) {
      endPage = totalPages.value;
      startPage = Math.max(endPage - maxPages + 1, 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
  }
  
  return pages;
});

// 方法
function showStatus(message: string, type: 'success' | 'error' | 'info' = 'info') {
  statusMessage.value = message;
  statusType.value = type;
  
  setTimeout(() => {
    statusMessage.value = '';
  }, 3000);
}

async function fetchTemplates(page: number) {
  try {
    loading.value = true;
    currentPage.value = page;
    
    const params: Record<string, any> = {
      page: page,
      pageSize: pageSize.value,
      orderBy: sortBy.value,
      orderDirection: sortOrder.value,
      withUserStatus: true,
      favoriteOnly: favoriteOnly.value
    };
    
    if (searchQuery.value) {
      params.title = searchQuery.value;
    }
    
    if (selectedTypeId.value !== null) {
      params.typeId = selectedTypeId.value;
    }
    
    // 定义可能的API路径及其优先级
    const possibleApiPaths = [
      '/xiaohongshu/note-template-market/list',
      '/xiaohongshu/note/list'
    ];
    
    let responseData = null;
    let error = null;
    
    // 依次尝试每个API路径
    for (const path of possibleApiPaths) {
      try {
        console.log('尝试API路径:', path, '参数:', params);
        const response = await service.get(path, { params });
        console.log('获取模板列表响应:', response);
        
        // 处理可能的多层嵌套
        let processedData = response.data;
        if (
          processedData.code === 200 && 
          processedData.data && 
          typeof processedData.data === 'object' &&
          processedData.data.code !== undefined
        ) {
          processedData = processedData.data;
        }
        
        if (processedData && (processedData.code === 0 || processedData.code === 200)) {
          responseData = processedData;
          break;
        }
      } catch (e) {
        console.warn(`API ${path} 请求失败:`, e);
        error = e;
      }
    }
    
    if (!responseData) {
      console.warn('所有API路径均请求失败，使用测试数据');
      // 使用测试数据
      templates.value = generateTestData();
      total.value = 30;
      totalPages.value = Math.ceil(total.value / pageSize.value);
      showStatus('无法连接到服务器，显示测试数据', 'info');
      return;
    }
    
    // 处理数据
    const data = responseData.data;
    
    // 检查数据结构
    if (data.content) {
      templates.value = data.content;
    } else if (data.items) {
      templates.value = data.items;
    } else if (data.list) {
      templates.value = data.list;
    } else if (Array.isArray(data)) {
      templates.value = data;
    } else {
      templates.value = [];
      console.error('无法找到模板列表数据');
    }
    
    // 设置分页信息
    if (data.totalElements !== undefined) {
      total.value = data.totalElements;
    } else if (data.total !== undefined) {
      total.value = data.total;
    } else if (data.count !== undefined) {
      total.value = data.count;
    } else {
      total.value = templates.value.length;
    }
    
    if (data.totalPages !== undefined) {
      totalPages.value = data.totalPages;
    } else {
      totalPages.value = Math.ceil(total.value / pageSize.value);
    }
    
    console.log(`已加载${templates.value.length}条模板数据，总数:${total.value}，总页数:${totalPages.value}`);
  } catch (error: any) {
    console.error('获取模板列表失败:', error);
    showStatus(error.message || '获取模板列表失败', 'error');
    templates.value = generateTestData();
    total.value = 30;
    totalPages.value = Math.ceil(total.value / pageSize.value);
  } finally {
    loading.value = false;
  }
}

async function fetchNoteTypes() {
  try {
    const response = await service.get('/xiaohongshu/notetype/list');
    console.log('获取笔记类型响应:', response);
    
    // 处理可能的多层嵌套
    let processedData = response.data;
    if (
      processedData.code === 200 && 
      processedData.data && 
      typeof processedData.data === 'object' &&
      processedData.data.code !== undefined
    ) {
      processedData = processedData.data;
    }
    
    if (processedData && (processedData.code === 0 || processedData.code === 200)) {
      // 获取数据
      const data = processedData.data;
      
      // 检查数据结构
      if (data.items) {
        noteTypes.value = data.items;
      } else if (Array.isArray(data)) {
        noteTypes.value = data;
      } else {
        console.error('无法解析笔记类型数据');
        noteTypes.value = [];
      }
      
      // 只保留状态为启用的类型
      noteTypes.value = noteTypes.value.filter(type => type.status !== false);
      
      // 按排序字段排序
      noteTypes.value.sort((a, b) => {
        const sortA = a.sort || 0;
        const sortB = b.sort || 0;
        return sortA - sortB;
      });
    } else {
      console.error('获取笔记类型列表失败:', processedData?.message);
      noteTypes.value = [];
    }
  } catch (error) {
    console.error('获取笔记类型失败:', error);
    noteTypes.value = [];
  }
}

function selectType(typeId: number | null) {
  selectedTypeId.value = typeId;
  fetchTemplates(1);
}

function getSelectedTypeName() {
  if (selectedTypeId.value === null) return '全部';
  const type = noteTypes.value.find(t => t.id === selectedTypeId.value);
  return type ? type.name : '未知分类';
}

function handleImageError(event: Event, template: Template) {
  const target = event.target as HTMLImageElement;
  target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24"%3E%3Cpath fill="%23cccccc" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"%3E%3C/path%3E%3C/svg%3E';
}

function isTemplateSelected(template: Template) {
  return selectedTemplates.value.some(t => t.id === template.id);
}

function toggleTemplateSelection(template: Template) {
  const index = selectedTemplates.value.findIndex(t => t.id === template.id);
  
  if (index >= 0) {
    // 如果已选择，则取消选择
    selectedTemplates.value.splice(index, 1);
  } else {
    // 如果未选择，则添加到选择列表
    selectedTemplates.value.push(template);
  }
}

function confirmSelection() {
  if (selectedTemplates.value.length === 0) {
    showStatus('请至少选择一个模板', 'error');
    return;
  }
  
  emit('select', selectedTemplates.value);
  emit('close');
}

// 生成测试数据
function generateTestData() {
  const testData: Template[] = [];
  for (let i = 1; i <= 12; i++) {
    testData.push({
      id: i,
      title: `测试模板 ${i}`,
      content: `这是一个测试模板内容，用于在API不可用时显示。这是模板 ${i} 的内容。`,
      coverImage: `https://via.placeholder.com/300x200?text=Template+${i}`,
      typeId: i % 3 + 1,
      createTime: new Date().toISOString(),
      updateTime: new Date().toISOString(),
      likesCount: Math.floor(Math.random() * 100),
      viewsCount: Math.floor(Math.random() * 500),
      source: 'test'
    });
  }
  return testData;
}

// 切换收藏筛选
function toggleFavoriteFilter() {
  favoriteOnly.value = !favoriteOnly.value;
  fetchTemplates(1);
}

// 收藏/取消收藏模板
async function toggleFavorite(template: Template) {
  try {
    if (!template.id) {
      showStatus('模板ID不存在', 'error');
      return;
    }
    
    const isFavorited = template.userStatus?.favorited;
    const endpoint = `/xiaohongshu/note-template-market/${template.id}/${isFavorited ? 'unfavorite' : 'favorite'}`;
    
    const response = await service.post(endpoint);
    console.log('收藏状态切换响应:', response);
    
    // 处理可能的多层嵌套
    let processedData = response.data;
    if (
      processedData.code === 200 && 
      processedData.data && 
      typeof processedData.data === 'object' &&
      processedData.data.code !== undefined
    ) {
      processedData = processedData.data;
    }
    
    if (processedData && (processedData.code === 0 || processedData.code === 200)) {
      // 更新模板的收藏状态
      if (!template.userStatus) {
        template.userStatus = { favorited: !isFavorited, liked: false };
      } else {
        template.userStatus.favorited = !isFavorited;
      }
      
      showStatus(isFavorited ? '已取消收藏' : '已收藏', 'success');
      
      // 如果当前是收藏筛选模式且取消了收藏，则从列表中移除该模板
      if (favoriteOnly.value && isFavorited) {
        templates.value = templates.value.filter(t => t.id !== template.id);
        // 更新总数
        total.value = Math.max(0, total.value - 1);
        totalPages.value = Math.ceil(total.value / pageSize.value);
        
        // 如果当前页没有数据了且不是第一页，则返回上一页
        if (templates.value.length === 0 && currentPage.value > 1) {
          fetchTemplates(currentPage.value - 1);
        }
      }
    } else {
      showStatus(processedData?.message || '操作失败', 'error');
    }
  } catch (error: any) {
    console.error('切换收藏状态失败:', error);
    showStatus(error.message || '操作失败', 'error');
  }
}

// 监听visible变化，当显示时加载数据
watch(() => props.visible, (newValue) => {
  if (newValue) {
    fetchNoteTypes();
    fetchTemplates(1);
  }
});

// 组件挂载时初始化
onMounted(() => {
  if (props.visible) {
    fetchNoteTypes();
    fetchTemplates(1);
  }
});
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.spinner {
  border: 4px solid rgba(0, 0, 0, 0.1);
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border-left-color: #ec4899;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.aspect-w-3 {
  position: relative;
  padding-bottom: 133.33%; /* 3:4比例 */
}

.aspect-w-3 > * {
  position: absolute;
}

.custom-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: #ec4899 transparent;
}

.custom-scrollbar::-webkit-scrollbar {
  height: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: #ec4899;
  border-radius: 20px;
}

:deep(.dark) .custom-scrollbar::-webkit-scrollbar-track {
  background: #1f1f1f;
}
</style> 