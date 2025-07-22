<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue';
import { saveAiTopicSettingsAPI, getAiTopicSettingsAPI, generateTopicAPI, AiTopicConfig } from '@/api/aiTopicService';

// 定义props
const props = defineProps<{
  visible: boolean
}>();

// 定义事件
const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'generate', topic: string): void
  (e: 'generateMultiple', topics: string[]): void
}>();

// 表单数据
const formData = ref<AiTopicConfig>({
  industry: '', // 行业/领域
  audience: '', // 目标人群
  product: '',  // 核心产品/服务/主题
  location: '', // 地点
  painPoint: '' // 独特卖点/核心痛点
});

// 加载状态
const isGenerating = ref(false);
// 保存状态
const isSaving = ref(false);
// 加载表单数据状态
const isLoading = ref(false);
// 选题数量固定为5个
const topicCount = 5;
// 选题列表数据
const generatedTopics = ref<string[]>([]);
// 选择的选题索引
const selectedTopicIndex = ref(0);
// 多选模式下选中的选题索引集合
const selectedTopics = ref<number[]>([]);
// 结构化选题数据
const structuredTopicData = ref<any[]>([]);

// 错误信息
const errorMessage = ref('');

// 保存和加载表单数据的本地存储键名（作为备用）
const STORAGE_KEY = 'ai_topic_gen_form_data';

// 关闭弹窗
const closeModal = () => {
  emit('update:visible', false);
  // 重置状态
  generatedTopics.value = [];
  selectedTopicIndex.value = 0;
  selectedTopics.value = [];
};

// 保存表单数据到后端
const saveFormData = async () => {
  try {
    isSaving.value = true;
    errorMessage.value = '';
    
    // 先保存到本地作为备份
    localStorage.setItem(STORAGE_KEY, JSON.stringify(formData.value));
    
    // 调用API保存数据
    try {
      await saveAiTopicSettingsAPI(formData.value);
      // 显示保存成功提示
      showSuccessMessage();
    } catch (apiError) {
      console.error('API保存设置失败，使用本地备份:', apiError);
      showSuccessMessage('API保存失败，已备份到本地');
    }
  } catch (error) {
    console.error('保存设置时出错:', error);
    errorMessage.value = '保存设置失败，请重试';
  } finally {
    isSaving.value = false;
  }
};

// 显示保存成功提示
const successMessageVisible = ref(false);
const successMessageText = ref('设置已保存');
const showSuccessMessage = (message = '设置已保存') => {
  successMessageText.value = message;
  successMessageVisible.value = true;
  setTimeout(() => {
    successMessageVisible.value = false;
  }, 2000);
};

// 从后端加载表单数据
const loadFormData = async () => {
  try {
    isLoading.value = true;
    errorMessage.value = '';
    
    let dataLoaded = false;
    
    // 尝试从API加载
    try {
      const apiData = await getAiTopicSettingsAPI();
      if (apiData) {
        formData.value = apiData;
        console.log('从API加载设置成功', apiData);
        dataLoaded = true;
      }
    } catch (apiError) {
      console.error('API加载设置失败，尝试本地存储:', apiError);
      errorMessage.value = '从服务器加载设置失败，尝试本地备份';
    }
    
    // 如果API失败，尝试从本地存储加载
    if (!dataLoaded) {
      const savedData = localStorage.getItem(STORAGE_KEY);
      if (savedData) {
        try {
          const parsedData = JSON.parse(savedData);
          formData.value = { ...parsedData };
          console.log('从本地存储加载设置成功');
          dataLoaded = true;
        } catch (parseError) {
          console.error('无法解析本地存储的表单数据:', parseError);
        }
      }
    }
    
    // 如果本地存储也失败，使用默认值
    if (!dataLoaded) {
      errorMessage.value = '无法加载任何保存的设置，使用默认值';
    }
    
  } finally {
    isLoading.value = false;
  }
};

