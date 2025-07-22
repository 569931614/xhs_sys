<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue';
import { useAuthStore, useAppCatStore } from '@/store';
import {
  fetchXhsPostsAPI,
  createXhsPostAPI,
  markXhsPostUsedAPI,
  markXhsPostDiscardedAPI,
  markXhsPostDouyinUsedAPI,
  deleteXhsPostAPI,
  uploadImageAPI,
  importExcelAPI,
  fetchActivityPostsAPI,
  addPostToActivityAPI,
  fetchXhsActivityDetailAPI
} from '@/api/xhs';
import { post } from '@/utils/request';
import axios from 'axios';
import { downloadXhsAutoTemplateAPI } from '@/api/xhs_auto';
import { ScanCode } from '@icon-park/vue-next';

// 状态管理
const authStore = useAuthStore();
const appCatStore = useAppCatStore(); // 添加appCatStore
const loading = ref(false);
const submitting = ref(false);
const error = ref<string | null>(null);
const searchText = ref('');
const showModal = ref(false);
const refreshTrigger = ref(0);
const posts = ref<any[]>([]);
const filteredPosts = ref<any[]>([]);
const isInitialized = ref(false);

// 当前活动ID和名称
const activityId = ref<string | null>(null);
const activityName = ref<string | null>(null);
const titleLoading = ref(true); // 标题加载状态

// 定义 props
const props = defineProps({
  activityId: {
    type: String,
    default: null
  }
});

// 从URL获取活动ID
function getActivityIdFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('activityId');
}

// 监听 props 变化
watch(() => props.activityId, (newValue) => {
  if (newValue) {
    titleLoading.value = true; // 开始加载新标题
    activityId.value = newValue;
    if (isInitialized.value) {
      // 如果组件已初始化，则立即刷新数据
      forceRefresh();
    }
  }
}, { immediate: true });

// 详情弹窗状态
const showDetailModal = ref(false);
const currentPostId = ref<string | number | null>(null);
const detailUrl = computed(() => {
  if (!currentPostId.value) return '';
  return `/chat#/xhs-auto-api?id=${currentPostId.value}`;
});

// 二维码相关状态
const showQRCodeModal = ref(false);
const currentQRCodePost = ref<any>(null);
const qrCodeURL = computed(() => {
  if (!currentQRCodePost.value) return '';
  
  // 构建分享链接，包含笔记ID
  const shareLink = encodeURIComponent(`${window.location.origin}/chat#/xhs-auto-api?id=${currentQRCodePost.value.id}`);
  
  // 使用QR服务生成二维码
  return `https://xhs.aivip1.top/api/html-render/qrcode?data=${shareLink}`;
});

// Excel导入相关状态
const showImportModal = ref(false);
const importFile = ref<File | null>(null);
const importLoading = ref(false);
const importProgress = ref(0);
const importResult = ref<{
  success: number;
  fail: number;
  total: number;
  errors?: string[];
} | null>(null);

// 立即记录用户信息，便于调试
console.log('Notes组件创建, 用户信息:', authStore.userInfo);

// 创建新笔记表单
const newPost = ref({
  title: '',
  content: '',
  type: 'normal' as 'normal' | 'video',
  images: ['']
});

// 跟踪进行中的请求
const abortControllers: AbortController[] = [];

// 组件挂载状态
const isComponentMounted = ref(true);

// 全局消息服务
const message = window?.$message;

// 监听刷新触发器
watch(refreshTrigger, () => {
  fetchPostsData(true);
});

// 获取新的请求控制器
function getAbortController(): AbortController {
  const controller = new AbortController();
  abortControllers.push(controller);
  return controller;
}

// 强制刷新数据的方法
function forceRefresh() {
  refreshTrigger.value += 1;
}

// 返回活动列表页面
function goBackToActivities() {
  // 使用appCatStore显示活动列表界面
  appCatStore.showApp({
    id: 'xhs-activities',
    name: '小红书活动类型',
    type: 'built-in',
    path: 'xhs-activities'
  });
  
  // 清除当前活动ID
  localStorage.removeItem('currentActivityId');
  
  // 显示提示信息
  if (window.$message) {
    window.$message.success('已返回活动列表');
  }
}

// 组件初始化函数
async function initializeComponent() {
  // 防止重复初始化
  if (isInitialized.value) {
    return;
  }
  
  isInitialized.value = true;
  
  // 先重置加载状态和数据
  loading.value = false;
  posts.value = [];
  filteredPosts.value = [];
  
  // 重置活动ID
  activityId.value = null;
  activityName.value = null;
  titleLoading.value = true; // 设置标题为加载状态
  
  // 优先级：1. props中的活动ID 2. URL中的活动ID 3. localStorage中的活动ID
  if (props.activityId) {
    // 1. 如果props中有活动ID
    activityId.value = props.activityId;
    // 同时更新localStorage，保持一致性
    localStorage.setItem('currentActivityId', props.activityId);
  } else {
    // 2. 检查URL中是否有活动ID
    const urlActivityId = getActivityIdFromUrl();
    if (urlActivityId) {
      activityId.value = urlActivityId;
      // 同时更新localStorage，保持一致性
      localStorage.setItem('currentActivityId', urlActivityId);
    } else {
      // 3. 尝试从localStorage获取
      const storedActivityId = localStorage.getItem('currentActivityId');
      if (storedActivityId) {
        activityId.value = storedActivityId;
      }
    }
  }
  
  // 如果有活动ID，获取活动详情
  if (activityId.value) {
    await fetchActivityDetail(activityId.value);
  }
  
  // 允许DOM更新
  await nextTick();
  
  // 只执行一次数据加载
  try {
    await fetchPostsData(true);
  } catch (error) {
    message?.error('加载笔记失败，请手动刷新');
  }
}

// 立即自调用初始化 - 确保组件创建时就开始初始化
(() => {
  setTimeout(() => initializeComponent(), 0);
})();

// 获取活动详情
async function fetchActivityDetail(id: string) {
  titleLoading.value = true;
  try {
    // 处理"default"特殊情况
    if (id === 'default') {
      console.log('当前是默认活动');
      activityName.value = '日常使用';
      titleLoading.value = false;
      return;
    }
    
    console.log('获取活动详情, ID:', id);
    const response = await fetchXhsActivityDetailAPI(id);
    console.log('活动详情响应:', response);
    
    if (response && response.data) {
      // 直接获取活动名称
      activityName.value = response.data.name || '未命名活动';
      console.log('设置活动名称为:', activityName.value);
    } else if (response && typeof response === 'object') {
      // 尝试从不同层级获取名称
      const responseObj = response as any; // 使用any类型避免类型错误
      if (responseObj.name) {
        activityName.value = responseObj.name;
      } else if (responseObj.data && responseObj.data.data && responseObj.data.data.name) {
        activityName.value = responseObj.data.data.name;
      } else {
        activityName.value = `活动 ${id}`;
      }
      console.log('从不同层级获取到活动名称:', activityName.value);
    } else {
      activityName.value = `活动 ${id}`;
      console.log('无法获取活动名称，使用默认值:', activityName.value);
    }
  } catch (error) {
    console.error('获取活动详情失败:', error);
    activityName.value = id === 'default' ? '日常使用' : `活动 ${id}`;
  } finally {
    titleLoading.value = false;
  }
}

