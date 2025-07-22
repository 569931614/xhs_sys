<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { getTaskResultAPI } from '@/api/xhsProductFactory';
import { ScanCode } from '@icon-park/vue-next';
import { Task } from '../types';

// 导出事件类型定义
export type ModalDialogsEvents = {
  'close-qr-modal': [];
  'close-note-detail-modal': [];
  'view-note-detail': [task: Task];
  'iframe-loaded': [];
  'iframe-error': [event?: Event];
  'error': [message: string];
  'qr-load-error': [task: Task];
  'change-platform': [platform: 'all' | 'xhs' | 'douyin'];
  'share-to-xhs': [task: Task];
};

// 定义组件 props
const props = defineProps<{
  // 二维码弹窗
  showQrModal: boolean;
  currentQrUrl: string;
  currentQrTask: Task | null;
  
  // 笔记详情弹窗
  showNoteDetailModal: boolean;
  currentNoteId: string;
  noteDetailLoading: boolean;
  noteDetailError: string;
}>();

// 定义组件 emit
const emit = defineEmits<{
  (e: 'close-qr-modal'): void;
  (e: 'close-note-detail-modal'): void;
  (e: 'view-note-detail', task: Task): void;
  (e: 'iframe-loaded'): void;
  (e: 'iframe-error', event?: Event): void;
  (e: 'error', message: string): void;
  (e: 'qr-load-error', task: Task): void;
  (e: 'change-platform', platform: 'all' | 'xhs' | 'douyin'): void;
  (e: 'share-to-xhs', task: Task): void;
}>();

// 关闭二维码弹窗
function closeQrModal() {
  emit('close-qr-modal');
}

// 关闭笔记详情弹窗
function closeNoteDetailModal() {
  emit('close-note-detail-modal');
}

// 查看笔记详情
function viewNoteDetail() {
  if (props.currentQrTask && props.currentQrTask.result) {
    emit('view-note-detail', props.currentQrTask);
  }
}

// iframe加载完成的处理函数
function handleIframeLoaded() {
  emit('iframe-loaded');
}

// iframe加载失败的处理函数
function handleIframeError(event?: Event) {
  emit('iframe-error', event);
}

// 图片加载错误处理
function handleImageError() {
  console.error('二维码图片加载失败:', props.currentQrUrl);
  
  // 添加延迟防止过快处理
  setTimeout(() => {
    // 检查二维码URL是否正确包含前缀
    const qrServicePrefix1 = 'https://xhs.aivip1.top/api/html-render/qrcode?data=';
    const qrServicePrefix2 = 'https://chart.googleapis.com/chart?cht=qr&chs=300x300&chl=';
    
    // 先检查URL完整性
    if (props.currentQrUrl) {
      // 检查是否缺少正确前缀
      if (!props.currentQrUrl.startsWith('http')) {
        console.error('二维码URL缺少http前缀:', props.currentQrUrl);
        
        // 检查是否是相对URL路径
        if (props.currentQrUrl.includes('/chat#/xhs-auto-api')) {
          // 这是一个未编码的分享链接，而不是二维码URL
          const shareLink = props.currentQrUrl;
          const encodedLink = encodeURIComponent(shareLink);
          
          // 通知父组件
          emit('error', '正在修复二维码URL格式');
          
          // 重建完整的二维码URL
          const fixedUrl = `${qrServicePrefix1}${encodedLink}`;
          console.log('修复后的二维码URL:', fixedUrl);
          
          // 通知父组件更新URL
          if (props.currentQrTask) {
            // 设置修复后的URL
            props.currentQrTask.result = props.currentQrTask.result || {};
            props.currentQrTask.result.qrCode = fixedUrl;
            
            // 发射事件让父组件处理
            emit('qr-load-error', props.currentQrTask);
            return;
          }
        }
      }
    }
    
  // 如果当前URL是使用api.qrserver.com，尝试使用谷歌的Chart API作为备用
  if (props.currentQrUrl && props.currentQrUrl.includes('api.qrserver.com')) {
    try {
      // 提取当前的数据部分
      const dataParam = props.currentQrUrl.split('data=')[1];
      if (dataParam) {
        // 通知父组件图片加载失败
        emit('error', '二维码加载失败，正在尝试使用备用服务');
        
        // 如果父组件有处理方法，让父组件来切换URL
        if (props.currentQrTask) {
          emit('qr-load-error', props.currentQrTask);
            return; // 确保处理只进行一次
        }
      }
    } catch (error) {
      console.error('处理备用二维码服务失败:', error);
    }
  }
    
    // 无法处理时，主动显示文本链接
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    let shareLink = '';
    
    // 尝试构建分享链接
    if (props.currentQrTask) {
      if (props.currentQrTask.noteId) {
        shareLink = `${origin}/chat#/xhs-auto-api?id=${props.currentQrTask.noteId}`;
      } else if (props.currentQrTask.activityId) {
        shareLink = `${origin}/chat#/xhs-auto-api?identifier=${props.currentQrTask.activityId}`;
      } else if (props.currentQrTask.id?.startsWith('activity_')) {
        const activityId = props.currentQrTask.id.replace('activity_', '');
        shareLink = `${origin}/chat#/xhs-auto-api?identifier=${activityId}`;
      }
      
      // 如果成功创建链接，显示文本链接
      if (shareLink) {
        showTextLink(shareLink);
      }
    }
  }, 100);
}