// 创建备用选题文本
const createBackupTopicText = (): string => {
  // 收集有效的表单字段
  const fields = Object.entries(formData.value)
    .filter(([_, value]) => value.trim() !== '')
    .map(([key, value]) => {
      const labels: Record<string, string> = {
        industry: '行业/领域',
        audience: '目标人群',
        product: '核心产品/服务/主题',
        location: '地点',
        painPoint: '独特卖点/核心痛点'
      };
      return `${labels[key]}: ${value.trim()}`;
    });

  // 创建选题文本（作为备用）
  return fields.length > 0 
    ? fields.join('，') 
    : '生成选题';
};

// 选择一个选题（单选模式）
const selectTopic = (index: number) => {
  selectedTopicIndex.value = index;
};

// 切换选题选择状态（多选模式）
const toggleTopicSelection = (index: number) => {
  const existingIndex = selectedTopics.value.indexOf(index);
  if (existingIndex === -1) {
    // 添加到选中集合
    selectedTopics.value.push(index);
  } else {
    // 从选中集合中移除
    selectedTopics.value.splice(existingIndex, 1);
  }
};

// 处理行点击事件 - 同时触发多选和单选
const handleRowClick = (index: number) => {
  toggleTopicSelection(index);
  selectTopic(index);
};

// 检查选题是否被选中
const isTopicSelected = (index: number): boolean => {
  return selectedTopics.value.includes(index);
};

// 使用选择的单个选题
const useSelectedTopic = () => {
  if (generatedTopics.value.length > 0 && selectedTopicIndex.value >= 0 && selectedTopicIndex.value < generatedTopics.value.length) {
    emit('generate', generatedTopics.value[selectedTopicIndex.value]);
    closeModal();
  }
};

// 使用多个选中的选题
const useMultipleSelectedTopics = () => {
  if (selectedTopics.value.length > 0) {
    const topics = selectedTopics.value.map(index => generatedTopics.value[index]);
    emit('generateMultiple', topics);
    closeModal();
  }
};

// 全选/取消全选
const toggleSelectAll = () => {
  if (selectedTopics.value.length === generatedTopics.value.length) {
    // 如果已全选，则取消全选
    selectedTopics.value = [];
  } else {
    // 否则全选
    selectedTopics.value = [...Array(generatedTopics.value.length).keys()];
  }
};

// 生成选题
const generateTopic = async () => {
  try {
    // 设置加载状态
    isGenerating.value = true;
    errorMessage.value = '';
    generatedTopics.value = [];
    structuredTopicData.value = [];
    selectedTopicIndex.value = 0;
    selectedTopics.value = [];

    // 创建备用选题
    const backupTopicText = createBackupTopicText();
    
    try {
      // 调用选题生成API
      const response = await generateTopicAPI(formData.value, topicCount);
      
      console.log('AI选题生成响应:', response); // 添加日志查看响应
      
      if (response.success && response.topicList && response.topicList.length > 0) {
        // 使用API返回的选题列表
        generatedTopics.value = response.topicList;
        
        // 保存结构化数据
        if (response.data) {
          console.log('结构化数据:', response.data); // 添加日志查看数据结构
          structuredTopicData.value = Array.isArray(response.data) ? response.data : [response.data];
        } else {
          console.warn('没有接收到结构化数据');
        }
      } else {
        // 如果API没有返回有效选题，使用备用选题
        console.warn('API返回无效选题列表，使用备用选题', response);
        generatedTopics.value = [backupTopicText];
      }
    } catch (apiError) {
      console.error('调用AI选题生成API时出错:', apiError);
      // 发生错误时使用本地生成的备用选题
      generatedTopics.value = [backupTopicText];
    }
  } catch (error) {
    console.error('生成选题时出错:', error);
    errorMessage.value = '生成选题失败，请重试';
  } finally {
    // 重置加载状态
    isGenerating.value = false;
  }
};