// 加载笔记数据
async function fetchPostsData(reset = false) {
  if (!isComponentMounted.value) {
    return;
  }
  
  if (loading.value && !reset) {
    return;
  }
  
  try {
    loading.value = true;
    
    // 获取请求控制器
    const controller = getAbortController();
    
    try {
      let response;
      
      // 首先检查URL中是否有活动ID
      const urlActivityId = getActivityIdFromUrl();
      if (urlActivityId) {
        // URL中的活动ID优先级最高
        activityId.value = urlActivityId;
        // 同时更新localStorage
        localStorage.setItem('currentActivityId', urlActivityId);
      } else if (!activityId.value) {
        // 如果没有URL活动ID且组件内没有设置活动ID，尝试从localStorage获取
        const storedActivityId = localStorage.getItem('currentActivityId');
        if (storedActivityId) {
          activityId.value = storedActivityId;
        }
      }
      
      // 日常使用活动的情况：检查是否是特殊值"default"
      const isDefaultActivity = activityId.value === 'default';
      
      // 根据是否有活动ID决定获取所有笔记还是特定活动的笔记
      if (activityId.value && !isDefaultActivity) {
        // 正常活动：获取活动详情来显示活动名称
        await fetchActivityDetail(activityId.value);
        
        // 获取活动的笔记
        response = await fetchActivityPostsAPI(activityId.value);
        
        // 更新页面标题
        document.title = activityName.value ? 
          `小红书笔记 - ${activityName.value}` : 
          `小红书笔记 - 活动 ${activityId.value}`;
      } else {
        // 默认活动或无活动情况：获取所有笔记
        response = await fetchXhsPostsAPI({
          isUsed: undefined
        });
        
        // 如果是默认活动，更新活动名称为"日常使用"
        if (isDefaultActivity) {
          activityName.value = '日常使用';
          document.title = '小红书笔记 - 日常使用';
        } else {
          document.title = '小红书笔记';
          activityName.value = null;
        }
        
        titleLoading.value = false; // 关闭标题加载状态
      }
      
      if (!isComponentMounted.value) {
        return;
      }
      
      // 正确处理API返回的数据结构
      if (response && response.data) {
        // 处理不同的API响应结构情况
        let resultData;
        if (Array.isArray(response.data)) {
          // 如果直接返回数组
          resultData = response.data;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          // 如果是嵌套在data字段中的数组
          resultData = response.data.data;
        }  else if (response.data.data && response.data.data.data && Array.isArray(response.data.data.data)) {
          // 如果是嵌套在data字段中的数组
          resultData = response.data.data.data;
        } else {
          // 其他情况，尝试将整个数据对象视为一条记录
          resultData = [response.data];
        }
        
        posts.value = resultData;
        updateFilteredPosts();
      } else {
        message?.error('获取笔记列表失败: 无数据返回');
        posts.value = [];
        updateFilteredPosts();
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        return;
      }
      
      message?.error('获取笔记失败，请稍后重试');
      posts.value = [];
      updateFilteredPosts();
    }
  } finally {
    if (isComponentMounted.value) {
      loading.value = false;
    } else {
      console.log('获取笔记列表流程完成，但组件已卸载');
    }
  }
}

// 创建笔记提交处理
const handleSubmit = async () => {
  if (submitting.value) return;
  
  try {
    // 验证表单 - 标题和内容至少填一个
    if (!newPost.value.title.trim() && !newPost.value.content.trim()) {
      message?.error('标题和内容至少填写一项');
      return;
    }
  
    // 过滤掉空的图片URL
    const filteredImages = newPost.value.images.filter(img => img.trim() !== '');

    // 构建请求数据
    const postData = {
      title: newPost.value.title.trim(),
      content: newPost.value.content.trim(),
      images: filteredImages,
      type: newPost.value.type
    };

    // 添加调试日志，查看当前活动ID的各种来源
    console.log('当前活动ID信息:', {
      activityIdValue: activityId.value,
      activityIdType: typeof activityId.value,
      propsActivityId: props.activityId,
      urlActivityId: getActivityIdFromUrl(),
      localStorageActivityId: localStorage.getItem('currentActivityId')
    });

    // 检查活动ID是否有效
    let finalPostData: Record<string, any> = { ...postData };

    // 处理活动ID
    if (activityId.value && activityId.value !== 'default') {
      // 只有当活动ID存在且不是特殊的"default"值时，才添加到请求
      finalPostData.activityId = activityId.value;
      console.log('使用正常活动ID:', activityId.value);
    } else if (activityId.value === 'default') {
      console.log('当前是默认活动"日常使用"，创建无关联笔记');
    } else {
      console.log('没有活动ID，将创建独立笔记');
    }
    
    // 显示最终将要发送的数据
    console.log('准备发送创建笔记请求:', finalPostData);
    
    // 调用API提交笔记
    await submitPost(finalPostData);
  } catch (error) {
    console.error('提交笔记异常:', error);
    message?.error('创建失败，请稍后重试');
  } finally {
    submitting.value = false;
  }
};

// 分离提交逻辑，让类型更清晰
async function submitPost(postData: any) {
  // 显示加载状态
  submitting.value = true;
  
  // 保存提交前的表单数据
  const formData = { ...newPost.value };
  
  // 先关闭模态框
  showModal.value = false;
  
  try {
    const response = await createXhsPostAPI(postData);
    console.log('创建笔记响应:', response);

    // 处理响应
    if (response && response.data) {
      // 成功
      message?.success('创建笔记成功');
      
      // 注意：不再需要额外调用将笔记添加到活动的API，因为已经在创建时绑定了活动ID
      
      // 重置表单
      newPost.value = {
        title: '',
        content: '',
        images: [''],
        type: 'normal'
      };
      
      // 直接强制刷新
      refreshTrigger.value += 1;
    } else {
      // 恢复模态框
      showModal.value = true;
      // 恢复表单数据
      newPost.value = formData;
      
      // 失败
      console.error('创建笔记失败: 无数据返回');
      message?.error('创建失败，请稍后重试');
    }
  } catch (error: any) {
    console.error('创建笔记出错:', error);
    message?.error('创建失败: ' + (error.message || '请稍后重试'));
    // 恢复模态框
    showModal.value = true;
    // 恢复表单数据
    newPost.value = formData;
  }
}

// 删除笔记
async function deletePost(id: string) {
  if (!confirm('确定要删除此笔记吗？')) return;
  if (!isComponentMounted.value) return;
  
  try {
    const controller = getAbortController();
    const response = await deleteXhsPostAPI(Number(id));
    
    if (!isComponentMounted.value) return;
    
    if (response && response.data) {
      message?.success('删除成功');
      
      // 关闭菜单
      activeActionMenu.value = null;
      
      // 从列表中移除，同时强制刷新
      posts.value = posts.value.filter(item => item.id !== id);
      refreshTrigger.value += 1;
      updateFilteredPosts();
    } else {
      message?.error('删除失败: 请稍后重试');
    }
  } catch (error: any) {
    message?.error('删除失败，请稍后重试');
  }
}