// 定义任务接口
interface Note {
  title: string;
  content: string;
  noteId?: string;
  images?: string[];
  qrCode?: string;
}

// 二维码弹窗
const showQrModal = ref(false);
const qrUrl = ref('');
const currentQrTask = ref<Task | null>(null);

// 笔记详情弹窗
const showNoteDetailModal = ref(false);
const currentNote = ref<Note | null>(null);
const currentNoteId = ref('');
const noteDetailLoading = ref(false);
const noteDetailError = ref('');

// 在定义组件ref的位置附近，添加文本链接相关状态
const textShareLink = ref('');
const showTextLinkInsteadOfQr = ref(false);
const copySuccess = ref(false);
const publishImmediately = ref(false);
// 添加二维码图片加载状态
const qrImageLoading = ref(true);
const qrImageError = ref(false);
// 添加强制刷新标记
const forceRefresh = ref(0);

// 在script标签中添加平台选择的响应式变量和方法
const selectedPlatform = ref('all');

// 检测是否为移动设备
const isMobileDevice = ref(false);

// 在组件挂载时检测设备类型
onMounted(() => {
  isMobileDevice.value = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  console.log('设备类型检测：', isMobileDevice.value ? '移动设备' : '电脑设备');
});

// 平台切换方法
function changePlatform(platform: 'all' | 'xhs' | 'douyin') {
  selectedPlatform.value = platform;
  
  // 更新当前任务对象中的平台信息
  if (props.currentQrTask && props.currentQrTask.result) {
    props.currentQrTask.result.platform = platform;
  }
  
  // 根据新的选择更新任务标题
  if (props.currentQrTask) {
    if ((props.currentQrTask as any).qrCodeType === 'note') {
      props.currentQrTask.title = platform === 'all' ? '扫码查看笔记' : 
                            platform === 'xhs' ? '扫码查看小红书笔记' : 
                            '扫码查看抖音笔记';
    } else if ((props.currentQrTask as any).qrCodeType === 'activity') {
      props.currentQrTask.title = platform === 'all' ? '扫码查看活动笔记' : 
                            platform === 'xhs' ? '扫码查看小红书活动笔记' : 
                            '扫码查看抖音活动笔记';
    }
  }
  
  // 更新二维码URL
  if (props.currentQrTask) {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    let shareLink = '';
    
    // 根据二维码类型生成相应的链接
    const qrCodeType = (props.currentQrTask as any).qrCodeType;
    
    if (qrCodeType === 'note' && props.currentQrTask.noteId) {
      // 笔记二维码
      shareLink = `${origin}/chat#/xhs-auto-api?id=${props.currentQrTask.noteId}`;
      // 添加平台参数
      if (platform !== 'all') {
        shareLink += `&platform=${platform}`;
      }
    } else if ((qrCodeType === 'activity' || (!qrCodeType && props.currentQrTask.activityId)) && props.currentQrTask.activityId) {
      // 活动二维码
      shareLink = `${origin}/chat#/xhs-auto-api?identifier=${props.currentQrTask.activityId}`;
      // 添加平台参数
      if (platform !== 'all') {
        shareLink += `&platform=${platform}`;
      }
    } else if (props.currentQrTask.id?.startsWith('activity_')) {
      // 特殊情况：活动ID存储在task.id中
      const activityId = props.currentQrTask.id.replace('activity_', '');
      shareLink = `${origin}/chat#/xhs-auto-api?identifier=${activityId}`;
      if (platform !== 'all') {
        shareLink += `&platform=${platform}`;
      }
    } else {
      // 尝试从现有URL中提取类型
      try {
        if (props.currentQrUrl && props.currentQrUrl.includes('data=')) {
          const encodedUrl = props.currentQrUrl.split('data=')[1]?.split('&')[0];
          if (encodedUrl) {
            const decodedUrl = decodeURIComponent(encodedUrl);
            
            // 提取基础URL并添加平台参数
            if (decodedUrl.includes('id=') || decodedUrl.includes('identifier=')) {
              // 移除可能存在的平台参数
              let baseUrl = decodedUrl.replace(/&platform=[^&]+/, '');
              
              // 添加新的平台参数
              if (platform !== 'all') {
                baseUrl += `&platform=${platform}`;
              }
              
              // 保留立即发布参数
              if (publishImmediately.value && !baseUrl.includes('publish=1')) {
                baseUrl += '&publish=1';
              }
              
              shareLink = baseUrl;
            }
          }
        }
      } catch (e) {
        console.error('解析二维码URL失败:', e);
      }
    }
    
    // 添加立即发布参数
    if (publishImmediately.value && !shareLink.includes('publish=1')) {
      shareLink += '&publish=1';
    }
    
    // 如果生成了有效的链接，更新二维码URL并发出平台切换事件
    if (shareLink) {
      const encodedShareLink = encodeURIComponent(shareLink);
      emit('error', `二维码已切换到${platform === 'all' ? '全平台' : platform === 'xhs' ? '小红书' : '抖音'}模式`);
      
      // 更新二维码URL
      const qrServicePrefix = 'https://xhs.aivip1.top/api/html-render/qrcode?data=';
      const newQrUrl = `${qrServicePrefix}${encodedShareLink}`;
      
      // 如果当前任务有结果对象，更新其中的二维码URL
      if (props.currentQrTask.result) {
        props.currentQrTask.result.qrCode = newQrUrl;
        
        // 发出事件让父组件更新二维码
        emit('qr-load-error', props.currentQrTask);
        
        // 刷新二维码图片
        forceRefresh.value++;
        qrImageLoading.value = true;
        qrImageError.value = false;
      }
      
      // 发出平台切换事件
      emit('change-platform', platform);
    }
  } else {
    // 如果当前没有任务对象，直接发出平台切换事件
    emit('change-platform', platform);
  }
}