// 添加新方法：生成更多选题
const generateMoreTopics = async () => {
  try {
    // 设置加载状态
    isGenerating.value = true;
    errorMessage.value = '';
    
    // 创建备用选题
    const backupTopicText = createBackupTopicText();
    
    try {
      // 调用选题生成API
      const response = await generateTopicAPI(formData.value, topicCount);
      
      if (response.success && response.topicList && response.topicList.length > 0) {
        // 保存当前已选中的选题索引
        const currentSelectedTopics = [...selectedTopics.value];
        
        // 将新生成的选题添加到列表中
        const originalLength = generatedTopics.value.length;
        generatedTopics.value = [...generatedTopics.value, ...response.topicList];
        
        // 保存结构化数据
        if (response.data) {
          const newStructuredData = Array.isArray(response.data) ? response.data : [response.data];
          structuredTopicData.value = [...structuredTopicData.value, ...newStructuredData];
        }
        
        // 更新选中索引，保持之前的选择状态
        selectedTopics.value = currentSelectedTopics;
      } else {
        // 如果API没有返回有效选题，添加备用选题
        console.warn('API返回无效选题列表，使用备用选题', response);
        generatedTopics.value.push(backupTopicText);
      }
    } catch (apiError) {
      console.error('调用AI选题生成API时出错:', apiError);
      // 发生错误时使用本地生成的备用选题
      generatedTopics.value.push(backupTopicText);
    }
  } catch (error) {
    console.error('生成更多选题时出错:', error);
    errorMessage.value = '生成更多选题失败，请重试';
  } finally {
    // 重置加载状态
    isGenerating.value = false;
  }
};

// 获取选题的详细信息
const getTopicDetails = (index: number) => {
  if (structuredTopicData.value && structuredTopicData.value[index]) {
    return structuredTopicData.value[index];
  }
  return null;
};

// 组件挂载时加载保存的数据
onMounted(() => {
  loadFormData();
});
</script>