// 标记已使用
async function markAsUsed(id: string) {
  if (!isComponentMounted.value) return;
  
  try {
    const response = await markXhsPostUsedAPI(Number(id));
    
    if (!isComponentMounted.value) return;
    
    message?.success('已标记为已使用');
    
    // 关闭菜单
    activeActionMenu.value = null;
    
    // 直接刷新获取最新数据
    refreshTrigger.value += 1;
  } catch (error: any) {
    console.error('标记笔记已使用失败', error);
    message?.error('操作失败，请稍后重试');
  }
}

// 标记弃用
async function markAsDiscarded(id: string) {
  if (!confirm('确定要将此笔记标记为弃用吗？')) return;
  if (!isComponentMounted.value) return;
  
  try {
    const response = await markXhsPostDiscardedAPI(Number(id));
    
    if (!isComponentMounted.value) return;
    
    message?.success('已标记为弃用');
    
    // 关闭菜单
    activeActionMenu.value = null;
    
    // 直接刷新获取最新数据
    refreshTrigger.value += 1;
  } catch (error: any) {
    console.error('标记笔记为弃用失败', error);
    message?.error('操作失败，请稍后重试');
  }
}

// 标记为抖音已使用
async function markAsDouyinUsed(id: string) {
  if (!isComponentMounted.value) return;
  
  try {
    const response = await markXhsPostDouyinUsedAPI(Number(id));
    
    if (!isComponentMounted.value) return;
    
    message?.success('已标记为抖音已使用');
    
    // 关闭菜单
    activeActionMenu.value = null;
    
    // 直接刷新获取最新数据
    refreshTrigger.value += 1;
  } catch (error: any) {
    console.error('标记笔记为抖音已使用失败', error);
    message?.error('操作失败，请稍后重试');
  }
}

// 手动刷新列表
const refreshList = async () => {
  refreshTrigger.value += 1;
};

// 更新过滤后的笔记列表
function updateFilteredPosts() {
  try {
    if (!searchText.value) {
      filteredPosts.value = [...posts.value]; // 使用解构确保引用变化
      return;
    }
    
    const keyword = searchText.value.toLowerCase();
    filteredPosts.value = posts.value.filter(post => {
      return (
        String(post.title || '').toLowerCase().includes(keyword) || 
        String(post.content || '').toLowerCase().includes(keyword)
      );
    });
  } catch (e) {
    filteredPosts.value = [];
  }
}

// 监听搜索文本变化
function handleSearchInput(e: Event) {
  const target = e.target as HTMLInputElement;
  searchText.value = target.value;
  updateFilteredPosts();
}

// 添加图片输入框
const addImageInput = () => {
  if (newPost.value.images.length < 9) {
    newPost.value.images.push('');
  }
};

// 删除图片输入框
const removeImageInput = (index: number) => {
  newPost.value.images.splice(index, 1);
};

// 监听模态框状态变化，打开时重置表单
watch(showModal, (newVal) => {
  if (newVal) {
    newPost.value = {
      title: '',
      content: '',
      images: [''],
      type: 'normal'
    };
  }
});

// 组件销毁前清理
onBeforeUnmount(() => {
  isComponentMounted.value = false;
  
  // 取消所有未完成的请求
  abortControllers.forEach(controller => {
    try {
      controller.abort();
    } catch (e) {
      console.error('取消请求失败:', e);
    }
  });
  
  console.log('Notes组件卸载完成');
});

// 安全获取图片URL
function getSafeImageUrl(post: any) {
  if (!post) return '';
  if (post.cover) return post.cover;
  if (post.images && post.images.length > 0 && post.images[0]) {
    if (typeof post.images[0] === 'string') {
      return post.images[0];
    } else if (typeof post.images[0] === 'object' && post.images[0].url) {
      return post.images[0].url;
    }
  }
  return '';
}

// 图片加载错误处理
function handleImageError(event: Event) {
  const img = event.target;
  if (img && img instanceof HTMLImageElement) {
    img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"%3E%3Crect width="300" height="200" fill="%23f0f0f0"/%3E%3Ctext x="50%25" y="50%25" font-family="Arial" font-size="16" fill="%23999" text-anchor="middle" dominant-baseline="middle"%3E暂无图片%3C/text%3E%3C/svg%3E';
  }
}

// 格式化日期
function formatDate(dateString: string) {
  if (!dateString) return '未知日期';
  try {
    return new Date(dateString).toLocaleDateString();
  } catch (e) {
    return '未知日期';
  }
}

// 打开模态框
const openModal = () => {
  showModal.value = true;
};

// 打开详情弹窗
function openDetailModal(post: any) {
  currentPostId.value = post.id;
  showDetailModal.value = true;
}

// 关闭详情弹窗
function closeDetailModal() {
  showDetailModal.value = false;
  currentPostId.value = null;
}

// 笔记卡片点击处理
function handleCardClick(post: any, event: MouseEvent) {
  // 检查点击事件的目标是否为按钮，如果是则不打开详情
  const target = event.target as HTMLElement;
  if (target.closest('button') || target.closest('.action-menu')) return;

  // 否则打开详情弹窗
  openDetailModal(post);
}

// 组件挂载 - 额外保障，防止自执行初始化失败
onMounted(() => {
  isComponentMounted.value = true;
  
  // 如果自执行初始化失败，在挂载时再次尝试初始化
  if (!isInitialized.value || posts.value.length === 0) {
    initializeComponent();
  }
});

// 批量处理文件上传
async function handleBatchUpload(event: Event) {
  const target = event.target as HTMLInputElement;
  if (!target.files || target.files.length === 0) return;
  
  const files = Array.from(target.files);
  const nonEmptyImagesCount = newPost.value.images.filter(img => img.trim() !== '').length;
  const maxFiles = 9 - nonEmptyImagesCount;
  
  // 检查是否已达到最大上传数量
  if (maxFiles <= 0) {
    message?.warning('已达到最大上传数量(9张)，无法继续上传');
    if (target) target.value = '';
    return;
  }
  
  if (files.length > maxFiles) {
    message?.warning(`最多还能添加${maxFiles}张图片`);
    files.splice(maxFiles);
  }
  
  // 验证文件类型和大小
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  const maxSize = 5 * 1024 * 1024; // 5MB
  
  // 显示加载状态
  submitting.value = true;
  message?.info(`正在上传${files.length}张图片...`);
  
  try {
    // 创建足够的图片输入框
    while (newPost.value.images.length < 9 && 
           newPost.value.images.filter(img => img === '').length < files.length) {
      addImageInput();
    }
    
    // 找到所有空的图片输入框索引
    const emptySlots = newPost.value.images
      .map((img, index) => img === '' ? index : -1)
      .filter(index => index !== -1)
      .slice(0, files.length);
    
    // 并行上传所有文件
    const uploadPromises = files.map(async (file, fileIndex) => {
      const slotIndex = emptySlots[fileIndex];
      
      // 验证文件类型
      if (!allowedTypes.includes(file.type)) {
        console.warn(`文件 ${file.name} 不是支持的图片格式`);
        return null;
      }
      
      // 验证文件大小
      if (file.size > maxSize) {
        console.warn(`文件 ${file.name} 超过5MB大小限制`);
        return null;
      }
      
      try {
        // 显示本地预览
        const localPreviewUrl = URL.createObjectURL(file);
        newPost.value.images[slotIndex] = localPreviewUrl;
        
        // 上传到服务器
        const response = await uploadImageAPI(file);
        if (response && response.data) {
          const imageUrl = response.data.url || response.data;
          newPost.value.images[slotIndex] = imageUrl;
          return { success: true, index: slotIndex };
        } else {
          newPost.value.images[slotIndex] = '';
          return { success: false, index: slotIndex };
        }
      } catch (error) {
        newPost.value.images[slotIndex] = '';
        return { success: false, index: slotIndex };
      }
    });
    
    const results = await Promise.all(uploadPromises);
    const successCount = results.filter(r => r && r.success).length;
    
    if (successCount > 0) {
      message?.success(`成功上传${successCount}张图片`);
    }
    
    if (successCount < files.length) {
      message?.warning(`${files.length - successCount}张图片上传失败`);
    }
  } catch (error) {
    console.error('批量上传出错', error);
    message?.error('图片上传失败，请稍后重试');
  } finally {
    submitting.value = false;
    if (target) target.value = '';
  }
}