// 打开二维码弹窗
function openQrModal(task: Task, qrCodeUrl: string) {
  currentQrTask.value = task;
  qrUrl.value = qrCodeUrl;
  showQrModal.value = true;
}

// 保存二维码
function saveQrCode() {
  if (!props.currentQrUrl) return;
  
  // 创建临时链接
  const link = document.createElement('a');
  link.href = props.currentQrUrl;
  link.download = `小红书笔记_${Date.now()}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// 打开笔记详情弹窗
async function openNoteDetailModal(task: Task) {
  showNoteDetailModal.value = true;
  noteDetailLoading.value = true;
  noteDetailError.value = '';
  currentNote.value = null;
  
  try {
    if (task.result) {
      // 已有结果直接显示
      currentNote.value = {
        title: task.title,
        content: (task.result as any).content || '无内容',
        noteId: (task.result as any).noteId,
        images: (task.result as any).images || [],
        qrCode: (task.result as any).qrCode
      };
    } else if (task.id) {
      // 需要获取笔记详情
      const result = await getTaskResultAPI(task.id);
      
      if (result) {
        currentNote.value = {
          title: task.title,
          content: (result as any).content || '无内容',
          noteId: (result as any).noteId,
          images: (result as any).images || [],
          qrCode: (result as any).qrCode
        };
      } else {
        throw new Error('获取笔记详情失败');
      }
    } else {
      throw new Error('笔记ID不存在');
    }
  } catch (error: any) {
    console.error('获取笔记详情失败:', error);
    noteDetailError.value = error.message || '获取笔记详情失败';
    emit('error', noteDetailError.value);
  } finally {
    noteDetailLoading.value = false;
  }
}

// 在小红书APP中查看
function viewInApp() {
  if (!currentNote.value || !currentNote.value.noteId) return;
  
  // 如果有二维码，打开二维码弹窗
  if (currentNote.value.qrCode) {
    if (currentQrTask.value) {
      openQrModal(currentQrTask.value, currentNote.value.qrCode);
    }
  } else {
    // 否则尝试直接打开小红书链接
    const noteUrl = `https://www.xiaohongshu.com/discovery/item/${currentNote.value.noteId}`;
    window.open(noteUrl, '_blank');
  }
}

// 显示文本链接替代二维码
function showTextLink(link: string) {
  if (!link) return;
  
  textShareLink.value = link;
  showTextLinkInsteadOfQr.value = true;
  
  // 如果当前任务对象存在，更新任务状态
  if (currentQrTask.value) {
    currentQrTask.value.textShareLink = link;
    currentQrTask.value.qrLoadFailed = true;
  }
}