<template>
  <transition name="fade">
    <div v-if="visible" class="fixed inset-0 flex items-center justify-center z-50 p-4 sm:p-6">
      <!-- 背景遮罩 -->
      <div class="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm" @click="closeModal"></div>
      
      <!-- 弹窗内容 -->
      <div class="relative w-full max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden flex flex-col max-h-[85vh] sm:max-h-[90vh] md:max-h-[85vh]">
        <!-- 弹窗标题 -->
        <div class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10 bg-white dark:bg-gray-800">
          <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            AI选题生成
          </h3>
          <button 
            @click.stop.prevent="closeModal" 
            class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <!-- 错误消息提示 -->
        <div v-if="errorMessage" class="p-4 bg-red-50 dark:bg-red-900/30 border-b border-red-200 dark:border-red-800">
          <div class="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-red-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p class="text-sm text-red-600 dark:text-red-300">{{ errorMessage }}</p>
          </div>
        </div>
        
        <!-- 保存成功提示 -->
        <transition name="fade">
          <div v-if="successMessageVisible" class="absolute top-0 inset-x-0 p-4 bg-green-50 dark:bg-green-900/30 border-b border-green-200 dark:border-green-800 z-10">
            <div class="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-green-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              <p class="text-sm text-green-600 dark:text-green-300">{{ successMessageText }}</p>
            </div>
          </div>
        </transition>
        
        <!-- 生成的选题列表 -->
        <div v-if="generatedTopics.length > 0" class="p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div class="flex justify-between items-center mb-3">
            <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-300">
              选择一个或多个选题:
            </h4>
            <div class="flex items-center space-x-2">
              <button 
                @click="toggleSelectAll"
                class="text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
              >
                {{ selectedTopics.length === generatedTopics.length ? '取消全选' : '全选' }}
              </button>
              <button
                @click="generateMoreTopics"
                class="text-xs flex items-center text-green-500 hover:text-green-600 dark:text-green-400 dark:hover:text-green-300"
                :disabled="isGenerating"
              >
                <svg v-if="!isGenerating" xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <svg v-else class="animate-spin h-3.5 w-3.5 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {{ isGenerating ? '生成中...' : '生成更多' }}
              </button>
            </div>
          </div>
          <div class="space-y-2 max-h-[calc(50vh)] sm:max-h-[50vh] md:max-h-[55vh] lg:max-h-[60vh] overflow-y-auto">
            <div 
              v-for="(topic, index) in generatedTopics" 
              :key="index"
              class="p-3 border rounded-md cursor-pointer transition-all duration-200 flex items-start gap-3 hover:bg-blue-50 dark:hover:bg-blue-900/20"
              :class="{
                'bg-blue-50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700': isTopicSelected(index) || index === selectedTopicIndex,
                'bg-gray-50 dark:bg-gray-900/30 border-gray-200 dark:border-gray-700': !isTopicSelected(index) && index !== selectedTopicIndex
              }"
              @click="handleRowClick(index)"
            >
              <!-- 复选框 -->
              <div class="flex-shrink-0 mt-0.5">
                <input 
                  type="checkbox" 
                  :checked="isTopicSelected(index)"
                  @click.stop="toggleTopicSelection(index)"
                  class="h-4 w-4 text-pink-600 focus:ring-pink-500 rounded border-gray-300 dark:border-gray-600"
                />
              </div>
              
              <!-- 选题内容 -->
              <div class="flex-grow">
                <p class="text-sm font-medium text-gray-800 dark:text-gray-200 select-none mb-1">
                  {{ topic }}
                </p>
                
                <!-- 结构化数据展示 -->
                <div v-if="getTopicDetails(index)" class="mt-1 text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/50 rounded p-1.5">                  
                  <!-- 分段式结构化展示 (如果有多行) -->
                  <div v-if="getTopicDetails(index)?.desc?.includes('\n')" class="mt-0">
                    <div class="whitespace-pre-line">
                      <!-- 爆款指数行 -->
                      <div v-if="getTopicDetails(index)?.desc?.includes('爆款指数')" class="flex items-center mb-0.5 text-yellow-500 font-medium">
                        <span>{{ getTopicDetails(index)?.desc.split('\n')[0] }}</span>
                      </div>
                      
                      <!-- 评分参数行 -->
                      <div v-if="getTopicDetails(index)?.desc?.includes('评分参数')" class="mb-0.5 text-blue-500">
                        <span>{{ getTopicDetails(index)?.desc.split('\n')[1] }}</span>
                      </div>
                      
                      <!-- 词根行 -->
                      <div v-if="getTopicDetails(index)?.desc?.includes('词根')" class="mb-0.5 text-green-500">
                        <span>{{ getTopicDetails(index)?.desc.split('\n')[2] }}</span>
                      </div>
                      
                      <!-- 搜索匹配行 -->
                      <div v-if="getTopicDetails(index)?.desc?.includes('搜索匹配')" class="mb-0.5 text-purple-500">
                        <span>{{ getTopicDetails(index)?.desc.split('\n')[3] }}</span>
                      </div>
                      
                      <!-- SEO说明行 -->
                      <div v-if="getTopicDetails(index)?.desc?.includes('SEO')" class="mb-0.5 text-gray-500">
                        <span>{{ getTopicDetails(index)?.desc.split('\n')[4] }}</span>
                      </div>
                    </div>
                  </div>
                  
                  <!-- 添加其他结构化字段 -->
                  <template v-for="(value, key) in getTopicDetails(index) || {}" :key="String(key)">
                    <div v-if="typeof key === 'string' && key !== 'title' && key !== 'desc'" class="mb-1">
                      <span class="font-medium">{{ key }}:</span> {{ typeof value === 'object' ? JSON.stringify(value) : value }}
                    </div>
                  </template>
                </div>
              </div>
            </div>
          </div>
          
          <div class="mt-4 flex justify-center sticky bottom-0 pb-4 pt-2 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700">
            <button
              @click="selectedTopics.length > 0 ? useMultipleSelectedTopics() : useSelectedTopic()"
              class="w-full sm:w-auto px-6 py-3 sm:py-2 bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-md hover:from-pink-600 hover:to-pink-700 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              :disabled="generatedTopics.length === 0"
            >
              <span v-if="selectedTopics.length > 0" class="flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                使用已选择的 {{ selectedTopics.length }} 个选题
              </span>
              <span v-else class="flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                使用当前选中选题
              </span>
            </button>
          </div>
        </div>
        
        <!-- 设置表单 -->
        <div v-if="!isLoading && generatedTopics.length === 0" class="p-4 overflow-y-auto max-h-[75vh] sm:max-h-[80vh] md:max-h-[75vh]">
          <div class="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-lg mb-4 border border-blue-100 dark:border-blue-800">
            <p class="text-sm text-blue-800 dark:text-blue-200 flex items-start">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 flex-shrink-0 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>
                填写以下信息，AI将根据您提供的内容生成更有针对性的选题。所有字段均为选填，填写越详细，生成的选题越精准。您的设置将保存到本地，下次使用时自动加载。
              </span>
            </p>
          </div>
          
          <form @submit.prevent="generateTopic" class="space-y-4">
            <!-- 行业/领域 -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                行业/领域
              </label>
              <input
                v-model="formData.industry"
                type="text"
                placeholder="例如：英语教育, 本地餐饮(火锅), 美妆护肤, 家居软装"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500 dark:bg-gray-800 dark:text-white"
              />
            </div>
            
            <!-- 目标人群 -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                目标人群
              </label>
              <input
                v-model="formData.audience"
                type="text"
                placeholder="例如：K12学生家长, 25-35岁都市丽人, 租房党, 考研学生"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500 dark:bg-gray-800 dark:text-white"
              />
            </div>
            
            <!-- 核心产品/服务/主题 -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                核心产品/服务/主题
              </label>
              <input
                v-model="formData.product"
                type="text"
                placeholder="例如：在线英语课程, 水果捞, 防晒霜, 小户型收纳"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500 dark:bg-gray-800 dark:text-white"
              />
            </div>
            
            <!-- 地点 -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                地点
              </label>
              <input
                v-model="formData.location"
                type="text"
                placeholder="例如：北京, 深圳, 上海, 成都"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500 dark:bg-gray-800 dark:text-white"
              />
            </div>
            
            <!-- 独特卖点/核心痛点 -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                独特卖点/核心痛点
              </label>
              <input
                v-model="formData.painPoint"
                type="text"
                placeholder="例如：高效学习, 性价比高, 适合敏感肌, 增大收纳空间"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500 dark:bg-gray-800 dark:text-white"
              />
            </div>
            
            <!-- 按钮组 -->
            <div class="flex justify-between mt-6">
              <button
                type="button"
                @click="saveFormData"
                class="px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-750 focus:outline-none focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400"
                :disabled="isSaving"
              >
                <span v-if="!isSaving">保存设置</span>
                <span v-else class="flex items-center">
                  <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  保存中...
                </span>
              </button>
              
              <button
                type="submit"
                class="px-4 py-2 bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-md hover:from-pink-600 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2"
                :disabled="isGenerating"
              >
                <span v-if="!isGenerating">生成选题</span>
                <span v-else class="flex items-center">
                  <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  生成中...
                </span>
              </button>
            </div>
          </form>
        </div>
        
        <!-- 加载中状态 -->
        <div v-if="isLoading" class="p-4 flex justify-center items-center min-h-[200px]">
          <div class="flex flex-col items-center">
            <svg class="animate-spin h-8 w-8 text-pink-500 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p class="text-sm text-gray-500 dark:text-gray-400">加载中...</p>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style> 