// 处理单个文件上传
async function handleFileUpload(event: Event, index: number) {
  const target = event.target as HTMLInputElement;
  if (!target.files || target.files.length === 0) return;
  
  const file = target.files[0];
  
  // 验证文件类型
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    message?.error('只支持上传 JPG/PNG/GIF/WEBP 格式的图片');
    return;
  }
  
  // 验证文件大小（最大5MB）
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    message?.error('图片大小不能超过5MB');
    return;
  }
  
  try {
    // 显示预览（使用本地URL）
    const localPreviewUrl = URL.createObjectURL(file);
    newPost.value.images[index] = localPreviewUrl;
    
    // 上传文件到服务器
    const response = await uploadImageAPI(file);
    if (response && response.data) {
      // 使用服务器返回的URL替换本地预览URL
      const imageUrl = response.data.url || response.data;
      newPost.value.images[index] = imageUrl;
      message?.success('图片上传成功');
    } else {
      // 上传失败，恢复空字符串
      newPost.value.images[index] = '';
      message?.error('图片上传失败');
    }
  } catch (error) {
    newPost.value.images[index] = '';
    message?.error('图片上传失败，请稍后重试');
  } finally {
    // 清除input的value，使得相同文件可以再次选择
    if (target) target.value = '';
  }
}

// 显示二维码弹窗
function showQRCode(post?: any, event?: Event) {
  // 如果传入了事件对象，阻止事件冒泡
  if (event) {
    event.stopPropagation();
  }
  
  // 如果传入了post参数，显示笔记二维码
  if (post) {
    currentQRCodePost.value = post;
  } 
  // 否则显示活动二维码
  else if (activityId.value) {
    currentQRCodePost.value = {
      id: activityId.value,
      title: activityName.value || '活动二维码'
    };
  } else {
    message?.warning('当前没有活动ID或未选择笔记');
    return;
  }
  
  // 关闭菜单
  activeActionMenu.value = null;
  
  showQRCodeModal.value = true;
}

// 关闭二维码弹窗
function closeQRCodeModal() {
  showQRCodeModal.value = false;
  currentQRCodePost.value = null;
}

// 获取分享链接
function getShareLink() {
  if (!currentQRCodePost.value) return '';
  return `${window.location.origin}/chat#/xhs-auto-api?identifier=${currentQRCodePost.value.id}`;
}

// 复制分享链接到剪贴板
function copyShareLink() {
  const link = getShareLink();
  
  navigator.clipboard.writeText(link)
    .then(() => {
      message?.success('链接已复制到剪贴板');
    })
    .catch((err) => {
      console.error('复制失败:', err);
      message?.error('复制失败，请手动复制');
    });
}

// 选择导入文件
function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement;
  if (!target.files || target.files.length === 0) return;
  
  const file = target.files[0];
  
  // 验证文件类型
  const validTypes = [
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];
  
  if (!validTypes.includes(file.type)) {
    message?.error('请上传Excel文件（.xls或.xlsx格式）');
    target.value = '';
    return;
  }
  
  importFile.value = file;
}

// 关闭导入模态框
function closeImportModal() {
  showImportModal.value = false;
  importFile.value = null;
  importResult.value = null;
  importProgress.value = 0;
}

// 下载导入模板
async function downloadTemplate() {
  try {
    const blob = await downloadXhsAutoTemplateAPI();
    
    if (!blob || blob.size === 0) {
      message?.error('下载模板失败：获取到的数据为空');
      return;
    }
    
    // 创建临时链接并触发下载
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', '小红书笔记导入模板.xlsx');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    message?.success('模板下载成功');
  } catch (error: any) {
    message?.error(error.message || '下载模板失败，请稍后重试');
  }
}

// 提交导入请求
async function submitImport() {
  if (!importFile.value) {
    message?.warning('请先选择Excel文件');
    return;
  }
  
  try {
    importLoading.value = true;
    importProgress.value = 10;
    
    // 模拟上传进度
    const progressInterval = setInterval(() => {
      if (importProgress.value < 90) {
        importProgress.value += Math.floor(Math.random() * 10);
      }
    }, 500);
    
    const response = await importExcelAPI(importFile.value);
    
    clearInterval(progressInterval);
    importProgress.value = 100;
    
    if (response && response.data) {
      // 假设后端返回导入结果统计信息
      const resultData = response.data;
      importResult.value = {
        success: resultData.success || 0,
        fail: resultData.fail || 0,
        total: resultData.total || 0,
        errors: resultData.errors || []
      };
      
      if (importResult.value.success > 0) {
        message?.success(`成功导入${importResult.value.success}条笔记`);
        
        // 刷新笔记列表
        refreshTrigger.value += 1;
      }
      
      if (importResult.value.fail > 0) {
        message?.warning(`${importResult.value.fail}条笔记导入失败`);
      }
    } else {
      message?.error('导入失败，请检查文件格式');
    }
  } catch (error) {
    console.error('导入Excel出错', error);
    message?.error('导入失败，请稍后重试');
  } finally {
    importLoading.value = false;
  }
}

// 删除重复函数

// 添加控制下拉菜单的状态
const activeActionMenu = ref<string | number | null>(null);

// 切换操作菜单显示状态
function toggleActionMenu(postId: string | number, event: Event) {
  event.stopPropagation(); // 阻止事件冒泡到卡片
  
  if (activeActionMenu.value === postId) {
    activeActionMenu.value = null;
  } else {
    activeActionMenu.value = postId;
  }
}

// 点击页面其他区域关闭操作菜单
function closeAllActionMenus(event: MouseEvent) {
  const target = event.target as HTMLElement;
  if (!target.closest('.action-menu') && !target.closest('button')) {
    activeActionMenu.value = null;
  }
}