// 获取分享链接
function getShareLink(): string {
  // 如果已经有文本分享链接，直接返回
  if (textShareLink.value) return textShareLink.value;
  
  // 否则从二维码URL中提取或构建分享链接
  if (props.currentQrTask) {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    
    // 获取二维码类型
    const qrCodeType = (props.currentQrTask as any).qrCodeType;
    
    // 如果是笔记二维码（通过类型标记或noteId判断）
    if (qrCodeType === 'note' || (!qrCodeType && props.currentQrTask.noteId && !(props.currentQrTask.id || '').startsWith('activity_'))) {
      let shareLink = `${origin}/chat#/xhs-auto-api?id=${props.currentQrTask.noteId}`;
      console.log('生成笔记二维码链接（使用id参数）:', shareLink);
      
      // 添加平台参数 - 笔记二维码也需要支持平台切换
      if (selectedPlatform.value === 'xhs') {
        shareLink += '&platform=xhs';
      } else if (selectedPlatform.value === 'douyin') {
        shareLink += '&platform=douyin';
      }
      
      // 添加立即发布参数
      if (publishImmediately.value) {
        shareLink += '&publish=1';
      }
      
      return shareLink;
    } 
    // 如果是活动二维码
    else if (qrCodeType === 'activity' || 
             props.currentQrTask.id?.startsWith('activity_') || 
            (!props.currentQrTask.noteId && props.currentQrTask.activityId)) {
      // 根据选择的平台添加参数
      let shareLink = `${origin}/chat#/xhs-auto-api?identifier=${props.currentQrTask.activityId}`;
      console.log('生成活动二维码链接（使用identifier参数）:', shareLink);
      
      if (selectedPlatform.value === 'xhs') {
        shareLink += '&platform=xhs';
      } else if (selectedPlatform.value === 'douyin') {
        shareLink += '&platform=douyin';
      }
      
      // 添加立即发布参数
      if (publishImmediately.value) {
        shareLink += '&publish=1';
      }
      
      return shareLink;
    }
    // 特殊情况：活动ID存储在task.id而非activityId字段
    else if (props.currentQrTask.id && props.currentQrTask.id.startsWith('activity_')) {
      const activityId = props.currentQrTask.id.replace('activity_', '');
      let shareLink = `${origin}/chat#/xhs-auto-api?identifier=${activityId}`;
      console.log('生成活动二维码链接（从ID提取）:', shareLink);
      
      // 添加平台参数
      if (selectedPlatform.value === 'xhs') {
        shareLink += '&platform=xhs';
      } else if (selectedPlatform.value === 'douyin') {
        shareLink += '&platform=douyin';
      }
      
      // 添加立即发布参数
      if (publishImmediately.value) {
        shareLink += '&publish=1';
      }
      
      return shareLink;
    }
    // 默认情况
    else {
      // 尝试从URL中确定类型
      if (props.currentQrUrl && props.currentQrUrl.includes('data=')) {
        try {
          const encodedUrl = props.currentQrUrl.split('data=')[1]?.split('&')[0];
          if (encodedUrl) {
            const decodedUrl = decodeURIComponent(encodedUrl);
            
            // 查找id或identifier参数
            if (decodedUrl.includes('id=')) {
              console.log('从二维码URL中检测到笔记ID');
              
              // 构建新的链接，确保包含当前的平台和发布选项
              let baseUrl = decodedUrl;
              
              // 移除可能存在的平台和发布参数
              baseUrl = baseUrl.replace(/&platform=[^&]+/, '');
              baseUrl = baseUrl.replace(/&publish=1/, '');
              
              // 添加当前的平台参数
              if (selectedPlatform.value !== 'all') {
                baseUrl += `&platform=${selectedPlatform.value}`;
              }
              
              // 添加当前的发布参数
              if (publishImmediately.value) {
                baseUrl += '&publish=1';
              }
              
              return baseUrl;
            } else if (decodedUrl.includes('identifier=')) {
              console.log('从二维码URL中检测到活动ID');
              
              // 构建新的链接，确保包含当前的平台和发布选项
              let baseUrl = decodedUrl;
              
              // 移除可能存在的平台和发布参数
              baseUrl = baseUrl.replace(/&platform=[^&]+/, '');
              baseUrl = baseUrl.replace(/&publish=1/, '');
              
              // 添加当前的平台参数
              if (selectedPlatform.value !== 'all') {
                baseUrl += `&platform=${selectedPlatform.value}`;
              }
              
              // 添加当前的发布参数
              if (publishImmediately.value) {
                baseUrl += '&publish=1';
              }
              
              return baseUrl;
            }
          }
        } catch (e) {
          console.error('解析二维码URL失败:', e);
        }
      }
    }
  }
  
  // 最终回退，使用默认URL
  console.log('无法确定链接类型，使用默认URL');
  let defaultUrl = window.location.origin + '/chat#/xhs-auto-api';
  
  // 即使是默认URL，也添加平台和发布参数
  if (selectedPlatform.value !== 'all') {
    defaultUrl += `?platform=${selectedPlatform.value}`;
  }
  
  if (publishImmediately.value) {
    defaultUrl += defaultUrl.includes('?') ? '&publish=1' : '?publish=1';
  }
  
  return defaultUrl;
}

// 复制文本链接到剪贴板
function copyTextLink() {
  const linkToCopy = getShareLink();
  if (!linkToCopy) return;
  
  try {
    // 使用Clipboard API复制
    navigator.clipboard.writeText(linkToCopy)
      .then(() => {
        // 成功复制到剪贴板
        copySuccess.value = true;
        setTimeout(() => {
          copySuccess.value = false;
        }, 3000);
        emit('error', '链接已复制到剪贴板');
      })
      .catch(err => {
        console.error('复制到剪贴板失败:', err);
        // 使用回退方法
        fallbackCopyTextToClipboard(linkToCopy);
      });
  } catch (e) {
    console.error('复制到剪贴板出错:', e);
    // 使用回退方法
    fallbackCopyTextToClipboard(linkToCopy);
  }
}

// 回退复制方法
function fallbackCopyTextToClipboard(text: string) {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  
  // 保持不可见
  textArea.style.position = "fixed";
  textArea.style.left = "-999999px";
  textArea.style.top = "-999999px";
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();

  try {
    const successful = document.execCommand('copy');
    if (successful) {
      copySuccess.value = true;
      setTimeout(() => {
        copySuccess.value = false;
      }, 3000);
      emit('error', '链接已复制到剪贴板');
    } else {
      emit('error', '复制失败，请手动复制链接');
    }
  } catch (err) {
    console.error('Fallback: 复制到剪贴板失败', err);
    emit('error', '复制失败，请手动复制链接');
  }

  document.body.removeChild(textArea);
}

// 在浏览器中打开链接
function openLinkInBrowser() {
  const linkToOpen = textShareLink.value || getShareLink();
  if (!linkToOpen) return;
  window.location.href = linkToOpen;
  try {
    console.log('尝试打开链接:', linkToOpen);
    
    // 检测是否为移动设备
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // 在移动设备上使用特殊处理
    if (isMobile) {
      console.log('检测到移动设备, 使用特殊处理');
      
      // 先尝试使用location.href方式打开
      try {
        emit('error', '正在打开分享页面...');
        
        // 将链接存储到本地存储中，以便在页面重新加载后恢复状态
        localStorage.setItem('lastSharedLink', linkToOpen);
        
        // 使用setTimeout延迟执行，避免浏览器拦截
        setTimeout(() => {
          // 创建一个隐形的a标签，使用触摸事件触发
          const link = document.createElement('a');
          link.href = linkToOpen;
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
          link.style.position = 'absolute';
          link.style.top = '0';
          link.style.left = '0';
          link.style.opacity = '0';
          link.style.pointerEvents = 'all';
          link.style.zIndex = '9999';
          link.style.width = '100%';
          link.style.height = '100%';
          
          // 添加点击事件
          link.addEventListener('click', (e) => {
            console.log('链接被点击');
            // 阻止默认操作，使用自定义处理
            e.preventDefault();
            
            // 对抖音和小红书链接进行特殊处理
            if (linkToOpen.includes('douyin.com') || linkToOpen.includes('xiaohongshu.com')||linkToOpen.includes('xhs-auto-api') ) {
              // 尝试使用应用内打开
              window.location.href = linkToOpen;
            } else {
              // 使用window.open尝试在新标签页打开
              const newWindow = window.open(linkToOpen, '_blank');
              
              // 检查是否被浏览器拦截
              if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
                console.log('弹窗被拦截，使用location.href');
                window.location.href = linkToOpen;
              }
            }
          });
          
          // 模拟用户点击
          document.body.appendChild(link);
          link.click();
          
          // 延迟移除链接元素
          setTimeout(() => {
            if (document.body.contains(link)) {
              document.body.removeChild(link);
            }
          }, 1000);
        }, 100);
        
        return;
      } catch (mobileError) {
        console.error('移动设备特殊处理失败:', mobileError);
      }
    }
    
    // 桌面设备或移动处理失败时的标准处理
    const newWindow = window.open(linkToOpen, '_blank');
    
    // 如果window.open返回null，可能是被浏览器拦截了
    if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
      console.log('window.open被拦截，尝试备用方法');
      
      // 尝试使用location.href作为备用
      emit('error', '弹窗被拦截，正在尝试其他方式打开...');
      
      // 使用延迟跳转避免可能的浏览器限制
      setTimeout(() => {
        try {
          // 创建并点击一个临时链接
          const tempLink = document.createElement('a');
          tempLink.href = linkToOpen;
          tempLink.target = '_blank';
          tempLink.rel = 'noopener noreferrer';
          tempLink.style.display = 'none';
          document.body.appendChild(tempLink);
          tempLink.click();
          document.body.removeChild(tempLink);
        } catch (fallbackError) {
          console.error('使用a标签打开链接失败:', fallbackError);
          
          // 最后的备用方案：直接使用location跳转
          setTimeout(() => {
            window.location.href = linkToOpen;
          }, 100);
        }
      }, 300);
    }
  } catch (e) {
    console.error('打开链接失败:', e);
    
    // 提供给用户复制链接的提示
    emit('error', '无法自动打开链接，已复制到剪贴板，请手动打开');
    try {
      copyTextLink(); // 自动复制链接
    } catch (copyError) {
      emit('error', '自动打开和复制都失败，请手动复制链接');
    }
  }
}

// 监听props中的showQrModal变化
watch(() => props.showQrModal, (newVal) => {
  // 当props.showQrModal为true，但内部状态showQrModal.value为false时，同步状态
  if (newVal && !showQrModal.value) {
    showQrModal.value = true;
    qrUrl.value = props.currentQrUrl;
    currentQrTask.value = props.currentQrTask;
  } else if (!newVal && showQrModal.value) {
    // 反之亦然
    showQrModal.value = false;
  }
});

// 监听props中的currentQrUrl变化
watch(() => props.currentQrUrl, (newVal) => {
  if (newVal) {
    qrUrl.value = newVal;
  }
});

// 监听props中的currentQrTask变化
watch(() => props.currentQrTask, (newVal) => {
  if (newVal) {
    currentQrTask.value = newVal;
  }
});