// 监听全局点击以关闭操作菜单
onMounted(() => {
  document.addEventListener('click', closeAllActionMenus);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', closeAllActionMenus);
});
</script>

<template>
  <div class="xhs-notes-container">
    <div class="notes-header">
      <!-- 活动名称显示区域 -->
      <div v-if="activityId" class="mb-4 flex justify-between items-center bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div class="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <h2 class="text-lg font-medium text-gray-800 dark:text-gray-200">
            <span v-if="titleLoading" class="inline-block w-24 h-6 bg-gray-200 dark:bg-gray-700 animate-pulse rounded"></span>
            <span v-else class="flex items-center">
              当前活动: {{ activityName || (activityId === 'default' ? '日常使用' : activityId) }}
              <span v-if="activityId === 'default'" class="ml-2 text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full">默认</span>
            </span>
          </h2>
        </div>
        <button 
          @click="goBackToActivities" 
          class="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 text-sm flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          返回活动列表
        </button>
      </div>
      
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
        <div class="search-box flex items-center w-full sm:w-auto">
          <input
            type="text"
            :value="searchText"
            @input="handleSearchInput"
            placeholder="搜索笔记..."
            class="w-full sm:w-64 px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white input-field"
          />
        </div>
        
        <div class="flex flex-wrap gap-2 justify-end w-full sm:w-auto">
          <!-- 添加二维码按钮 -->
          <button 
            @click="showQRCode()" 
            class="flex items-center px-3 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg transition-colors shadow-sm text-sm sm:text-base"
          >
            <ScanCode theme="filled" class="mr-1 sm:mr-2" size="16" />
            <span class="hidden sm:inline">查看活动二维码</span>
            <span class="sm:hidden">笔记二维码</span>
          </button>
          
          <button
            type="button"
            @click="showImportModal = true"
            class="import-btn flex items-center px-3 py-2 text-sm sm:text-base"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clip-rule="evenodd" />
            </svg>
            <span class="hidden sm:inline">Excel导入</span>
            <span class="sm:hidden">导入</span>
          </button>
          
          <button
            type="button"
            @click="openModal"
            class="add-note-btn flex items-center px-3 py-2 text-sm sm:text-base"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clip-rule="evenodd" />
            </svg>
            <span class="hidden sm:inline">添加笔记</span>
            <span class="sm:hidden">添加</span>
          </button>
        </div>
      </div>
      
      <div class="flex items-center text-sm text-gray-500 mb-4">
        <span class="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" />
          </svg>
          {{ authStore?.userInfo?.username || '未登录' }}
        </span>
        <span class="ml-4 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clip-rule="evenodd" />
          </svg>
          {{ filteredPosts.length }}
        </span>
        <button
          type="button"
          @click="refreshList"
          class="ml-2 text-xs text-blue-500 hover:text-blue-600 flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 100-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd" />
          </svg>
          刷新
        </button>
      </div>
    </div>
    
    <!-- 笔记列表 -->
    <div class="notes-list">
      <div v-if="loading" class="text-center py-10">
        <div class="spinner"></div>
        <p class="mt-2 text-gray-500">加载中...</p>
      </div>
      
      <div v-else-if="filteredPosts.length === 0" class="text-center py-10">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
        <p class="text-gray-500 mt-4">暂无笔记</p>
        <p class="text-gray-500 mt-2">
          点击"添加笔记"按钮创建您的第一条笔记
        </p>
      </div>
      
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <div
          v-for="post in filteredPosts"
          :key="`${post.id}-${refreshTrigger}`"
          class="note-card"
          @click="handleCardClick(post, $event)"
        >
          <div class="note-card-header relative">
            <img
              :src="getSafeImageUrl(post) || 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'300\' height=\'200\' viewBox=\'0 0 300 200\'%3E%3Crect width=\'300\' height=\'200\' fill=\'%23f0f0f0\'/%3E%3Ctext x=\'50%25\' y=\'50%25\' font-family=\'Arial\' font-size=\'16\' fill=\'%23999\' text-anchor=\'middle\' dominant-baseline=\'middle\'%3E暂无图片%3C/text%3E%3C/svg%3E'"
              alt="Cover"
              class="w-full h-40 object-cover"
              @error="handleImageError"
            />
            <div
              class="absolute top-2 right-2 px-2 py-1 text-xs rounded-full status-label"
              :class="post.isDiscarded ? 'discarded' : post.isUsed ? 'used' : 'unused'"
            >
              {{ post.isDiscarded ? '已弃用' : post.isUsed ? '已使用' : '未使用' }}
            </div>
            <div class="absolute top-2 left-2 flex flex-col space-y-1">
              <div 
                v-if="post.isUsed" 
                class="px-2 py-1 text-xs rounded-full platform-label xhs"
                title="小红书已发布"
              >
                <span class="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 mr-1" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                  小红书
                </span>
              </div>
              <div 
                v-if="post.douyinUsed" 
                class="px-2 py-1 text-xs rounded-full platform-label douyin"
                title="抖音已发布"
              >
                <span class="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 mr-1" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                  抖音
                </span>
              </div>
            </div>
          </div>
          
          <div class="note-card-body p-4">
            <h3 class="font-bold text-lg mb-1 truncate">{{ post.title || '无标题' }}</h3>
            <p class="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">{{ post.content || '无内容' }}</p>
            
            <div class="note-card-footer flex justify-between items-center text-sm text-gray-500">
              <span class="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd" />
                </svg>
                {{ formatDate(post.createTime) }}
              </span>
              
              <div class="relative action-container">
                <button 
                  @click="toggleActionMenu(post.id, $event)" 
                  class="text-gray-500 hover:text-gray-700 flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                  </svg>
                  <span class="ml-1">操作</span>
                </button>
                
                <!-- 菜单 -->
                <div 
                  v-if="activeActionMenu === post.id"
                  class="action-menu"
                  @click.stop=""
                >
                  <button
                    type="button"
                    @click.stop="showQRCode(post, $event)"
                    class="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                    title="显示分享二维码"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2 text-purple-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 100 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clip-rule="evenodd" />
                    </svg>
                    二维码
                  </button>
                  
                  <button
                    v-if="!post.isUsed && !post.isDiscarded"
                    type="button"
                    @click.stop="markAsUsed(post.id)"
                    class="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                    </svg>
                    小红书发布
                  </button>
                  
                  <button
                    v-if="!post.douyinUsed && !post.isDiscarded"
                    type="button"
                    @click.stop="markAsDouyinUsed(post.id)"
                    class="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2 text-black" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                    </svg>
                    抖音发布
                  </button>
                  
                  <button
                    v-if="!post.isUsed && !post.isDiscarded"
                    type="button"
                    @click.stop="markAsDiscarded(post.id)"
                    class="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                    </svg>
                    标记弃用
                  </button>
                  
                  <button
                    type="button"
                    @click.stop="deletePost(post.id)"
                    class="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                    </svg>
                    删除
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 添加笔记弹窗 -->
    <div v-if="showModal" class="fixed inset-0 modal-container flex items-center justify-center z-50">
      <div class="bg-white dark:bg-gray-800 modal-content w-full max-w-xl p-6 max-h-90vh overflow-y-auto">
        <div class="flex justify-between items-center mb-5">
          <h2 class="text-xl font-bold flex items-center text-gray-800 dark:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-2 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            添加小红书笔记
          </h2>
          <button 
            type="button"
            @click="showModal = false" 
            class="text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-white transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div class="form-group mb-5">
          <label class="block mb-2 font-medium text-gray-700 dark:text-white">标题</label>
          <input
            v-model="newPost.title"
            type="text"
            class="w-full px-4 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white input-field focus:outline-none"
            placeholder="输入笔记标题"
          />
        </div>
        
        <div class="form-group mb-5">
          <label class="block mb-2 font-medium text-gray-700 dark:text-white">内容</label>
          <textarea
            v-model="newPost.content"
            rows="6"
            class="w-full px-4 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white input-field focus:outline-none"
            placeholder="输入笔记内容"
          ></textarea>
        </div>
        
        <div class="form-group mb-5">
          <label class="block mb-2 font-medium text-gray-700 dark:text-white">类型</label>
          <div class="flex gap-4">
            <label class="flex items-center text-gray-700 dark:text-gray-200">
              <input
                type="radio"
            v-model="newPost.type"
                value="normal"
                class="mr-2 text-pink-500 focus:ring-pink-500"
              />
              <span>图文</span>
            </label>
            <label class="flex items-center text-gray-700 dark:text-gray-200">
              <input
                type="radio"
                v-model="newPost.type"
                value="video"
                class="mr-2 text-pink-500 focus:ring-pink-500"
              />
              <span>视频</span>
            </label>
          </div>
        </div>
        
        <div class="form-group mb-5">
          <div class="flex justify-between items-center mb-4">
            <div class="flex items-center">
              <label class="font-medium text-gray-700 dark:text-white">图片</label>
              <span class="ml-2 text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full">
                {{ newPost.images.filter(img => img.trim() !== '').length }}/9
              </span>
            </div>
            <div class="flex items-center space-x-2">
              <label class="batch-upload-btn text-xs px-3 py-1 rounded-full flex items-center"
                :class="{ 'opacity-50 cursor-not-allowed': newPost.images.filter(img => img.trim() !== '').length >= 9 }">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                </svg>
                批量上传
                <input 
                  type="file" 
                  class="hidden"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  multiple
                  @change="handleBatchUpload"
                  :disabled="newPost.images.filter(img => img.trim() !== '').length >= 9"
                />
              </label>
            <button
                type="button"
              @click="addImageInput"
                class="text-xs bg-pink-50 text-pink-600 dark:bg-pink-900 dark:text-pink-200 px-3 py-1 rounded-full hover:bg-pink-100 dark:hover:bg-pink-800 transition-colors flex items-center"
                :disabled="newPost.images.length >= 9"
                :class="{ 'opacity-50 cursor-not-allowed': newPost.images.length >= 9 }"
            >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clip-rule="evenodd" />
                </svg>
                添加图片
            </button>
            </div>
          </div>
          
          <div class="image-slots-container">
          <div
            v-for="(image, index) in newPost.images"
              :key="`img-${index}-${refreshTrigger}`"
              class="mb-5 image-upload-item"
          >
              <div class="flex items-center mb-2">
                <div class="image-index-badge">{{ index + 1 }}</div>
              <input
                v-model="newPost.images[index]"
                type="text"
                  class="flex-1 px-4 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white input-field focus:outline-none"
                  placeholder="输入图片URL或上传图片"
                />
                <label class="upload-btn ml-2" :title="`上传第${index + 1}张图片`">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd" />
                  </svg>
                  <input 
                    type="file" 
                    class="hidden"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    @change="(event) => handleFileUpload(event, index)"
                  />
                </label>
              <button
                  type="button"
                v-if="newPost.images.length > 1"
                @click="removeImageInput(index)"
                  class="ml-2 text-red-500 hover:text-red-600 transition-colors"
                  :title="`删除第${index + 1}张图片`"
              >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                  </svg>
              </button>
            </div>
            
              <div class="flex items-center" v-if="newPost.images[index]">
                <div class="image-preview">
                <img 
                  :src="newPost.images[index]" 
                    class="h-20 w-20 object-cover"
                  alt="Preview"
                    @error="handleImageError"
                />
                </div>
              </div>
            </div>
          </div>
          
          <div class="text-xs text-gray-500 dark:text-gray-400 mt-2">
            支持JPG/PNG/GIF/WEBP格式，单张图片不超过5MB，最多上传9张图片
          </div>
        </div>
        
        <div class="flex justify-end">
          <button
            type="button"
            @click="showModal = false"
            class="px-5 py-2 border border-gray-300 rounded-md mr-3 hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700 cancel-btn transition-colors text-white"
            :disabled="submitting"
          >
            取消
          </button>
          <button
            type="button"
            @click="handleSubmit"
            class="px-5 py-2 bg-pink-500 text-white rounded-md hover:bg-pink-600 submit-btn transition-colors"
            :disabled="submitting"
          >
            <span v-if="submitting" class="flex items-center">
              <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              保存中...
            </span>
            <span v-else class="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
              </svg>
              保存
            </span>
          </button>
        </div>
      </div>
    </div>
    
    <!-- 笔记详情弹窗 -->
    <div v-if="showDetailModal" class="fixed inset-0 modal-container flex items-center justify-center z-50">
      <div class="bg-white dark:bg-gray-800 modal-content w-full max-w-5xl p-4 h-90vh">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-bold flex items-center text-gray-800 dark:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-2 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            笔记详情
          </h2>
          <button 
            type="button"
            @click="closeDetailModal" 
            class="text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-white transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div class="relative w-full h-full" style="height: calc(90vh - 70px);">
          <iframe 
            :src="detailUrl" 
            class="w-full h-full border-0 rounded-md" 
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
            referrerpolicy="no-referrer"
          ></iframe>
        </div>
      </div>
    </div>
    
    <!-- 二维码弹窗 -->
    <div v-if="showQRCodeModal" class="fixed inset-0 modal-container flex items-center justify-center z-50">
      <div class="bg-white dark:bg-gray-800 modal-content w-full max-w-md p-6 rounded-lg">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-bold flex items-center text-gray-800 dark:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-2 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 6h1m-7 7v1m-6-6H4" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5h16a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V6a1 1 0 011-1z" />
            </svg>
            分享二维码
          </h2>
          <button 
            type="button"
            @click="closeQRCodeModal" 
            class="text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-white transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div class="qrcode-container">
          <h3 class="text-center mb-2 font-medium text-gray-700 dark:text-gray-300">
            {{ currentQRCodePost?.title || '分享笔记' }}
          </h3>
          
          <div class="qrcode-wrapper mb-6">
            <img 
              :src="qrCodeURL" 
              alt="QR Code" 
              class="qrcode-image mx-auto"
              @error="handleImageError"
            />
          </div>
          
          <div class="mt-4 text-xs text-center text-gray-500 dark:text-gray-400 mb-4">
            扫描上方二维码或复制以下链接分享
          </div>
          
          <div class="share-link-container bg-gray-100 dark:bg-gray-700 p-3 rounded-md mb-5">
            <p class="text-sm text-gray-700 dark:text-gray-300 truncate">{{ getShareLink() }}</p>
          </div>
          
          <div class="flex justify-center">
            <button
              type="button"
              @click="copyShareLink"
              class="copy-link-btn flex items-center justify-center px-4 py-2 rounded-md"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
              </svg>
              复制链接
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Excel导入模态框 -->
    <div v-if="showImportModal" class="fixed inset-0 modal-container flex items-center justify-center z-50">
      <div class="bg-white dark:bg-gray-800 modal-content w-full max-w-md p-6 rounded-lg">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-bold flex items-center text-gray-800 dark:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-2 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Excel批量导入
          </h2>
          <button 
            type="button"
            @click="closeImportModal" 
            class="text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-white transition-colors"
            :disabled="importLoading"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div class="import-container">
          <!-- 未选择文件状态 -->
          <div v-if="!importFile && !importResult" class="text-center py-6">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            
            <p class="mt-4 text-gray-600 dark:text-gray-400">选择Excel文件批量导入笔记</p>
            
            <div class="mt-6 flex flex-col items-center">
              <label class="file-select-btn mb-4">
                <span class="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M8 4a3 3 0 00-3 3v4a3 3 0 006 0V7a1 1 0 112 0v4a5 5 0 01-10 0V7a5 5 0 0110 0v4a1 1 0 11-2 0V7a3 3 0 00-3-3z" clip-rule="evenodd" />
                  </svg>
                  选择Excel文件
                </span>
                <input type="file" class="hidden" accept=".xls,.xlsx" @change="handleFileSelect" />
              </label>
              
              <button
                type="button"
                @click="downloadTemplate"
                class="template-btn flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                </svg>
                下载导入模板
              </button>
            </div>
          </div>
          
          <!-- 已选择文件状态 -->
          <div v-else-if="importFile && !importResult" class="py-4">
            <div class="selected-file bg-gray-50 dark:bg-gray-700 p-4 rounded-md mb-5 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-green-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              
              <div class="flex-1 truncate">
                <div class="font-medium text-gray-800 dark:text-white truncate">{{ importFile.name }}</div>
                <div class="text-xs text-gray-500 dark:text-gray-400">{{ (importFile.size / 1024).toFixed(2) }} KB</div>
              </div>
              
              <button
                type="button"
                @click="importFile = null"
                class="ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                :disabled="importLoading"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                </svg>
              </button>
            </div>
            
            <div v-if="importLoading" class="mb-5">
              <div class="text-sm text-gray-600 dark:text-gray-400 mb-2 flex justify-between">
                <span>导入进度</span>
                <span>{{ importProgress }}%</span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                <div class="bg-green-500 h-2.5 rounded-full" :style="`width: ${importProgress}%`"></div>
              </div>
            </div>
            
            <div class="flex justify-between">
              <button
                type="button"
                @click="importFile = null"
                class="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
                :disabled="importLoading"
              >
                重新选择
              </button>
              
              <button
                type="button"
                @click="submitImport"
                class="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors flex items-center"
                :disabled="importLoading"
              >
                <svg v-if="importLoading" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>{{ importLoading ? '导入中...' : '开始导入' }}</span>
              </button>
            </div>
          </div>
          
          <!-- 导入结果状态 -->
          <div v-else-if="importResult" class="py-4">
            <div class="import-result text-center">
              <div class="icon-wrapper mx-auto mb-4" :class="importResult.success > 0 ? 'success' : 'error'">
                <svg v-if="importResult.success > 0" xmlns="http://www.w3.org/2000/svg" class="h-12 w-12" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-12 w-12" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                </svg>
              </div>
              
              <h3 class="text-lg font-medium mb-4 text-gray-800 dark:text-white">
                {{ importResult.success > 0 ? '导入完成' : '导入失败' }}
              </h3>
              
              <div class="result-stats grid grid-cols-3 gap-4 mb-6">
                <div class="stat-item bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
                  <div class="text-xl font-bold text-gray-800 dark:text-white">{{ importResult.total }}</div>
                  <div class="text-xs text-gray-500 dark:text-gray-400">总条数</div>
                </div>
                <div class="stat-item bg-green-50 dark:bg-green-900 p-3 rounded-md">
                  <div class="text-xl font-bold text-green-600 dark:text-green-300">{{ importResult.success }}</div>
                  <div class="text-xs text-green-500 dark:text-green-400">成功</div>
                </div>
                <div class="stat-item bg-red-50 dark:bg-red-900 p-3 rounded-md">
                  <div class="text-xl font-bold text-red-600 dark:text-red-300">{{ importResult.fail }}</div>
                  <div class="text-xs text-red-500 dark:text-red-400">失败</div>
                </div>
              </div>
              
              <div v-if="importResult.errors && importResult.errors.length > 0" class="error-details mb-5">
                <div class="text-sm font-medium text-red-500 dark:text-red-400 mb-2 text-left">错误详情：</div>
                <div class="errors-box bg-red-50 dark:bg-red-900/30 p-3 rounded-md text-left max-h-40 overflow-y-auto text-sm">
                  <div v-for="(error, index) in importResult.errors" :key="index" class="text-red-600 dark:text-red-300 mb-1">
                    {{ error }}
                  </div>
                </div>
              </div>
              
              <div class="flex justify-center space-x-4">
                <button
                  type="button"
                  @click="closeImportModal"
                  class="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  关闭
                </button>
                
                <button
                  type="button"
                  @click="importFile = null; importResult = null"
                  class="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
                >
                  继续导入
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.xhs-notes-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