// 监听平台选择变化，更新二维码URL
watch(() => selectedPlatform.value, (newPlatform) => {
  // 如果当前有任务且不是文本链接模式，则更新二维码
  if (props.currentQrTask && !showTextLinkInsteadOfQr.value) {
    // 复用changePlatform逻辑，但不改变selectedPlatform的值
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    let shareLink = '';
    
    // 获取二维码类型
    const qrCodeType = (props.currentQrTask as any).qrCodeType;
    
    // 根据二维码类型生成链接
    if (qrCodeType === 'note' && props.currentQrTask.noteId) {
      // 笔记二维码
      shareLink = `${origin}/chat#/xhs-auto-api?id=${props.currentQrTask.noteId}`;
      // 添加平台参数
      if (newPlatform !== 'all') {
        shareLink += `&platform=${newPlatform}`;
      }
    } else if ((qrCodeType === 'activity' || (!qrCodeType && props.currentQrTask.activityId)) && props.currentQrTask.activityId) {
      // 活动二维码
      shareLink = `${origin}/chat#/xhs-auto-api?identifier=${props.currentQrTask.activityId}`;
      // 添加平台参数
      if (newPlatform !== 'all') {
        shareLink += `&platform=${newPlatform}`;
      }
    } else if (props.currentQrTask.id && props.currentQrTask.id.startsWith('activity_')) {
      // 特殊情况：活动ID存储在task.id中
      const activityId = props.currentQrTask.id.replace('activity_', '');
      shareLink = `${origin}/chat#/xhs-auto-api?identifier=${activityId}`;
      if (newPlatform !== 'all') {
        shareLink += `&platform=${newPlatform}`;
      }
    }
    
    // 添加立即发布参数
    if (publishImmediately.value) {
      shareLink += '&publish=1';
    }
    
    // 如果生成了有效链接，更新二维码URL
    if (shareLink) {
      const encodedShareLink = encodeURIComponent(shareLink);
      const qrServicePrefix = 'https://xhs.aivip1.top/api/html-render/qrcode?data=';
      const newQrUrl = `${qrServicePrefix}${encodedShareLink}`;
      
      // 如果当前任务有结果对象，更新其中的二维码URL
      if (props.currentQrTask.result) {
        props.currentQrTask.result.qrCode = newQrUrl;
        // 发出事件让父组件更新二维码
        emit('qr-load-error', props.currentQrTask);
      }
      
      // 刷新二维码图片
      forceRefresh.value++;
      qrImageLoading.value = true;
      qrImageError.value = false;
    }
  }
});

// 监听立即发布选项变化
watch(() => publishImmediately.value, (newValue) => {
  // 如果当前有任务且不是文本链接模式，则更新二维码
  if (props.currentQrTask && !showTextLinkInsteadOfQr.value) {
    // 获取当前链接
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    let shareLink = '';
    
    // 获取二维码类型
    const qrCodeType = (props.currentQrTask as any).qrCodeType;
    
    // 根据二维码类型生成链接
    if (qrCodeType === 'note' && props.currentQrTask.noteId) {
      // 笔记二维码
      shareLink = `${origin}/chat#/xhs-auto-api?id=${props.currentQrTask.noteId}`;
      // 添加平台参数
      if (selectedPlatform.value !== 'all') {
        shareLink += `&platform=${selectedPlatform.value}`;
      }
    } else if ((qrCodeType === 'activity' || (!qrCodeType && props.currentQrTask.activityId)) && props.currentQrTask.activityId) {
      // 活动二维码
      shareLink = `${origin}/chat#/xhs-auto-api?identifier=${props.currentQrTask.activityId}`;
      // 添加平台参数
      if (selectedPlatform.value !== 'all') {
        shareLink += `&platform=${selectedPlatform.value}`;
      }
    } else if (props.currentQrTask.id && props.currentQrTask.id.startsWith('activity_')) {
      // 特殊情况：活动ID存储在task.id中
      const activityId = props.currentQrTask.id.replace('activity_', '');
      shareLink = `${origin}/chat#/xhs-auto-api?identifier=${activityId}`;
      if (selectedPlatform.value !== 'all') {
        shareLink += `&platform=${selectedPlatform.value}`;
      }
    }
    
    // 添加立即发布参数
    if (newValue) {
      shareLink += '&publish=1';
    }
    
    // 如果生成了有效链接，更新二维码URL
    if (shareLink) {
      const encodedShareLink = encodeURIComponent(shareLink);
      const qrServicePrefix = 'https://xhs.aivip1.top/api/html-render/qrcode?data=';
      const newQrUrl = `${qrServicePrefix}${encodedShareLink}`;
      
      // 如果当前任务有结果对象，更新其中的二维码URL
      if (props.currentQrTask.result) {
        props.currentQrTask.result.qrCode = newQrUrl;
        // 发出事件让父组件更新二维码
        emit('qr-load-error', props.currentQrTask);
      }
      
      // 刷新二维码图片
      forceRefresh.value++;
      qrImageLoading.value = true;
      qrImageError.value = false;
    }
  }
});

// 强制刷新二维码图片
function refreshQrImage() {
  // 通过改变key值强制Vue重新渲染图片组件
  forceRefresh.value++;
  
  // 重置错误状态
  qrImageLoading.value = true;
  qrImageError.value = false;
  showTextLinkInsteadOfQr.value = false;
  
  console.log('强制刷新二维码图片');
}

// 暴露方法给父组件
defineExpose({
  openQrModal,
  closeQrModal,
  openNoteDetailModal,
  closeNoteDetailModal,
  showTextLink,
  refreshQrImage
});

// 需要先查看组件内容，然后添加showTextLink方法
</script>