/* 添加笔记按钮样式优化 */
.add-note-btn {
  background: linear-gradient(135deg, #ff2442, #ff6a6a);
  border: none;
  color: white;
  font-weight: 500;
  padding: 8px 16px;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(255, 36, 66, 0.2);
  transition: all 0.3s ease;
}

.add-note-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 10px rgba(255, 36, 66, 0.3);
}

/* 移动端按钮响应式样式 */
@media (max-width: 640px) {
  .add-note-btn, .import-btn, button {
    padding: 6px 12px;
    min-width: 80px;
    justify-content: center;
  }
  
  .search-box input {
    font-size: 14px;
    padding: 6px 12px;
  }
  
  .xhs-notes-container {
    padding: 10px;
  }
}

/* 模态框样式优化 */
.modal-container {
  background-color: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(4px);
}

.modal-content {
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.1);
  max-width: 600px;
}

/* 输入框样式优化 */
.input-field {
  transition: border-color 0.3s, box-shadow 0.3s;
  border-radius: 8px;
}

.input-field:focus {
  border-color: #ff2442;
  box-shadow: 0 0 0 2px rgba(255, 36, 66, 0.2);
}

/* 按钮样式优化 */
.submit-btn {
  background: linear-gradient(135deg, #ff2442, #ff6a6a);
  border: none;
  font-weight: 500;
}

.submit-btn:hover {
  background: linear-gradient(135deg, #ff1a3a, #ff5252);
}

.cancel-btn {
  background-color: #4b5563;
  color: white;
}

.cancel-btn:hover {
  background-color: #374151;
  color: white;
}

/* 图片预览区域优化 */
.image-preview {
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e5e7eb;
  transition: all 0.3s ease;
}

.image-preview:hover {
  transform: scale(1.02);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

/* 笔记卡片样式优化 */
.note-card {
  border-radius: 12px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  border: 1px solid #eee;
  position: relative;
}

.note-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
}

.note-card-header img {
  transition: transform 0.5s ease;
}

.note-card:hover .note-card-header img {
  transform: scale(1.05);
}

/* 状态标签样式优化 */
.status-label {
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.5px;
  padding: 4px 8px;
  border-radius: 20px;
}

.status-label.unused {
  background-color: #10b981;
}

.status-label.used {
  background-color: #6b7280;
}

.status-label.discarded {
  background-color: #f59e0b;
}

.spinner {
  border: 4px solid rgba(255, 36, 66, 0.1);
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border-left-color: #ff2442;
  animation: spin 1s linear infinite;
  margin: 0 auto;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.max-h-90vh {
  max-height: 90vh;
}

/* 详情弹窗样式 */
.h-90vh {
  height: 90vh;
}

/* 详情弹窗样式 */
.modal-content {
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

/* 上传按钮样式 */
.upload-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background-color: #f3f4f6;
  color: #6b7280;
  border-radius: 5px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.upload-btn:hover {
  background-color: #e5e7eb;
  color: #374151;
}

.dark .upload-btn {
  background-color: #4b5563;
  color: #e5e7eb;
}

.dark .upload-btn:hover {
  background-color: #6b7280;
  color: #f9fafb;
}

.image-upload-item {
  border: 1px solid #f3f4f6;
  border-radius: 8px;
  padding: 10px;
  background-color: rgba(249, 250, 251, 0.5);
}

.dark .image-upload-item {
  border-color: #374151;
  background-color: rgba(55, 65, 81, 0.3);
}

/* 批量上传按钮样式 */
.batch-upload-btn {
  background: linear-gradient(135deg, #8854d0, #a55eea);
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.batch-upload-btn:hover {
  background: linear-gradient(135deg, #7b47c1, #9850d9);
  transform: translateY(-1px);
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.15);
}

/* 图片输入项编号徽章 */
.image-index-badge {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background-color: #ff2442;
  color: white;
  font-size: 12px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 8px;
}

.image-slots-container {
  max-height: 300px;
  overflow-y: auto;
  padding-right: 5px;
}

.image-slots-container::-webkit-scrollbar {
  width: 5px;
}

.image-slots-container::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 10px;
}

.image-slots-container::-webkit-scrollbar-thumb {
  background: #ff2442;
  border-radius: 10px;
}

.dark .image-slots-container::-webkit-scrollbar-track {
  background: #374151;
}

/* 二维码样式 */
.qrcode-container {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.qrcode-wrapper {
  padding: 20px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
  width: fit-content;
  margin: 0 auto 16px;
  border: 1px solid #f3f4f6;
}

.dark .qrcode-wrapper {
  border-color: #374151;
}

.qrcode-image {
  width: 200px;
  height: 200px;
  object-fit: contain;
  border-radius: 4px;
}

.copy-link-btn {
  background: linear-gradient(135deg, #a55eea, #8854d0);
  color: white;
  font-weight: 500;
  transition: all 0.3s ease;
  border: none;
  box-shadow: 0 4px 6px rgba(165, 94, 234, 0.25);
}

.copy-link-btn:hover {
  background: linear-gradient(135deg, #9152d0, #7546c0);
  transform: translateY(-2px);
  box-shadow: 0 6px 10px rgba(165, 94, 234, 0.3);
}

.share-link-container {
  width: 100%;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
}

.dark .share-link-container {
  border-color: #4b5563;
}

/* Excel导入按钮样式 */
.import-btn {
  background: linear-gradient(135deg, #18a058, #36ad6a);
  border: none;
  color: white;
  font-weight: 500;
  padding: 8px 16px;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(24, 160, 88, 0.2);
  transition: all 0.3s ease;
}

.import-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 10px rgba(24, 160, 88, 0.3);
}

/* 文件选择按钮 */
.file-select-btn {
  display: inline-flex;
  background: linear-gradient(135deg, #18a058, #36ad6a);
  color: white;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  box-shadow: 0 4px 6px rgba(24, 160, 88, 0.2);
  transition: all 0.3s ease;
}

.file-select-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 10px rgba(24, 160, 88, 0.3);
}

/* 模板下载按钮 */
.template-btn {
  background-color: transparent;
  color: #18a058;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  border: 1px solid #18a058;
  transition: all 0.3s ease;
}

.template-btn:hover {
  background-color: rgba(24, 160, 88, 0.1);
}

.dark .template-btn {
  color: #36ad6a;
  border-color: #36ad6a;
}

.dark .template-btn:hover {
  background-color: rgba(54, 173, 106, 0.1);
}

/* 导入结果图标样式 */
.icon-wrapper {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-wrapper.success {
  background-color: rgba(24, 160, 88, 0.1);
  color: #18a058;
}

.icon-wrapper.error {
  background-color: rgba(237, 47, 47, 0.1);
  color: #ed2f2f;
}

.dark .icon-wrapper.success {
  background-color: rgba(54, 173, 106, 0.2);
  color: #36ad6a;
}

.dark .icon-wrapper.error {
  background-color: rgba(244, 67, 54, 0.2);
  color: #f44336;
}

.title-transition {
  transition: all 0.3s ease-in-out;
  min-height: 28px; /* 确保高度稳定，防止闪烁 */
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

/* 添加平台状态标签 */
.platform-label {
  font-size: 0.65rem;
  font-weight: 600;
  letter-spacing: 0.5px;
  background-color: rgba(0, 0, 0, 0.5);
  color: white;
  backdrop-filter: blur(4px);
}

.platform-label.xhs {
  background-color: rgba(255, 36, 66, 0.7);
}

.platform-label.douyin {
  background-color: rgba(0, 0, 0, 0.7);
}

/* 添加额外的样式 */
.action-menu {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08);
  transform-origin: top right;
  animation: menu-appear 0.1s ease-out;
  border: 1px solid rgba(0, 0, 0, 0.1);
  z-index: 1000;
  position: absolute;
  right: 0;
  bottom: 100%;
  margin-bottom: 10px;
  width: 150px;
  background-color: white;
  border-radius: 0.375rem;
  padding-top: 0.25rem;
  padding-bottom: 0.25rem;
}

.dark .action-menu {
  background-color: #1f2937; /* dark:bg-gray-800 */
  border-color: rgba(255, 255, 255, 0.1);
}

.action-menu button {
  transition: all 0.15s ease;
}

.action-menu button:hover svg {
  transform: translateX(2px);
}

@keyframes menu-appear {
  0% {
    opacity: 0;
    transform: scale(0.95);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

/* 操作按钮容器样式 */
.action-container {
  position: relative;
}

.note-card-header {
  overflow: hidden;
}
</style> 