<template>
  <!-- 二维码弹窗 -->
  <div v-if="props.showQrModal" class="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black bg-opacity-75 backdrop-blur-sm">
    <div class="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 max-w-lg w-full shadow-2xl transform transition-all duration-300 scale-100">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-bold text-gray-800 dark:text-gray-200 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
          </svg>
          <span v-if="(props.currentQrTask as any)?.qrCodeType === 'note' || (!!(props.currentQrTask?.noteId) && !(props.currentQrTask?.id || '').startsWith('activity_'))">扫码查看笔记</span>
          <span v-else-if="(props.currentQrTask as any)?.qrCodeType === 'activity' || props.currentQrTask?.id?.startsWith('activity_') || (!props.currentQrTask?.noteId && props.currentQrTask?.activityId)">扫码查看活动笔记</span>
          <span v-else>扫码查看</span>
        </h3>
        <button @click="closeQrModal" class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <div class="flex flex-col items-center">
        <!-- 平台选择选项，只有显示活动二维码时才显示 -->
        <div v-if="!showTextLinkInsteadOfQr && (props.currentQrTask?.activityId || props.currentQrTask?.noteId)" class="w-full flex justify-center space-x-2 mb-4">
          <button 
            @click="changePlatform('all')" 
            class="px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200"
            :class="[
              selectedPlatform === 'all' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            ]"
          >
            全平台
          </button>
          <button 
            @click="changePlatform('xhs')" 
            class="px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200"
            :class="[
              selectedPlatform === 'xhs' 
                ? 'bg-pink-500 text-white' 
                : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            ]"
          >
            小红书
          </button>
          <button 
            @click="changePlatform('douyin')" 
            class="px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200"
            :class="[
              selectedPlatform === 'douyin' 
                ? 'bg-black text-white dark:bg-gray-900' 
                : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            ]"
          >
            抖音
          </button>
        </div>
        
        <!-- 手机端提示信息 -->
        <div v-if="props.currentQrTask?.result?.mobileOnly" class="w-full bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4">
          <div class="flex items-start">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-blue-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <div>
              <p class="text-sm font-medium text-blue-700 dark:text-blue-300">仅限手机访问</p>
              <p class="text-xs text-blue-600 dark:text-blue-400 mt-1">此分享页面需要在手机端访问，请使用手机扫描二维码或在手机浏览器中打开链接。</p>
            </div>
          </div>
        </div>
        
        <!-- 二维码显示部分 -->
        <div v-if="!showTextLinkInsteadOfQr" class="w-72 h-72 bg-white p-2 rounded-lg shadow-inner flex items-center justify-center relative">
          <!-- 加载中状态 -->
          <div v-if="!props.currentQrUrl || qrImageLoading" class="absolute inset-0 flex items-center justify-center bg-white">
            <div class="h-10 w-10 border-4 border-t-pink-500 rounded-full animate-spin"></div>
          </div>
          
          <!-- 错误状态 -->
          <div v-if="qrImageError" class="absolute inset-0 flex items-center justify-center bg-white">
            <div class="text-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto mb-2 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p class="text-sm text-gray-600">加载失败</p>
            </div>
          </div>
          
          <!-- 实际二维码图片 -->
          <img 
            v-if="props.currentQrUrl" 
            :src="props.currentQrUrl" 
            :key="'qr-image-' + forceRefresh"
            alt="二维码" 
            class="max-w-full max-h-full" 
            :style="{ opacity: qrImageLoading || qrImageError ? 0 : 1 }" 
            @load="() => { qrImageLoading = false; qrImageError = false; console.log('二维码图片加载成功'); }"
            @error="() => { qrImageLoading = false; qrImageError = true; handleImageError(); }"
          />
        </div>
        
        <!-- 二维码状态下的分享链接显示 -->
        <div v-if="!showTextLinkInsteadOfQr" class="w-full mt-4 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg shadow-inner">
          <div class="flex flex-col">
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs font-medium text-gray-600 dark:text-gray-400 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 015.656 0l4 4a4 4 0 01-5.656 5.656l-1.102-1.101" />
                </svg>
                分享链接:
              </span>
            </div>
            <div class="relative">
              <div class="px-3 py-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-600 text-xs break-all text-gray-700 dark:text-gray-300 overflow-hidden pr-20">
                {{ getShareLink() }}
              </div>
                <button 
                  @click="copyTextLink" 
                class="absolute top-0 right-0 h-full px-3 py-2 rounded-r transition-all duration-200 flex items-center justify-center text-xs"
                  :class="copySuccess ? 'bg-green-500 text-white' : 'bg-blue-500 text-white hover:bg-blue-600'"
                >
                  <svg v-if="!copySuccess" xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                  {{ copySuccess ? '已复制' : '复制' }}
                </button>
            </div>
          </div>
        </div>
        
        <!-- 文本链接显示部分（二维码无法加载时） -->
        <div v-else class="w-full bg-gray-50 dark:bg-gray-700 p-4 rounded-lg shadow-inner mt-2">
          <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 text-center flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            二维码无法加载，请使用直接链接
          </h4>
          <div class="flex flex-col">
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs font-medium text-gray-600 dark:text-gray-400 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 015.656 0l4 4a4 4 0 01-5.656 5.656l-1.102-1.101" />
                </svg>
                分享链接:
              </span>
            </div>
            <div class="relative">
              <div class="px-3 py-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-600 text-xs break-all text-gray-700 dark:text-gray-300 overflow-hidden pr-20">
                {{ textShareLink }}
              </div>
            <button 
              @click="copyTextLink" 
                class="absolute top-0 right-0 h-full px-3 py-2 rounded-r transition-all duration-200 flex items-center justify-center text-xs"
                  :class="copySuccess ? 'bg-green-500 text-white' : 'bg-blue-500 text-white hover:bg-blue-600'"
            >
                  <svg v-if="!copySuccess" xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
                  <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                  {{ copySuccess ? '已复制' : '复制' }}
            </button>
            </div>
          </div>
        </div>
        
        <p v-if="!showTextLinkInsteadOfQr && props.currentQrTask?.result?.mobileOnly" class="mt-2 text-sm text-gray-600 dark:text-gray-400 text-center">
          此页面<span class="font-bold text-pink-600 dark:text-pink-400">仅支持手机端访问</span>，请使用手机扫描二维码
        </p>
        <p v-else-if="!showTextLinkInsteadOfQr" class="mt-2 text-sm text-gray-600 dark:text-gray-400 text-center">
          请使用手机扫描上方二维码查看笔记
        </p>
        <p v-else class="mt-4 text-sm text-gray-600 dark:text-gray-400 text-center">
          复制链接或直接点击打开，在手机中浏览
        </p>
        
        <!-- 添加"立即发布"的切换选项 -->
        <div class="mt-4 flex items-center justify-center">
          <label class="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" v-model="publishImmediately" class="sr-only peer">
            <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-300 dark:peer-focus:ring-pink-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-pink-600"></div>
            <span class="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">立即发布</span>
          </label>
        </div>
        
        <div class="mt-6 grid" :class="[isMobileDevice ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-2 sm:grid-cols-3', 'gap-2']">
          <button 
            v-if="!showTextLinkInsteadOfQr"
            @click="saveQrCode" 
            class="px-2 py-2 bg-pink-500 text-white rounded-md hover:bg-pink-600 transition-all duration-200 flex items-center justify-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span class="text-sm">保存二维码</span>
          </button>
          <!-- 添加分享到小红书的按钮 -->
          <button 
            v-if="isMobileDevice"
            @click="openLinkInBrowser" 
            class="px-2 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-all duration-200 flex items-center justify-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            <span class="text-sm">打开页面</span>
          </button>
          <!-- 添加复制链接按钮，适用于移动设备 -->
          <button 
            @click="copyTextLink" 
            class="px-2 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-all duration-200 flex items-center justify-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span class="text-sm">复制链接</span>
          </button>
          <button 
            @click="closeQrModal" 
            class="px-2 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-750 transition-all duration-200 flex items-center justify-center"
          >
            <span class="text-sm">关闭</span>
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- 笔记详情弹窗 -->
  <div v-if="showNoteDetailModal" class="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black bg-opacity-75 backdrop-blur-sm">
    <div class="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-4xl w-full h-3/4 shadow-2xl flex flex-col">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-bold text-gray-800 dark:text-gray-200 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          笔记详情
        </h3>
        <button @click="closeNoteDetailModal" class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <div class="flex-1 overflow-auto">
        <div v-if="noteDetailLoading" class="h-full flex items-center justify-center">
          <div class="h-10 w-10 border-4 border-t-pink-500 rounded-full animate-spin"></div>
        </div>
        
        <div v-else-if="noteDetailError" class="h-full flex items-center justify-center">
          <div class="text-red-500 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p>{{ noteDetailError }}</p>
          </div>
        </div>
        
        <div v-else-if="currentNote" class="divide-y divide-gray-200 dark:divide-gray-700">
          <!-- 笔记基本信息 -->
          <div class="pb-4">
            <h3 class="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">{{ currentNote.title }}</h3>
            <div class="flex flex-wrap gap-2 mt-2">
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300">
                小红书笔记
              </span>
              <span v-if="currentNote.noteId" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                已发布
              </span>
            </div>
          </div>
          
          <!-- 笔记内容 -->
          <div class="py-4">
            <h4 class="text-md font-medium text-gray-700 dark:text-gray-300 mb-2">笔记正文</h4>
            <div class="bg-gray-50 dark:bg-gray-800 p-4 rounded-md whitespace-pre-wrap text-gray-700 dark:text-gray-300">
              {{ currentNote.content }}
            </div>
          </div>
          
          <!-- 笔记图片 -->
          <div v-if="currentNote.images && currentNote.images.length > 0" class="py-4">
            <h4 class="text-md font-medium text-gray-700 dark:text-gray-300 mb-2">笔记图片</h4>
            <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              <div 
                v-for="(image, index) in currentNote.images" 
                :key="index"
                class="aspect-square rounded-md overflow-hidden shadow-sm hover:shadow-md transition-all duration-200"
              >
                <img :src="image" class="w-full h-full object-cover" />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="flex justify-end space-x-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button 
          v-if="currentNote && currentNote.noteId"
          @click="viewInApp"
          class="px-4 py-2 bg-pink-500 text-white rounded-md hover:bg-pink-600 transition-all duration-200 flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          在小红书中查看
        </button>
        <button 
          @click="closeNoteDetailModal" 
          class="px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-750 transition-all duration-200"
        >
          关闭
        </button>
      </div>
    </div>
  </div>
</template> 