<script lang="ts">
import { defineComponent } from 'vue';
import { useRoute } from 'vue-router';

// 为window增加xhs类型声明
declare global {
  interface Window {
    xhs: {
      share: (options: {
        shareInfo: {
          type: 'normal' | 'video';
          title: string;
          content: string;
          images: string[];
        },
        verifyConfig: {
          appKey: string;
          nonce: string;
          timestamp: string;
          signature: string;
        },
        success?: () => void;
        fail?: (error: { message?: string }) => void;
      }) => void;
    };
  }
}

export default defineComponent({
  name: 'XhsShareLink',
  data() {
    return {
      postData: null as any,
      signatureData: null as any,
      currentImageIndex: 0,
      totalImages: 0,
      startX: 0,
      currentX: 0,
      startY: 0, // 新增：触摸起始Y坐标
      currentY: 0, // 新增：当前Y坐标
      touchStartTime: 0, // 新增：触摸开始时间
      touchMoveY: 0, // 新增：Y方向移动距离
      isDragging: false,
      swipeThreshold: 50, // 滑动阈值
      isTransitioning: false, // 是否正在过渡中
      isVerticalScrolling: false, // 新增：是否正在垂直滚动
      currentIdentifier: null as string | null,
      urlHasIdentifier: false,
      loading: true,
      loadingProgress: 0, // 新增：加载进度
      loadingStage: '准备中...', // 新增：加载阶段文字
      error: '',
      errorColor: 'red',
      nextButtonDisabled: false,
      // API域名配置，与原始HTML保持一致
      API_DOMAIN: window.location.origin + '/api', // 修改为使用当前域名和端口
      isWechatAndroid: false, // 标记是否为安卓微信环境
      noteSharedByOthers: false, // 新增：标记笔记是否已被他人分享
      douyinSchema: '', // 新增：抖音分享链接
      douyinSchemaLoading: false, // 新增：抖音链接加载状态
      douyinSchemaError: '', // 新增：抖音链接加载错误信息
      douyinShared: false, // 修改：标记笔记是否已分享到抖音（临时状态）
      preferredSharePlatform: 'xhs', // 新增：默认分享平台，可选值：xhs、douyin
      showBothShareButtons: true, // 新增：是否同时显示两个分享按钮
      isXhsUsed: false, // 新增：标记笔记是否在小红书发布
      isDouyinUsed: false, // 新增：标记笔记是否在抖音发布
      isPreview: false, // 新增：标记是否为预览模式（不显示分享按钮，只显示跳转按钮）
      showDesktopModal: false, // 新增：是否显示桌面端提示弹窗
      qrCodeUrl: '', // 新增：二维码URL
      isDebug: false, // 新增：是否为调试模式
      showPlatformDialog: false, // 添加平台选择对话框状态
      consoleLogs: [] as {type: string, message: string, timestamp: string}[], // 添加控制台日志存储
      originalConsole: { log: null, error: null, warn: null, info: null } as any, // 存储原始console方法
      debugLogExpanded: true, // 控制台日志面板是否展开
      jsonDepth: 0, // 新增：用于JSON格式化辅助函数
      filterEnabled: true, // 新增：是否启用日志过滤
      filteredLogCount: 0, // 新增：被过滤的日志数量
      hideNoteContent: false, // 新增：是否隐藏笔记内容
      showConfirmDialog: false, // 新增：显示确认对话框
      confirmDialogTitle: '', // 新增：确认对话框标题
      confirmDialogMessage: '', // 新增：确认对话框消息
      confirmDialogCallback: null as (() => void) | null, // 新增：确认对话框回调函数
    };
  },
  computed: {
    showShareButton(): boolean {
      if (!this.postData) return false;
      
      // 如果是预览模式，不显示按钮
      if (this.isPreview) return false;
      
      // 如果笔记已经在小红书发布，则不显示按钮
      if (this.isXhsUsed) return false;
      
      // 笔记是否已被其他人分享
      if (this.noteSharedByOthers) return false;
      
      // 获取URL中的platform参数
      const urlParams = this.getUrlParams();
      const platform = urlParams?.platform || null;
      
      // 如果指定了platform参数，只显示对应平台的按钮
      if (platform === 'douyin') {
        return false; // 如果平台是抖音，不显示小红书分享按钮
      }
      
      return platform === 'xhs' || platform === null || this.showBothShareButtons;
    },
    showDouyinShareButton(): boolean {
      if (!this.postData) return false;
      
      // 如果是预览模式，不显示按钮
      if (this.isPreview) return false;
      
      // 如果笔记已经在抖音发布，则不显示按钮
      if (this.isDouyinUsed) return false;
      
      // 检查笔记是否已分享到抖音
      if (this.douyinShared) return false;
      
      // 笔记是否已被其他人分享（全局标记）
      if (this.noteSharedByOthers) return false;
      
      // 获取URL中的platform参数
      const urlParams = this.getUrlParams();
      const platform = urlParams?.platform || null;
      
      // 如果指定了platform参数，只显示对应平台的按钮
      if (platform === 'xhs') {
        return false; // 如果平台是小红书，不显示抖音分享按钮
      }
      
      return platform === 'douyin' || platform === null || this.showBothShareButtons;
    },
    showSharePageButton(): boolean {
      // 只在预览模式下显示此按钮
      if (!this.isPreview) return false;
      
      // 确保有笔记数据
      if (!this.postData) return false;
      
      return true;
    },
    isNoteUsed(): boolean {
      if (!this.postData) return false;
      
      // 兼容后端返回的不同字段名称：isUsed或is_used
      // 支持boolean、number和string类型
      const isUsed = this.postData.isUsed !== undefined ? this.postData.isUsed : 
                    (this.postData.is_used !== undefined ? this.postData.is_used : 0);
      
      // 转换为数字再比较
      let isUsedNumber;
      if (typeof isUsed === 'boolean') {
        isUsedNumber = isUsed ? 1 : 0;
      } else if (typeof isUsed === 'string') {
        isUsedNumber = isUsed.toLowerCase() === 'true' ? 1 : parseInt(isUsed, 10);
      } else {
        isUsedNumber = isUsed;
      }
      
      return isUsedNumber === 1 || isUsed === true;
    }
  },
  mounted() {
    // 开始加载动画
    this.startLoadingAnimation();
    
    // 先获取数据，再按需加载SDK
    this.initPage().then(() => {
      // 仅当需要分享功能且不是预览模式时才加载SDK
      if (this.showShareButton && !this.isPreview) {
        // 延迟加载SDK，优先完成页面渲染
        setTimeout(() => {
          this.loadXhsSDK();
        }, 2000);
      }
    });
    
    // 添加全局滚动监听，使用passive选项提高性能
    window.addEventListener('scroll', this.handleScroll, { passive: true });
    
    // 设置底部按钮样式
    this.$nextTick(() => {
      this.setupButtonStyles();
    });

    // 注意：在debug模式下的控制台捕获已在initPage中设置，这里不需要重复
  },
  beforeUnmount() {
    // 组件卸载前移除全局监听
    window.removeEventListener('scroll', this.handleScroll);
    
    // 恢复原始console方法
    if (this.isDebug && this.originalConsole.log) {
      console.log = this.originalConsole.log;
      console.error = this.originalConsole.error;
      console.warn = this.originalConsole.warn;
      console.info = this.originalConsole.info;
    }
  },
  methods: {
    // 设置控制台捕获
    setupConsoleCapture() {
      // 保存原始console方法
      this.originalConsole = {
        log: console.log,
        error: console.error,
        warn: console.warn,
        info: console.info
      };
      
      // 替换console.log方法
      console.log = (...args) => {
        // 调用原始方法
        this.originalConsole.log(...args);
        
        // 添加到日志数组
        this.addConsoleLog('log', args);
      };
      
      // 替换console.error方法
      console.error = (...args) => {
        this.originalConsole.error(...args);
        this.addConsoleLog('error', args);
      };
      
      // 替换console.warn方法
      console.warn = (...args) => {
        this.originalConsole.warn(...args);
        this.addConsoleLog('warn', args);
      };
      
      // 替换console.info方法
      console.info = (...args) => {
        this.originalConsole.info(...args);
        this.addConsoleLog('info', args);
      };
      
      // 调整页面布局，增加底部空间
      this.$nextTick(() => {
        const container = document.querySelector('.scrollable-container');
        if (container) {
          container.classList.add('console-mode');
        }
      });
      
      // 立即添加一条日志
      console.log('📱 移动端控制台已启用 - ' + new Date().toLocaleTimeString());
      console.log('URL参数: ', this.getUrlParams());
    },
    
    // 添加控制台日志
    addConsoleLog(type: string, args: any[]) {
      // 检查是否需要过滤此日志
      if (this.shouldFilterLog(args)) {
        return; // 跳过不需要的日志
      }
      
      // 将参数转换为字符串
      let message = '';
      try {
        message = args.map(arg => {
          if (arg === null) return 'null';
          if (arg === undefined) return 'undefined';
          
          if (typeof arg === 'object') {
            try {
              // 尝试格式化JSON，限制嵌套深度为2层，避免过于复杂
              return JSON.stringify(arg, this.jsonReplacer, 2);
            } catch (e) {
              return '[无法序列化的对象]';
            }
          }
          return String(arg);
        }).join(' ');
      } catch (e) {
        message = '日志格式化错误: ' + String(e);
      }
      
      // 创建新的日志条目
      const logEntry = {
        type,
        message,
        timestamp: new Date().toLocaleTimeString()
      };
      
      // 添加到日志数组
      this.consoleLogs.push(logEntry);
      
      // 保持最大日志数量为100条
      if (this.consoleLogs.length > 100) {
        this.consoleLogs.shift();
      }
      
      // 自动滚动到最新日志
      this.$nextTick(() => {
        this.scrollToLatestLog();
      });
    },
    
    // 检查是否应该过滤此日志
    shouldFilterLog(args: any[]): boolean {
      // 如果过滤功能被禁用，不过滤任何日志
      if (!this.filterEnabled) {
        return false;
      }
      
      // 将参数转为字符串进行检查
      const logStr = args.map(arg => {
        if (typeof arg === 'string') return arg.toLowerCase();
        if (typeof arg === 'object' && arg !== null) {
          try {
            return JSON.stringify(arg).toLowerCase();
          } catch (e) {
            return '';
          }
        }
        return String(arg).toLowerCase();
      }).join(' ').toLowerCase();
      
      // 定义需要过滤的关键词
      const filterKeywords = [
        // 鼠标事件相关
        'mousemove', 'mouseover', 'mouseout', 'mouseenter', 'mouseleave',
        'click', 'dblclick', 'mousedown', 'mouseup',
        // 触摸事件相关
        'touchstart', 'touchmove', 'touchend', 'touchcancel',
        // 拖拽事件相关
        'drag', 'dragstart', 'dragend', 'dragover', 'dragenter', 'dragleave', 'drop',
        // 滚动和轮播相关
        'scroll', 'wheel',
        // 坐标值相关
        'clientx', 'clienty', 'screenx', 'screeny', 'pagex', 'pagey', 'offsetx', 'offsety',
        // 事件监听器相关
        'addeventlistener', 'removeeventlistener',
        // Vue内部事件
        '__vue__', 'v-model', 'emitter',
        // 其他不重要的UI交互
        'focus', 'blur', 'resize',
        // 性能度量相关
        'performance', 'timing', 'readystate'
      ];
      
      // 检查是否包含过滤关键词
      const shouldFilter = filterKeywords.some(keyword => logStr.includes(keyword));
      
      // 如果需要过滤，增加计数
      if (shouldFilter) {
        this.filteredLogCount++;
      }
      
      return shouldFilter;
    },
    
    // 切换日志过滤状态
    toggleFilter() {
      this.filterEnabled = !this.filterEnabled;
      
      // 添加一条日志记录过滤状态变化
      if (this.filterEnabled) {
        console.log(`🔍 已启用日志过滤，已过滤 ${this.filteredLogCount} 条日志`);
      } else {
        console.log('🔍 已禁用日志过滤，将显示所有日志');
      }
    },
    
    // JSON格式化辅助函数，限制嵌套深度
    jsonReplacer(key: string, value: any) {
      // 统计当前的嵌套深度
      if (this.jsonDepth === undefined) {
        this.jsonDepth = 0;
      }
      
      if (key !== '') {
        this.jsonDepth++;
      }
      
      // 如果嵌套深度超过3层，简化显示
      if (this.jsonDepth > 3) {
        this.jsonDepth--;
        
        if (Array.isArray(value)) {
          return `[数组:${value.length}项]`;
        } else if (typeof value === 'object' && value !== null) {
          return '[对象]';
        }
      }
      
      // 返回值并减少深度计数
      if (key !== '') {
        this.jsonDepth--;
      }
      
      return value;
    },
    
    // 滚动到最新日志
    scrollToLatestLog() {
      if (this.debugLogExpanded) {
        const container = document.querySelector('.console-logs');
        if (container) {
          container.scrollTop = container.scrollHeight;
        }
      }
    },
    
    // 清除控制台日志
    clearConsoleLogs() {
      this.consoleLogs = [];
      console.log('控制台日志已清除 - ' + new Date().toLocaleTimeString());
    },
    
    // 切换控制台展开状态
    toggleDebugLogExpanded() {
      this.debugLogExpanded = !this.debugLogExpanded;
      
      // 如果展开，自动滚动到最新日志
      if (this.debugLogExpanded) {
        this.$nextTick(() => {
          this.scrollToLatestLog();
        });
      }
    },
    // 设置底部按钮样式
    setupButtonStyles() {
      const buttonGroup = document.querySelector('.button-group');
      if (!buttonGroup) return;
      
      const buttons = buttonGroup.querySelectorAll('button');
      
      // 如果只有一个按钮，添加单按钮样式
      if (buttons.length === 1) {
        buttons[0].classList.add('single-button');
      } else if (buttons.length > 1) {
        // 多个按钮时移除单按钮样式
        buttons.forEach(btn => btn.classList.remove('single-button'));
      }
      
      // 检查是否存在状态提示
      const hasStatus = buttonGroup.querySelector('.note-status');
      const scrollableContainer = document.querySelector('.scrollable-container');
      
      if (hasStatus) {
        buttonGroup.classList.add('has-status');
        // 为滚动容器添加最小的底部间距
        if (scrollableContainer) {
          scrollableContainer.classList.add('extra-bottom-space');
        }
      } else {
        buttonGroup.classList.remove('has-status');
        // 也为没有状态提示的情况添加最小的底部间距
        if (scrollableContainer) {
          scrollableContainer.classList.add('extra-bottom-space');
        }
      }
    },
    // 处理全局滚动事件
    handleScroll(e: Event): void {
      // 滚动时允许页面默认行为，但不输出日志
      // console.log('页面滚动'); // 注释掉不必要的日志
    },
    // 开始加载动画
    startLoadingAnimation(): void {
      let progress = 0;
      const stages = [
        '初始化...',
        '连接服务器...',
        '获取笔记数据...',
        '准备素材...',
        '即将完成...'
      ];
      
      // 减少更新频率，从200ms改为300ms
      const interval = setInterval(() => {
        if (this.loading) {
          // 使用固定增量而不是随机数，减少计算量
          progress += 3;
          if (progress > 100) progress = 100;
          
          this.loadingProgress = Math.floor(progress);
          
          // 减少不必要的计算，使用简单的条件判断
          if (progress < 20) this.loadingStage = stages[0];
          else if (progress < 40) this.loadingStage = stages[1];
          else if (progress < 60) this.loadingStage = stages[2];
          else if (progress < 80) this.loadingStage = stages[3];
          else this.loadingStage = stages[4];
          
          // 如果显示太久（超过10秒），加上友好提示
          if (progress >= 90 && this.loading) {
            this.loadingStage = '加载时间有点长，请稍候...';
          }
        } else {
          clearInterval(interval);
        }
      }, 300);
    },
    // 加载小红书SDK
    loadXhsSDK(): void {
      // 如果当前不需要分享功能，则不加载SDK
      if (!this.showShareButton) {
        console.log('当前不需要分享功能，跳过加载SDK');
        return;
      }
      
      console.log('开始加载小红书SDK...');
      
      // 检查是否已加载
      if (window.xhs) {
        console.log('小红书SDK已存在，跳过加载');
        return;
      }
      
      // 使用更轻量的加载方式
      const script = document.createElement('script');
      script.src = 'https://fe-static.xhscdn.com/biz-static/goten/xhs-1.0.1.js';
      script.async = true;
      script.defer = true; // 添加defer属性
      
      // 添加加载成功和失败的回调
      script.onload = () => {
        console.log('小红书SDK加载成功');
      };
      
      script.onerror = (error) => {
        console.error('小红书SDK加载失败:', error);
        this.showError('小红书SDK加载失败，请刷新页面重试');
      };
      
      document.head.appendChild(script);
    },
    // 初始化触摸事件
    initTouchEvents(): void {
      const slider = this.$refs.imageSlider as HTMLElement;
      if (!slider) {
        console.log('未找到图片轮播组件，跳过触摸事件初始化');
        return;
      }
      
      console.log('初始化触摸事件');
      
      // 确保页面可滚动，但轮播容器只允许水平滑动
      document.body.style.overflow = 'auto';
      document.documentElement.style.overflow = 'auto';
      document.body.style.touchAction = 'auto';
      
      const container = document.querySelector('.container') as HTMLElement;
      if (container) {
        container.style.overflow = 'auto';
      }
      
      const noteContent = document.querySelector('.note-content') as HTMLElement;
      if (noteContent) {
        noteContent.style.overflow = 'auto';
      }
      
      // 先移除可能存在的之前的事件监听器，避免重复绑定
      slider.removeEventListener('touchstart', this.handleTouchStart);
      slider.removeEventListener('touchmove', this.handleTouchMove);
      slider.removeEventListener('touchend', this.handleTouchEnd);
      
      // 添加鼠标事件支持，提升桌面端体验
      slider.removeEventListener('mousedown', this.handleMouseDown);
      document.removeEventListener('mousemove', this.handleMouseMove);
      document.removeEventListener('mouseup', this.handleMouseUp);
      document.removeEventListener('mouseleave', this.handleMouseUp);
      
      // 设置轮播图区域仅允许水平滑动
      slider.style.touchAction = 'pan-x'; 
      
      // 设置图片也只允许水平滑动
      const images = slider.querySelectorAll('img');
      images.forEach(img => {
        img.style.touchAction = 'pan-x';
        img.style.userSelect = 'none'; // 防止图片被选中
        img.draggable = false; // 禁止图片拖拽，避免干扰轮播
      });
      
      // 图片容器设置
      const imageContainer = slider.querySelector('.note-images') as HTMLElement;
      if (imageContainer) {
        imageContainer.style.touchAction = 'pan-x';
        imageContainer.style.userSelect = 'none';
      }
      
      // 重新添加触摸事件监听器，使用passive选项提高性能
      slider.addEventListener('touchstart', this.handleTouchStart, {passive: true});
      slider.addEventListener('touchmove', this.handleTouchMove, {passive: false});
      slider.addEventListener('touchend', this.handleTouchEnd);
      
      // 添加鼠标事件支持
      slider.addEventListener('mousedown', this.handleMouseDown);
      // 鼠标移动和释放事件应绑定到document，以便捕获超出容器范围的事件
      document.addEventListener('mousemove', this.handleMouseMove);
      document.addEventListener('mouseup', this.handleMouseUp);
      document.addEventListener('mouseleave', this.handleMouseUp);
      
      // 添加左右翻页按钮点击事件
      const prevButton = this.$refs.prevButton as HTMLElement;
      const nextButton = this.$refs.nextButton as HTMLElement;
      if (prevButton) {
        prevButton.addEventListener('click', () => this.slideImage(-1));
      }
      if (nextButton) {
        nextButton.addEventListener('click', () => this.slideImage(1));
      }
      
      // 双击轮播快进事件
      slider.addEventListener('dblclick', (e) => {
        // 获取点击位置
        const clickX = e.clientX - slider.getBoundingClientRect().left;
        // 根据点击位置决定向前还是向后
        if (clickX > slider.offsetWidth / 2) {
          this.slideImage(1); // 右侧双击，下一张
        } else {
          this.slideImage(-1); // 左侧双击，上一张
        }
        e.preventDefault(); // 阻止默认行为
      });
      
      console.log('触摸和鼠标事件已初始化');
    },

    handleTouchStart(e: TouchEvent): void {
      if (this.isTransitioning) return;
      
      this.startX = e.touches[0].clientX;
      this.currentX = this.startX;
      this.startY = e.touches[0].clientY;
      this.currentY = this.startY;
      this.touchStartTime = Date.now();
      this.isDragging = true;
      this.isVerticalScrolling = false; // 重置垂直滚动状态
      
      // 获取图片容器，停止任何正在进行的过渡动画
      const slider = this.$refs.imageSlider as HTMLElement;
      const images = slider.querySelector('.note-images') as HTMLElement;
      if (images) {
        images.style.transition = 'none';
      }
      
      console.log('触摸开始:', this.startX, this.startY);
    },

    handleTouchMove(e: TouchEvent): void {
      if (!this.isDragging) return;
      
      this.currentX = e.touches[0].clientX;
      this.currentY = e.touches[0].clientY;
      const diffX = this.startX - this.currentX;
      const diffY = this.startY - this.currentY;
      
      // 根据移动方向判断是水平滑动还是垂直滑动
      if (!this.isVerticalScrolling && Math.abs(diffY) > Math.abs(diffX) * 1.5) {
        // 更严格的垂直滑动判定条件，提高阈值
        this.isVerticalScrolling = true;
        this.touchMoveY = diffY;
        return; // 如果是垂直滑动，允许页面默认滚动
      } else if (this.isVerticalScrolling) {
        return; // 已识别为垂直滑动，不干预
      }
      
      // 水平滑动时阻止默认行为
      if (Math.abs(diffX) > 5) { // 降低阈值，更敏感地识别水平滑动
        e.preventDefault();
      }
      
      const slider = this.$refs.imageSlider as HTMLElement;
      const images = slider.querySelector('.note-images') as HTMLElement;
      
      if (images) {
        // 添加水平拖拽跟随效果，限制拖拽距离
        const translateX = -this.currentImageIndex * 100 - (diffX / slider.offsetWidth * 100);
        // 限制超出范围拖拽的弹性，使其更有阻尼感
        const limitedTranslateX = this.limitDragRange(translateX);
        images.style.transform = `translateX(${limitedTranslateX}%)`;
      }
    },

    handleTouchEnd(e: TouchEvent): void {
      if (!this.isDragging) return;
      
      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      const diffX = this.startX - endX;
      const diffY = this.startY - endY;
      
      // 如果是垂直滑动，不处理图片滑动
      if (this.isVerticalScrolling) {
        this.isDragging = false;
        this.isVerticalScrolling = false;
        return;
      }
      
      const slider = this.$refs.imageSlider as HTMLElement;
      const images = slider.querySelector('.note-images') as HTMLElement;
      
      if (images) {
        if (Math.abs(diffX) > this.swipeThreshold) {
          if (diffX > 0) {
            // 向左滑动，显示下一张
            this.slideImage(1);
          } else {
            // 向右滑动，显示上一张
            this.slideImage(-1);
          }
        } else {
          // 未达到滑动阈值，回弹到原位
          images.style.transition = 'transform 0.3s cubic-bezier(0.215, 0.61, 0.355, 1)';
          images.style.transform = `translateX(-${this.currentImageIndex * 100}%)`;
          
          // 重置过渡状态
          setTimeout(() => {
            images.style.transition = '';
          }, 300);
        }
      }
      
      this.isDragging = false;
      this.isVerticalScrolling = false;
      console.log('触摸结束, 滑动距离X:', diffX, '滑动距离Y:', diffY);
    },
    
    // 限制拖拽范围，超出范围时添加阻尼效果
    limitDragRange(translateX: number): number {
      // 获取轮播图范围限制
      const minTranslate = -(this.totalImages - 1) * 100;
      const maxTranslate = 0;
      
      // 如果只有一张或没有图片，不允许拖拽
      if (this.totalImages <= 1) return -this.currentImageIndex * 100;
      
      // 超出范围时应用阻尼效果
      if (translateX > maxTranslate) {
        // 向右拖过头，应用阻尼
        return maxTranslate + (translateX - maxTranslate) * 0.3;
      } else if (translateX < minTranslate) {
        // 向左拖过头，应用阻尼
        return minTranslate + (translateX - minTranslate) * 0.3;
      }
      
      // 在正常范围内直接返回
      return translateX;
    },
    
    // 添加鼠标事件处理
    handleMouseDown(e: MouseEvent): void {
      if (this.isTransitioning) return;
      
      this.startX = e.clientX;
      this.currentX = this.startX;
      this.startY = e.clientY;
      this.currentY = this.startY;
      this.isDragging = true;
      
      // 停止任何可能正在进行的过渡动画
      const slider = this.$refs.imageSlider as HTMLElement;
      const images = slider.querySelector('.note-images') as HTMLElement;
      if (images) {
        images.style.transition = 'none';
      }
      
      // 阻止默认行为，避免选中文本
      e.preventDefault();
      console.log('鼠标按下:', this.startX, this.startY);
    },
    
    handleMouseMove(e: MouseEvent): void {
      if (!this.isDragging) return;
      
      this.currentX = e.clientX;
      this.currentY = e.clientY;
      const diffX = this.startX - this.currentX;
      const diffY = this.startY - this.currentY;
      
      // 根据移动方向判断是水平滑动还是垂直滑动
      if (!this.isVerticalScrolling && Math.abs(diffY) > Math.abs(diffX) * 1.5) {
        this.isVerticalScrolling = true;
        this.touchMoveY = diffY;
        return; // 如果是垂直滑动，不阻止默认行为
      } else if (this.isVerticalScrolling) {
        return; // 已识别为垂直滑动，不干预
      }
      
      // 水平滑动，阻止默认行为
      e.preventDefault();
      
      const slider = this.$refs.imageSlider as HTMLElement;
      const images = slider.querySelector('.note-images') as HTMLElement;
      
      if (images) {
        // 添加水平拖拽跟随效果
        const translateX = -this.currentImageIndex * 100 - (diffX / slider.offsetWidth * 100);
        const limitedTranslateX = this.limitDragRange(translateX);
        images.style.transform = `translateX(${limitedTranslateX}%)`;
      }
    },
    
    handleMouseUp(e: MouseEvent): void {
      if (!this.isDragging) return;
      
      const endX = e.clientX;
      const endY = e.clientY;
      const diffX = this.startX - endX;
      const diffY = this.startY - endY;
      
      // 如果是垂直滑动，不处理图片滑动
      if (this.isVerticalScrolling) {
        this.isDragging = false;
        this.isVerticalScrolling = false;
        return;
      }
      
      const slider = this.$refs.imageSlider as HTMLElement;
      const images = slider.querySelector('.note-images') as HTMLElement;
      
      if (images) {
        if (Math.abs(diffX) > this.swipeThreshold) {
          if (diffX > 0) {
            // 向左移动，显示下一张
            this.slideImage(1);
          } else {
            // 向右移动，显示上一张
            this.slideImage(-1);
          }
        } else {
          // 未达到滑动阈值，回弹到原位
          images.style.transition = 'transform 0.3s cubic-bezier(0.215, 0.61, 0.355, 1)';
          images.style.transform = `translateX(-${this.currentImageIndex * 100}%)`;
          
          // 重置过渡状态
          setTimeout(() => {
            images.style.transition = '';
          }, 300);
        }
      }
      
      this.isDragging = false;
      this.isVerticalScrolling = false;
    },

    // 获取URL参数
    getUrlParams(): {id: string | null, identifier: string | null, platform: string | null, showBoth: string | null, isSequential: string | null, isPreview: string | null, debug: string | null, publish: string | null, token: string | null} {
      try {
        const route = useRoute();
        
        // 检查route和route.query是否存在
        if (!route || !route.query) {
          console.warn('Route或route.query不可用，返回默认值');
          return {
            id: null,
            identifier: null,
            platform: null,
            showBoth: null,
            isSequential: null,
            isPreview: null,
            debug: null,
            publish: null,
            token: null
          };
        }
        
        return {
          id: (route.query.id as string) || null,
          identifier: (route.query.identifier as string) || null,
          platform: (route.query.platform as string) || null,
          showBoth: (route.query.showBoth as string) || null,
          isSequential: (route.query.isSequential as string) || null,
          isPreview: (route.query.isPreview as string) || null,
          debug: (route.query.debug as string) || null,
          publish: (route.query.publish as string) || null,
          token: (route.query.token as string) || null
        };
      } catch (error) {
        console.error('获取URL参数失败:', error);
        // 发生错误时返回默认值
        return {
          id: null,
          identifier: null,
          platform: null,
          showBoth: null,
          isSequential: null,
          isPreview: null,
          debug: null,
          publish: null,
          token: null
        };
      }
    },

    // 初始化页面，逻辑与原始HTML保持一致
    async initPage(): Promise<void> {
      try {
        // 检测环境，但不立即跳转，只设置标志位
        this.isWechatAndroid = this.isWechat() && this.isAndroid();
        
        const urlParams = this.getUrlParams();
        const id = urlParams?.id || null;
        const identifier = urlParams?.identifier || null;
        const platform = urlParams?.platform || null;
        const showBoth = urlParams?.showBoth || null;
        const isPreview = urlParams?.isPreview || null;
        const debug = urlParams?.debug || null;
        const publish = urlParams?.publish || null; // 添加获取publish参数
        const postId = id || identifier;
        
        if (!postId) {
          this.showError('未提供帖子ID或identifier，请检查URL参数');
          return;
        }

        // 设置调试模式
        if (debug === '1' || debug === 'true') {
          this.isDebug = true;
          console.log('调试模式已启用');
          
          // 立即设置控制台捕获
          this.setupConsoleCapture();
        }

        // 设置隐藏笔记内容模式
        if (publish === '1' || publish === 'true') {
          this.hideNoteContent = true;
          console.log('检测到立即发布参数，隐藏笔记内容');
        }

        // 设置分享平台
        if (platform === 'douyin') {
          this.preferredSharePlatform = 'douyin';
        } else if (platform === 'xhs') {
          this.preferredSharePlatform = 'xhs';
        }
        
        // 设置是否显示两个按钮
        if (showBoth === '1' || showBoth === 'true') {
          this.showBothShareButtons = true;
        } else if (showBoth === '0' || showBoth === 'false') {
          this.showBothShareButtons = false;
        }

        // 设置是否为预览模式（不显示分享按钮）
        if (isPreview === '1' || isPreview === 'true') {
          this.isPreview = true;
        }

        // 检查URL中是否有identifier参数
        this.urlHasIdentifier = !!identifier;
        
        try {
          // 设置当前identifier
          this.currentIdentifier = identifier || '';
          
          // 判断postId来源：如果URL中有identifier参数且没有id参数，则postId是identifier
          const isIdentifierParam = !!identifier && !id;
          
          // 创建两个Promise，但不等待
          const postPromise = this.getPostData(postId, isIdentifierParam);
          const signaturePromise = this.getSignatureData();
          
          // 一起等待两个Promise完成
          const results = await Promise.all([postPromise, signaturePromise]);
          
          // 分解结果
          const postData = results[0];
          const signatureData = results[1];

          // 确保currentIdentifier被设置，优先使用URL中的identifier参数
          if (!this.currentIdentifier && postData.identifier) {
            this.currentIdentifier = postData.identifier;
          }

          // 更新页面数据
          this.updatePageData(postData, signatureData);
          
          // 如果默认展示抖音分享，预加载抖音链接
          if (!this.isPreview && (this.preferredSharePlatform === 'douyin' || this.showBothShareButtons)) {
            // 在数据加载完成后再预加载抖音链接
            this.$nextTick(() => {
              // 确保postData已经完成初始化
              if (this.postData && this.postData.id) {
                this.getDouyinSchema().catch(error => {
                  console.error('预加载抖音链接失败:', error);
                });
              } else {
                console.warn('无法预加载抖音链接：笔记数据尚未准备好');
              }
            });
          }
          
          // 处理立即发布参数
          if (publish === '1' || publish === 'true') {
            console.log('检测到立即发布参数，准备自动发布内容');
            
            // 延迟执行，确保页面和数据都已完全加载
            setTimeout(async () => {
              try {
                if (this.isDesktop() && !this.isDebug) {
                  // 桌面端显示二维码，不自动发布
                  console.log('桌面端环境，显示二维码而不是自动发布');
                  return;
                }
                
                // 根据平台参数决定发布到哪个平台
                if (platform === 'douyin') {
                  // 发布到抖音
                  this.shareToDouyin();
                } else if (platform === 'xhs') {
                  // 发布到小红书
                  this.shareToXhs();
                } else {
                  // 未指定平台，检查发布状态
                  const isXhsUsed = this.isXhsUsed;
                  const isDouyinUsed = this.isDouyinUsed;
                  
                  if (!isXhsUsed && !isDouyinUsed) {
                    // 两个平台都未发布，弹窗让用户选择
                    this.showPlatformSelectionDialog();
                  } else if (!isXhsUsed) {
                    // 小红书未发布，自动发布到小红书
                    this.shareToXhs();
                  } else if (!isDouyinUsed) {
                    // 抖音未发布，自动发布到抖音
                    this.shareToDouyin();
                  } else {
                    // 两个平台都已发布，不执行操作
                    console.log('内容已在两个平台发布，无需执行自动发布');
                  }
                }
              } catch (error) {
                console.error('自动发布失败:', error);
              }
            }, 2000); // 延迟2秒执行，确保页面加载完成
          }
        } catch (error: any) {
          console.error('数据获取失败:', error);
          this.showError(`数据获取失败: ${error.message || error}`);
          return;
        }
        
        // 延迟初始化触摸事件，确保DOM已加载且完成主要渲染
        setTimeout(() => {
          this.initTouchEvents();
        }, 1000);
      } catch (error: any) {
        console.error('初始化失败:', error);
        this.showError(`加载失败: ${error.message}`);
      }
    },

    // 更新页面数据
    updatePageData(post: any, signature: any): void {
      console.log('更新页面数据:', { post, signature });
      
      // 清空和重置数据
      this.currentImageIndex = 0;
      this.noteSharedByOthers = false;
      
      // 强制Vue刷新DOM
      setTimeout(() => {
        // 更新状态数据
        this.postData = JSON.parse(JSON.stringify(post)); // 创建深拷贝以确保反应式更新
        this.signatureData = signature;
        this.totalImages = post.images ? post.images.length : 0;
        this.loading = false;
        
        // 重新初始化触摸事件（当显示新的笔记时）
        this.$nextTick(() => {
          this.initTouchEvents();
          this.setupButtonStyles(); // 更新按钮样式
        });
      }, 10);

      // 调试信息
      console.log('currentImageIndex:', this.currentImageIndex);
      console.log('totalImages:', post.images ? post.images.length : 0);
      console.log('loading:', this.loading);
      console.log('showShareButton:', post.isUsed !== 1 && post.is_used !== 1);
      console.log('currentIdentifier:', this.currentIdentifier);
    },

    // 显示错误信息
    showError(message: string, color: string = 'red'): void {
      this.error = message;
      this.errorColor = color;
      this.loading = false;
    },

    // 显示成功信息
    showSuccess(message: string): void {
      this.showError(message, 'green');
    },

    // 图片加载错误处理
    handleImageError(e: Event): void {
      const target = e.target as HTMLImageElement;
      if (target) target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"%3E%3Crect width="300" height="200" fill="%23f0f0f0"/%3E%3Ctext x="50%25" y="50%25" font-family="Arial" font-size="24" text-anchor="middle" dominant-baseline="middle" fill="%23999"%3E无图片%3C/text%3E%3C/svg%3E';
    },

    // 图片滑动函数
    slideImage(direction: number): void {
      // 如果正在过渡中，不处理新的滑动请求
      if (this.isTransitioning || !this.totalImages) return;
      this.isTransitioning = true;
      
      const oldIndex = this.currentImageIndex;
      this.currentImageIndex += direction;
      
      // 边界检查
      if (this.currentImageIndex < 0) {
        this.currentImageIndex = this.totalImages - 1;
      } else if (this.currentImageIndex >= this.totalImages) {
        this.currentImageIndex = 0;
      }
      
      const slider = this.$refs.imageSlider as HTMLElement;
      const images = slider.querySelector('.note-images') as HTMLElement;
      
      if (images) {
        // 根据滑动方向设置适当的动画效果
        const easingEffect = direction > 0 ? 'cubic-bezier(0.165, 0.84, 0.44, 1)' : 'cubic-bezier(0.55, 0.055, 0.675, 0.19)';
        
        // 添加滑动动画，使用高级缓动效果
        images.style.transition = `transform 0.4s ${easingEffect}`;
        images.style.transform = `translateX(-${this.currentImageIndex * 100}%)`;
        
        // 动画结束后重置状态
        setTimeout(() => {
          images.style.transition = '';
          this.isTransitioning = false;
        }, 400);
        
        // 触发滑动事件，可用于添加声音或其他反馈
        this.onSlideChanged(oldIndex, this.currentImageIndex);
      } else {
        // 如果没有找到图片容器，也要确保重置状态
        this.isTransitioning = false;
      }
      
      console.log('滑动图片:', this.currentImageIndex);
    },
    
    // 滑动变化事件，可以添加额外的反馈
    onSlideChanged(oldIndex: number, newIndex: number): void {
      console.log(`滑动从 ${oldIndex} 变更到 ${newIndex}`);
      
      // 可以在这里添加滑动声音或振动反馈
      if ('vibrate' in navigator) {
        try {
          navigator.vibrate(10); // 轻微振动10ms
        } catch (e) {
          // 忽略振动API错误
        }
      }
    },

    // 直接切换到指定滑动索引
    changeSlide(index: number): void {
      if (this.isTransitioning || index === this.currentImageIndex) return;
      
      // 记录当前索引，用于确定滑动方向
      const oldIndex = this.currentImageIndex;
      const direction = index > oldIndex ? 1 : -1;
      
      this.isTransitioning = true;
      this.currentImageIndex = index;
      
      const slider = this.$refs.imageSlider as HTMLElement;
      const images = slider.querySelector('.note-images') as HTMLElement;
      
      if (images) {
        // 添加过渡动画
        images.style.transition = `transform 0.4s cubic-bezier(0.215, 0.61, 0.355, 1)`;
        images.style.transform = `translateX(-${this.currentImageIndex * 100}%)`;
        
        // 动画结束后重置状态
        setTimeout(() => {
          images.style.transition = '';
          this.isTransitioning = false;
        }, 400);
        
        // 触发滑动变化事件
        this.onSlideChanged(oldIndex, index);
      }
    },

    // 检测是否在微信内置浏览器中打开
    isWechat(): boolean {
      return /MicroMessenger/i.test(navigator.userAgent);
    },

    // 检测是否为安卓设备
    isAndroid(): boolean {
      const ua = navigator.userAgent.toLowerCase();
      const isAndroid = /android/.test(ua);
      console.log('设备检测：', { 
        userAgent: ua, 
        isAndroid, 
        platform: navigator.platform 
      });
      return isAndroid;
    },

    // 新增：检测是否为桌面端
    isDesktop(): boolean {
      // 通过User Agent判断是否为移动设备
      const ua = navigator.userAgent.toLowerCase();
      const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(ua);
      // 通过屏幕宽度判断是否为大屏设备
      const isLargeScreen = window.innerWidth > 768;
      // 如果不是移动设备，并且是大屏，则认为是桌面端
      return !isMobile && isLargeScreen;
    },

    // 新增：关闭桌面端提示弹窗
    closeDesktopModal(): void {
      this.showDesktopModal = false;
    },

    // 打开外部浏览器
    openInBrowser(): void {
      // 获取当前页面URL（带参数）
      const currentUrl = window.location.href;
      console.log('尝试在外部浏览器打开:', currentUrl);
      
      try {
        // 尝试Android Intent方式打开，这是最通用的方式
        window.location.href = `intent://${window.location.host}${window.location.pathname}${window.location.search}#Intent;scheme=http;package=com.android.chrome;end`;
        
        // 备用方式：通用浏览器
        setTimeout(() => {
          try {
            // 尝试使用系统默认浏览器打开
            const defaultLink = document.createElement('a');
            defaultLink.href = currentUrl;
            defaultLink.target = '_system';
            defaultLink.style.display = 'none';
            document.body.appendChild(defaultLink);
            defaultLink.click();
          } catch (error) {
            console.error('默认浏览器打开失败:', error);
          }
        }, 500); // 减少等待时间
      } catch (error) {
        console.error('打开外部浏览器失败:', error);
      }
    },

    // 获取小红书帖子数据
    async getPostData(postId: string, isIdentifier?: boolean): Promise<any> {
      try {
        console.log('获取帖子数据，postId:', postId, 'isIdentifier:', isIdentifier);
        
        // 构建请求URL，与后端控制器保持一致
        let url: string;
        let useIdentifierQuery = false;
        
        // 如果明确指定了isIdentifier参数，使用该参数
        // 否则根据URL参数来源判断（从getUrlParams获取）
        if (isIdentifier !== undefined) {
          useIdentifierQuery = isIdentifier;
        } else {
          // 通过检查URL参数来判断是ID还是identifier
          const urlParams = this.getUrlParams();
          useIdentifierQuery = !!urlParams?.identifier && !urlParams?.id;
        }
        
        if (useIdentifierQuery) {
          // 如果是identifier，获取该identifier下未使用的第一篇笔记
          url = `${this.API_DOMAIN}/xhs-auto/notes?identifier=${encodeURIComponent(postId)}`;
          
          // 获取URL中的platform参数
          const urlParams = this.getUrlParams();
          const platform = urlParams?.platform || null;
          
          // 只有当URL中包含platform参数时，才添加到API请求中
          if (platform) {
            // 添加平台特定的查询条件
            const params = new URLSearchParams();
            params.append('platform', platform);
            
            // 附加查询参数
            if (params.toString()) {
              url += `&${params.toString()}`;
            }
          }
        } else {
          // 直接通过ID获取指定笔记
          url = `${this.API_DOMAIN}/xhs-auto/notes/${postId}`;
        }
        
        console.log('请求URL:', url);
        const response = await fetch(url);
        
        const result = await response.json();
        console.log('获取到的原始数据:', result);
        
        // 检查是否存在错误
        if (!response.ok) {
          throw new Error(`获取帖子数据失败: ${response.status} ${response.statusText}`);
        }
        
        // 确保返回的数据格式正确并处理不同的数据结构
        let post;
        
        // 适应后端返回格式变化：直接返回数据，而不是包含在data字段中
        if (useIdentifierQuery) {
          // 列表查询
          if (Array.isArray(result)) {
            if (result.length === 0) {
              throw new Error('没有找到符合条件的笔记');
            }
            post = result[0]; // 取第一条
          } else if (result.data && Array.isArray(result.data)) {
            // 兼容旧格式
            if (result.data.length === 0) {
              throw new Error('没有找到符合条件的笔记');
            }
            post = result.data[0]; // 取第一条
          } else {
            throw new Error('返回数据格式错误');
          }
        } else {
          // 直接获取单条数据
          post = result.data || result; // 优先使用data字段，否则直接使用返回的数据
        }
        
        console.log('处理后的帖子数据:', post);
        
        // 确保必要字段存在，如果不存在则使用默认值
        if (!post.title) {
          console.warn('帖子标题不存在，使用默认值');
          post.title = '无标题';
        }
        
        if (!post.content) {
          console.warn('帖子内容不存在，使用默认值');
          post.content = '无内容';
        }

        // 确保images是数组
        if (!post.images || !Array.isArray(post.images)) {
          console.warn('帖子图片不存在或格式错误，使用空数组');
          post.images = [];
        }

        // 更新发布状态
        this.updateUsedStatus(post);

        // 确保其他必要字段存在
        if (!post.type) {
          console.warn('帖子类型不存在，设置为默认类型');
          post.type = 'note';
        }

        return post;
      } catch (error) {
        console.error('获取帖子数据出错:', error);
        this.showError(`获取帖子数据失败: ${error}`);
        throw error;
      }
    },
    
    // 更新发布状态
    updateUsedStatus(post: any): void {
      if (!post) return;
      
      // 更新小红书发布状态
      // 兼容后端返回的不同字段名称：isUsed或is_used
      // 支持boolean、number和string类型
      const isUsed = post.isUsed !== undefined ? post.isUsed : 
                    (post.is_used !== undefined ? post.is_used : 0);
      
      // 转换为数字再比较
      let isUsedNumber;
      if (typeof isUsed === 'boolean') {
        isUsedNumber = isUsed ? 1 : 0;
      } else if (typeof isUsed === 'string') {
        isUsedNumber = isUsed.toLowerCase() === 'true' ? 1 : parseInt(isUsed, 10);
      } else {
        isUsedNumber = isUsed;
      }
      
      this.isXhsUsed = isUsedNumber === 1 || isUsed === true;
      
      // 更新抖音发布状态
      // 兼容后端返回的不同字段名称：isDouyinUsed或is_douyin_used
      const isDouyinUsed = post.isDouyinUsed !== undefined ? post.isDouyinUsed : 
                         (post.is_douyin_used !== undefined ? post.is_douyin_used : 0);
      
      // 转换为数字再比较
      let isDouyinUsedNumber;
      if (typeof isDouyinUsed === 'boolean') {
        isDouyinUsedNumber = isDouyinUsed ? 1 : 0;
      } else if (typeof isDouyinUsed === 'string') {
        isDouyinUsedNumber = isDouyinUsed.toLowerCase() === 'true' ? 1 : parseInt(isDouyinUsed, 10);
      } else {
        isDouyinUsedNumber = isDouyinUsed;
      }
      
      this.isDouyinUsed = isDouyinUsedNumber === 1 || isDouyinUsed === true;
      
      console.log('平台发布状态更新:', { xhs: this.isXhsUsed, douyin: this.isDouyinUsed });
    },

    // 获取签名数据
    async getSignatureData(): Promise<any> {
      try {
        const response = await fetch(`${this.API_DOMAIN}/xhs-auto/signature`);
        const result = await response.json();
        
        // 检查是否存在错误
        if (!response.ok) {
          throw new Error(`获取签名数据失败: ${response.status} ${response.statusText}`);
        }
        
        // 适应不同的返回格式
        if (result.data) {
          return result.data.data || result.data;
        }
        
        return result;
      } catch (error) {
        console.error('获取签名数据出错:', error);
        this.showError(`获取签名数据失败: ${error}`);
        throw error;
      }
    },

    // 小红书分享函数，保持与原始HTML完全一致
    xhsFn(): Promise<{success: boolean}> {
      return new Promise((resolve, reject) => {
        if (!this.postData || !this.signatureData) {
          reject(new Error('数据加载失败，请刷新页面重试') as unknown);
          return;
        }

        console.log('分享数据:', this.postData);
        console.log('签名数据:', this.signatureData);

        // 准备 verifyConfig 参数，处理不同的字段名称可能性
        const verifyConfig = {
          appKey: this.signatureData.appKey || this.signatureData.app_key,
          signature: this.signatureData.signature,
          timestamp: this.signatureData.timestamp,
          nonce: this.signatureData.nonce
        };

        console.log('准备分享，verifyConfig:', verifyConfig);

        // 检查小红书SDK是否存在
        if (!window.xhs) {
          console.error('未找到小红书SDK，尝试重新加载');
          this.loadXhsSDK();
          
          // 延迟500ms后再次检查
          setTimeout(() => {            
            try {
              this.executeShare(verifyConfig, resolve, reject);
            } catch (error) {
              reject(error);
            }
          }, 500);
          return;
        }
        
        try {
          this.executeShare(verifyConfig, resolve, reject);
        } catch (error) {
          reject(error);
        }
      });
    },
    
    // 执行分享操作
    executeShare(verifyConfig: any, resolve: (value: {success: boolean}) => void, reject: (reason?: unknown) => void): void {
      // 获取域名部分，用于API请求
      const apiDomain = this.API_DOMAIN;
      
      // 准备分享信息
      const shareInfo = {
        type: this.postData.type,
        title: this.postData.title,
        content: this.postData.content,
        images: this.postData.images,
        video: this.postData.video || '',
        cover: this.postData.cover || ''
      };
      
      // 安全检查 - 如果签名或appKey被混淆，请求真实签名
      if (!verifyConfig.appKey || verifyConfig.appKey.includes('*')) {
        console.log('检测到appKey被混淆，获取完整签名信息');
        
        // 发起专门的安全签名请求
        fetch(`${apiDomain}/xhs-auto/signature`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          // 发送原始签名信息作为认证
          body: JSON.stringify({
            signature: verifyConfig.signature,
            timestamp: verifyConfig.timestamp,
            nonce: verifyConfig.nonce
          })
        })
        .then(response => response.json())
        .then(data => {
          if (data && data.data) {
            // 使用安全接口返回的完整签名信息
            const secureConfig = data.data;
            this.performShare(shareInfo, secureConfig, resolve, reject);
            console.log('成功调用小红书分享方法');
          } else {
            reject(new Error('获取完整签名信息失败'));
          }
        })
        .catch(error => {
          console.error('获取完整签名信息失败:', error);
          reject(error);
        });
      } else {
        // 直接使用原始签名信息
        this.performShare(shareInfo, verifyConfig, resolve, reject);
        console.log('成功调用小红书分享方法');
      }
    },
    
    // 执行实际的分享操作
    performShare(shareInfo: any, verifyConfig: any, resolve: (value: {success: boolean}) => void, reject: (reason?: unknown) => void): void {
      console.log('执行分享，分享信息:', shareInfo);
      console.log('验证配置:', verifyConfig);
      
      // 直接调用小红书SDK分享
      this.doShareWithXhs(shareInfo, verifyConfig, resolve, reject);
      // 只有在非调试模式下才更新服务器状态
      if (!this.isDebug && this.postData && this.postData.id) {
          console.log('标记笔记为已使用，ID:', this.postData.id);
          
          // 构建请求URL，决定平台参数
          const urlParams = this.getUrlParams();
          const platform = urlParams?.platform || null;
          let url = `${this.API_DOMAIN}/xhs-auto/notes/${this.postData.id}/used`;
          
          // 只有当URL中包含platform参数时，才添加到API请求中
          if (platform === 'xhs') {
            url += `?platform=xhs`;
          }
          
          // 调用API标记笔记已使用
          fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            }
          })
          .then(response => response.json())
          .then(result => {
            console.log('标记笔记状态结果:', result);
            
            // 更新本地状态
            this.isXhsUsed = true;
            
            // 分享成功提示
            this.showSuccess('分享成功！');
          })
          .catch(error => {
            console.error('标记笔记状态失败:', error);
            // 即使标记失败，也算分享成功
            this.showSuccess('分享成功！(状态更新失败)');
          });
        } else if (this.isDebug) {
          console.log('调试模式：分享成功，但不更新笔记状态');
          // 分享成功提示
          this.showSuccess('分享成功！(调试模式)');
        } else {
          // 普通成功提示
          this.showSuccess('分享成功！');
        }
    },
    
    // 实际调用小红书SDK进行分享
    doShareWithXhs(shareInfo: any, verifyConfig: any, resolve: (value: {success: boolean}) => void, reject: (reason?: unknown) => void): void {
      window.xhs.share({
        shareInfo: shareInfo,
        verifyConfig: verifyConfig,
        fail: (e: any) => {
          console.log('分享失败:', e);
          // 显示错误弹窗
          this.showErrorDialog(`分享失败: ${e.message || '未知错误'}`);
          reject(e);
        },
        success: () => {
          console.log('分享成功');
          
          resolve({success: true});
        }
      });
    },

    // 分享到小红书，与后端控制器保持一致
    async shareToXhs(): Promise<void> {
      try {
        // 检测是否为桌面端且不在调试模式下
        if (this.isDesktop() && !this.isDebug) {
          // 在桌面端，显示提示弹窗
          console.log('检测到桌面端访问，显示提示弹窗');
          
          // 生成当前页面的二维码
          try {
            const currentUrl = window.location.href;
            // 确保删除isPreview参数
            let shareUrl = currentUrl;
            if (currentUrl.includes('isPreview=')) {
              const urlObj = new URL(currentUrl);
              const hashPart = urlObj.hash;
              if (hashPart.includes('?')) {
                const [routePath, queryParams] = hashPart.split('?');
                const params = new URLSearchParams(queryParams);
                params.delete('isPreview');
                const newQueryString = params.toString();
                const newHashPart = newQueryString ? `${routePath}?${newQueryString}` : routePath;
                shareUrl = `${urlObj.origin}${urlObj.pathname}#${newHashPart}`;
              }
            }
            
            // 使用第三方服务生成二维码，更新尺寸为250x250
            this.qrCodeUrl = `https://xhs.aivip1.top/api/html-render/qrcode?size=100x100&data=${encodeURIComponent(shareUrl)}`;
            this.showDesktopModal = true;
            return;
          } catch (error) {
            console.error('生成二维码失败:', error);
            this.qrCodeUrl = '';
          }
        }
        
        // 重置状态标志
        this.noteSharedByOthers = false;
        
        // 如果是安卓微信环境，引导用户到外部浏览器
        if (this.isWechatAndroid) {
          console.log('安卓微信环境下点击分享，引导用户到外部浏览器');
          
          // 先设置一个明显的提示
          document.body.classList.add('wechat-open-browser');
          
          // 显示更加突出的提示
          this.showError('点击右上角菜单，选择"在浏览器打开"', '#ff7700');
          
          // 创建或更新弹窗提示
          const tipElement = document.createElement('div');
          tipElement.className = 'wechat-open-tip';
          tipElement.innerHTML = `
            <div class="tip-content">
              <div class="tip-icon">↗️</div>
              <div class="tip-text">
                <strong>请点击右上角</strong>
                <br>然后选择"在浏览器中打开"
              </div>
              <div class="tip-close" onclick="this.parentNode.parentNode.remove()">×</div>
            </div>
          `;
          document.body.appendChild(tipElement);
          
          // 3秒后尝试自动打开
          setTimeout(() => {
            this.openInBrowser();
          }, 3000);
          
          return;
        }

        if (!this.postData || !this.signatureData) {
          this.showError('数据未准备好，请稍后再试');
          return;
        }

        // 再次获取笔记详情，检查是否已被发布
        try {
          const latestPostData = await this.getPostData(this.postData.id);
          
          // 使用更新后的状态检查
          if (this.isXhsUsed) {
            // 使用状态标记而不是错误提示
            this.noteSharedByOthers = true;
            return;
          }
        } catch (error) {
          console.error('获取最新笔记状态失败:', error);
          // 继续执行，即使获取失败也尝试分享
        }

        // 调用小红书分享功能
        try {
          // 调用分享功能，等待结果返回
          const shareResult = await this.xhsFn();
          console.log('小红书分享调用成功:', shareResult);
        } catch (error: any) {
          console.error('分享失败:', error);
          // 显示错误弹窗
          this.showErrorDialog(`分享失败: ${error.message || '未知错误'}`);
          this.showError(`分享失败: ${error.message || '未知错误'}`);
        }
      } catch (error: any) {
        console.error('分享操作发生异常:', error);
        // 显示错误弹窗
        this.showErrorDialog(`分享失败: ${error.message || '未知错误'}`);
        this.showError(`分享失败: ${error.message || '未知错误'}`);
      }
    },

    // 加载下一篇笔记
    async loadNextNote(isSequentialArg?: boolean): Promise<void> {
      if (this.nextButtonDisabled) return; // 防止重复点击
      
      try {
        // 显示加载状态
        this.loading = true;
        this.error = '';
        this.nextButtonDisabled = true;
        this.noteSharedByOthers = false;
        
        // 从URL参数获取isSequential，默认为'0'（随机选取）
        const urlParams = this.getUrlParams();
        const isSequentialFromUrl = urlParams?.isSequential || '0';
        
        // 优先使用参数，其次使用URL参数
        const isSequential = isSequentialArg !== undefined ? isSequentialArg : (isSequentialFromUrl === '1');

        console.log('当前笔记数据:', {
          currentIdentifier: this.currentIdentifier,
          postId: this.postData?.id,
          platform: this.preferredSharePlatform,
          isSequential: isSequential
        });

        // 构建请求URL，与后端控制器保持一致
        // 修改为获取指定identifier下一篇未发布的笔记
        let url = `${this.API_DOMAIN}/xhs-auto/notes`;
        const params = new URLSearchParams();
        
        if (this.currentIdentifier) {
          params.append('isUsed', '0'); // 查询未使用的笔记，使用"0"表示未使用
          params.append('identifier', this.currentIdentifier);
          
          if (this.postData && this.postData.id) {
            // 查询大于当前id的下一篇
            params.append('id', this.postData.id.toString());
          }
          
          // 添加平台参数
          if (this.preferredSharePlatform) {
            // 获取URL中的platform参数
            const platform = urlParams?.platform || null;
            
            // 只有当URL中包含platform参数时，才添加到API请求中
            if (platform) {
              params.append('platform', platform);
            }
          }
          
          // 添加是否按顺序选取参数
          params.append('isSequential', isSequential ? '1' : '0');
        }
        
        url = `${url}?${params.toString()}`;

        console.log('请求下一篇笔记，URL:', url);
        const response = await fetch(url);
        
        // 适应后端返回格式变化
        let result = await response.json();
        console.log('获取到的下一篇笔记原始数据:', result);
        
        // 存储当前标识符，以防处理过程中被修改
        const currentIdentifierBackup = this.currentIdentifier;
        
        // 处理后端返回的数据
        // 1. 如果直接返回数组，取第一个元素
        // 2. 如果返回对象中包含data数组，取data的第一个元素
        let nextPost = null;
        
        if (Array.isArray(result)) {
          // 直接返回数组
          if (result.length > 0) {
            nextPost = result[0];
          }
        } else if (result.data && Array.isArray(result.data)) {
          // 返回对象中包含data数组
          if (result.data.length > 0) {
            nextPost = result.data[0];
          }
        } else {
          // 直接返回单个对象
          nextPost = result;
        }
        
        // 检查是否存在错误
        if (!response.ok) {
          if (response.status === 404) {
            this.showError('没有更多笔记了');
            this.currentIdentifier = ''; // 清空标识符，隐藏下一篇按钮
            return;
          }
          throw new Error(`获取下一篇笔记失败: ${response.status} ${response.statusText}`);
        }
        
        // 检查是否有笔记数据
        if (!nextPost) {
          this.showError('没有更多笔记了');
          this.currentIdentifier = ''; // 清空标识符，隐藏下一篇按钮
          return;
        }
        
        // 检查是否获取到新笔记
        if (nextPost.id === this.postData?.id) {
          this.showError('没有更多笔记了');
          this.currentIdentifier = ''; // 清空标识符，隐藏下一篇按钮
          return;
        }

        // 获取签名数据
        const signature = await this.getSignatureData();

        // 确保标识符未被修改
        if (this.currentIdentifier === currentIdentifierBackup) {
          // 更新当前标识符
          this.currentIdentifier = nextPost.identifier || this.currentIdentifier;
        }

        // 更新页面数据，显示新笔记
        this.updatePageData(nextPost, signature);

        // 新增：强制刷新按钮状态
        this.updateUsedStatus(nextPost);

        // 更新按钮状态
        this.nextButtonDisabled = false;
      } catch (error: any) {
        console.error('加载下一篇笔记失败:', error);
        this.showError(`加载下一篇笔记失败: ${error.message}`);
        this.nextButtonDisabled = false;
      }
    },
    
    // 获取抖音Schema
    async getDouyinSchema(retryCount = 0): Promise<string> {
      try {
        // 更严格地检查postData和id
        if (!this.postData) {
          throw new Error('笔记数据不存在');
        }
        
        if (!this.postData.id) {
          throw new Error('笔记ID不存在');
        }
        
        const noteId = this.postData.id;
        this.douyinSchemaLoading = true;
        this.douyinSchemaError = '';
        
        // 构建API URL - 直接使用ID，不传递额外参数，因为后端已有默认固定值
        const apiUrl = `${this.API_DOMAIN}/xhs-auto/douyin-schema/${noteId}`;
        console.log('请求抖音Schema, URL:', apiUrl);
        
        // 设置请求超时
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15秒超时
        
        try {
          const response = await fetch(apiUrl, {
            signal: controller.signal,
            headers: {
              'Accept': 'application/json',
              'Cache-Control': 'no-cache'
            }
          });
          
          // 清除超时计时器
          clearTimeout(timeoutId);
          
          // 检查响应类型，避免非JSON响应导致解析错误
          const contentType = response.headers.get('content-type');
          if (!contentType || !contentType.includes('application/json')) {
            console.error('API返回非JSON格式:', contentType);
            // 获取响应文本用于调试
            const responseText = await response.text();
            console.error('API返回内容:', responseText.substring(0, 200) + '...');
            throw new Error('API返回格式错误，请联系管理员');
          }
          
          const result = await response.json();
          
          if (!response.ok) {
            throw new Error(`获取抖音分享链接失败: ${response.status} ${response.statusText}`);
          }
          
          // 处理嵌套的返回结构 - 针对实际返回的数据格式
          // {"code":200,"data":{"code":200,"message":"success","data":"snssdk1128://..."},"success":true,"message":"请求成功"}
          let schemaUrl = '';
          
          // 记录完整返回结构用于调试
          console.log('API返回完整数据:', JSON.stringify(result).substring(0, 200) + '...');
          
          if (result.data && typeof result.data === 'object' && result.data.data) {
            // 如果返回的是嵌套对象，取data.data
            schemaUrl = result.data.data;
          } else if (result.data && typeof result.data === 'string') {
            // 如果返回的data直接是字符串，直接使用
            schemaUrl = result.data;
          } else {
            throw new Error('获取抖音分享链接失败: 返回数据格式不正确');
          }
          
          if (!schemaUrl) {
            throw new Error('获取抖音分享链接失败: 返回数据为空');
          }
          
          // 确保URL是完整的抖音schema URL
          if (!schemaUrl.startsWith('snssdk1128://')) {
            console.warn('返回的URL不是抖音schema格式，尝试修复:', schemaUrl);
            
            // 如果返回的不是抖音schema格式，尝试修复
            if (schemaUrl.includes('snssdk1128://')) {
              // 提取snssdk1128://部分
              const schemaMatch = schemaUrl.match(/(snssdk1128:\/\/[^\s"']+)/);
              if (schemaMatch && schemaMatch[1]) {
                schemaUrl = schemaMatch[1];
                console.log('提取到的抖音schema链接:', schemaUrl);
              }
            } else {
              console.error('无法从返回数据中找到有效的抖音schema链接');
              throw new Error('返回的不是有效的抖音schema链接');
            }
          }
          
          console.log('获取到的抖音分享链接:', schemaUrl);
          this.douyinSchema = schemaUrl;
          return schemaUrl;
        } catch (fetchError: any) {
          // 清除超时计时器（如果未触发）
          clearTimeout(timeoutId);
          
          // 处理超时错误
          if (fetchError.name === 'AbortError') {
            throw new Error('获取分享链接超时，请稍后再试');
          }
          
          // 其他网络错误，向上抛出
          throw fetchError;
        }
      } catch (error: any) {
        // 增强错误处理
        let errorMessage = error.message || '未知错误';
        
        // 检查是否是JSON解析错误
        if (error instanceof SyntaxError && errorMessage.includes('JSON')) {
          errorMessage = 'API返回格式错误，服务器可能暂时不可用';
          console.error('JSON解析错误，可能是服务器返回了非JSON格式:', error);
        }
        
        console.error('获取抖音分享链接失败:', error);
        
        // 尝试重试（最多3次）
        if (retryCount < 2) {
          console.log(`尝试第${retryCount + 1}次重试...`);
          // 显示重试提示
          this.douyinSchemaError = `获取链接中(${retryCount + 1}/3)...`;
          
          // 延迟1秒后重试
          return new Promise((resolve, reject) => {
            setTimeout(async () => {
              try {
                const result = await this.getDouyinSchema(retryCount + 1);
                resolve(result);
              } catch (retryError) {
                // 如果重试全部失败，将显示最后一次的错误
                this.douyinSchemaError = `获取抖音分享链接失败: ${errorMessage}`;
                reject(retryError);
              }
            }, 1000);
          });
        }
        
        // 所有重试都失败了，显示错误信息
        this.douyinSchemaError = `获取抖音分享链接失败: ${errorMessage}`;
        throw error;
      } finally {
        // 只有在不是重试过程中才设置加载状态为false
        if (retryCount === 0) {
          this.douyinSchemaLoading = false;
        }
      }
    },
    
    // 分享到抖音
    async shareToDouyin(): Promise<void> {
      try {
        // 检测是否为桌面端且不在调试模式下
        if (this.isDesktop() && !this.isDebug) {
          // 在桌面端，显示提示弹窗
          console.log('检测到桌面端访问，显示提示弹窗');
          
          // 生成当前页面的二维码
          try {
            const currentUrl = window.location.href;
            // 确保删除isPreview参数
            let shareUrl = currentUrl;
            if (currentUrl.includes('isPreview=')) {
              const urlObj = new URL(currentUrl);
              const hashPart = urlObj.hash;
              if (hashPart.includes('?')) {
                const [routePath, queryParams] = hashPart.split('?');
                const params = new URLSearchParams(queryParams);
                params.delete('isPreview');
                const newQueryString = params.toString();
                const newHashPart = newQueryString ? `${routePath}?${newQueryString}` : routePath;
                shareUrl = `${urlObj.origin}${urlObj.pathname}#${newHashPart}`;
              }
            }
            
            // 使用第三方服务生成二维码
            this.qrCodeUrl = `https://xhs.aivip1.top/api/html-render/qrcode?size=200x200&data=${encodeURIComponent(shareUrl)}`;
            this.showDesktopModal = true;
            return;
          } catch (error) {
            console.error('生成二维码失败:', error);
            this.qrCodeUrl = '';
          }
        }
        
        // 重置状态
        this.douyinShared = false;
        
        // 检查是否在微信浏览器中，不仅限于Android
        if (this.isWechat()) {
          console.log('微信环境下点击分享，引导用户到外部浏览器');
          
          // 设置明显的提示
          document.body.classList.add('wechat-open-browser');
          this.showError('请点击右上角菜单，选择"在浏览器打开"以继续操作', '#ff7700');
          
          // 创建弹窗提示
          const tipElement = document.createElement('div');
          tipElement.className = 'wechat-open-tip';
          tipElement.innerHTML = `
            <div class="tip-content">
              <div class="tip-icon">↗️</div>
              <div class="tip-text">
                <strong>请点击右上角菜单</strong>
                <br>然后选择"在浏览器中打开"
                <br><small>微信环境下无法直接分享到抖音</small>
              </div>
              <div class="tip-close" onclick="this.parentNode.parentNode.remove()">×</div>
            </div>
          `;
          document.body.appendChild(tipElement);
          
          // 尝试自动打开
          setTimeout(() => {
            this.openInBrowser();
          }, 3000);
          
          return;
        }
        
        if (!this.postData) {
          this.showError('数据未准备好，请稍后再试');
          return;
        }
        
        // 显示获取链接状态
        this.douyinSchemaLoading = true;
        
        // 获取抖音跳转链接
        let schemaUrl: string;
        try {
          // 每次分享时都获取新的链接，确保签名最新
          schemaUrl = await this.getDouyinSchema();
          
          // 打印完整的链接信息，用于调试签名问题
          console.log('%c抖音分享完整链接信息', 'color: green; font-weight: bold;', {
            完整链接: schemaUrl,
            长度: schemaUrl.length,
            时间戳: new Date().toLocaleString()
          });
          
          // 使用专门的方法分析签名参数
          this.analyzeDouyinSignature(schemaUrl);
          
          // 链接获取成功后重置loading状态
          this.douyinSchemaLoading = false;
        } catch (error: any) {
          this.douyinSchemaLoading = false;
          this.showError(`获取抖音分享链接失败: ${error.message}`);
          return;
        }
        
        // 打开抖音分享链接
        console.log('打开抖音分享链接:', schemaUrl);

        // 记录事件，用于后续检查分享是否成功
        const shareStartedTime = new Date().getTime();
        
        // 使用营销页面常用的多种方式进行唤起
        this.openDouyinOptimized(schemaUrl);
        
        // 设置临时分享状态，用于UI反馈
        this.douyinShared = true;
        this.showSuccess('正在跳转到抖音...');
        
        // 延迟一定时间后，假定用户完成了分享操作
        // 在实际场景中，由于无法直接获取抖音分享结果，我们假设用户成功完成了分享
        setTimeout(async () => {
          // 仅在非调试模式下更新服务器状态
          if (!this.isDebug && this.postData && this.postData.id) {
            try {
              // 构建API URL，始终添加platform=douyin参数，确保只修改抖音的发布状态
              let url = `${this.API_DOMAIN}/xhs-auto/notes/${this.postData.id}/used?platform=douyin`;
              
              const markResponse = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
              });
              
              console.log('标记抖音发布状态响应:', {
                状态码: markResponse.status,
                状态文本: markResponse.statusText
              });
              
              const result = await markResponse.json();
              console.log('标记抖音发布状态结果:', result);
              
              // 更新本地状态
              if (this.postData) {
                // 只设置douyinUsed字段为true，不修改其他平台状态
                this.postData.douyinUsed = true;
                
                // 保持兼容性，更新其他可能的字段
                if ('douyin_status' in this.postData) {
                  this.postData.douyin_status = true;
                }
                
                // 更新全局状态标记
                this.isDouyinUsed = true;
              }
            } catch (error) {
              console.error('标记抖音发布状态失败:', error);
            }
          } else if (this.isDebug) {
            console.log('调试模式：抖音分享不更新服务器状态');
          }
        }, 5000); // 延迟5秒，假设用户完成了分享
        
      } catch (error: any) {
        console.error('分享到抖音失败:', error);
        // 显示错误弹窗
        this.showErrorDialog(`分享到抖音失败: ${error.message || '未知错误'}`);
        this.showError(`分享到抖音失败: ${error.message || '未知错误'}`);
      }
    },

    // 优化的抖音唤起方法，参考电商营销页面实现
    openDouyinOptimized(schemaUrl: string): void {
      console.log('%c尝试唤起抖音应用', 'color: orange; font-weight: bold;', {
        设备类型: /iPhone|iPad|iPod/i.test(navigator.userAgent) ? 'iOS' : 'Android',
        浏览器: navigator.userAgent,
        链接: schemaUrl,
        时间: new Date().toLocaleString()
      });
      
      // 确保URL有效
      if (!schemaUrl) {
        this.showError('抖音分享链接无效');
        return;
      }
      
      // 创建下载页链接
      const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
      const downloadUrl = isIOS 
        ? 'https://apps.apple.com/cn/app/id1142110895' 
        : 'https://www.douyin.com/download';
      
      // 记录开始时间，用于检测是否成功唤起
      const startTime = Date.now();
      
      // 创建保底跳转函数，如果唤起失败则显示分享链接对话框
      const fallbackHandler = () => {
        const endTime = Date.now();
        
        // 如果页面仍在，且间隔小于2.5秒，认为应用可能未唤起成功
        if (endTime - startTime < 2500) {
          console.log('抖音可能未成功唤起，显示分享链接对话框');
          // 直接显示分享对话框，而不是跳转到下载链接
          this.showOpenDouyinDialog(schemaUrl, downloadUrl);
        }
      };
      
      // 设置延迟跳转
      setTimeout(fallbackHandler, 2500);
      
      try {
        if (isIOS) {
          // iOS设备唤起策略
          this.openDouyinInIOS(schemaUrl, downloadUrl);
        } else {
          // Android设备唤起策略
          this.openDouyinInAndroid(schemaUrl, downloadUrl);
        }
      } catch (error) {
        console.error('唤起抖音失败:', error);
        // 显示分享链接对话框
        this.showOpenDouyinDialog(schemaUrl, downloadUrl);
      }
    },
    
    // iOS设备唤起抖音的专用方法
    openDouyinInIOS(schemaUrl: string, downloadUrl: string): void {
      console.log('%ciOS设备唤起抖音', 'color: purple; font-weight: bold;', {
        原始链接: schemaUrl,
        使用方式: 'iframe + location.href',
        时间: new Date().toLocaleString()
      });
      
      // iOS Safari会有弹窗询问是否打开应用
      // 使用iframe方式尝试唤起
        const iframe = document.createElement('iframe');
      iframe.setAttribute('style', 'display:none');
      iframe.src = schemaUrl;
        document.body.appendChild(iframe);
        
      // 清理iframe
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 2000);
      
      // 同时，使用location.href作为备选方案
      // 延迟一点时间，让iframe先尝试
      setTimeout(() => {
        try {
          console.log('%ciOS通过location.href跳转', 'color: #ff5500; font-size: 14px; font-weight: bold;', {
            跳转链接: schemaUrl,
            时间: new Date().toLocaleTimeString(),
            navigator: navigator.userAgent.substring(0, 100)
          });
          window.location.href = schemaUrl;
        } catch (e) {
          console.error('location跳转失败:', e);
        }
      }, 100);
    },
    
    // Android设备唤起抖音的专用方法
    openDouyinInAndroid(schemaUrl: string, downloadUrl: string): void {
      console.log('%cAndroid设备唤起抖音', 'color: brown; font-weight: bold;', {
        原始链接: schemaUrl,
        时间: new Date().toLocaleString()
      });
      
      // 再次分析签名参数（在实际跳转前）
      this.analyzeDouyinSignature(schemaUrl);
      
      // 创建不可见的iframe
      const iframe = document.createElement('iframe');
      iframe.setAttribute('style', 'display:none;border:0;width:0;height:0;');
      document.body.appendChild(iframe);
      
      // Android通常有更多支持的方式
      // 1. 使用intent协议改写URL
      const intentUrl = this.convertToIntentUrl(schemaUrl);
      console.log('%cAndroid Intent URL', 'color: #ff9900; font-weight: bold;', {
        转换后Intent链接: intentUrl || '转换失败',
        时间: new Date().toLocaleString()
      });
      
      // 2. 使用iframe设置src
      try {
        iframe.src = schemaUrl;
      } catch (e) {
        console.error('iframe设置src失败:', e);
      }
        
      // 3. 使用window.location跳转到intent URL
        setTimeout(() => {
        try {
          const finalUrl = intentUrl || schemaUrl;
          console.log('%cAndroid通过location.href跳转', 'color: #ff5500; font-size: 14px; font-weight: bold;', {
            跳转链接类型: intentUrl ? 'intent链接' : '原始schema链接',
            跳转链接: finalUrl.substring(0, 100) + '...',
            完整链接长度: finalUrl.length,
            时间: new Date().toLocaleTimeString(),
            navigator: navigator.userAgent.substring(0, 100)
          });
          window.location.href = finalUrl;
        } catch (e) {
          console.error('location跳转失败:', e);
          }
      }, 100);
          
          // 清理iframe
      setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
      }, 1500);
      
      // 4. 尝试使用window.open作为备选方案
      setTimeout(() => {
        try {
          console.log('%c通过window.open跳转', 'color: #ff5500; font-size: 14px; font-weight: bold;', {
            跳转链接: schemaUrl.substring(0, 100) + '...',
            完整链接长度: schemaUrl.length,
            时间: new Date().toLocaleTimeString()
          });
          window.open(schemaUrl, '_self');
        } catch (e) {
          console.error('window.open失败:', e);
        }
      }, 200);
      
      // 5. 使用a标签点击方法
      setTimeout(() => {
        try {
          console.log('%c通过a标签点击跳转', 'color: #ff5500; font-size: 14px; font-weight: bold;', {
            跳转链接: schemaUrl.substring(0, 100) + '...',
            完整链接长度: schemaUrl.length,
            时间: new Date().toLocaleTimeString()
          });
          const a = document.createElement('a');
          a.setAttribute('href', schemaUrl);
          a.setAttribute('style', 'display:none');
          document.body.appendChild(a);
          a.click();
          
          // 移除a标签
          setTimeout(() => {
            if (document.body.contains(a)) {
              document.body.removeChild(a);
            }
          }, 500);
        } catch (e) {
          console.error('a标签点击方法失败:', e);
        }
      }, 300);
    },
    
    // 将抖音schema URL转换为intent格式
    convertToIntentUrl(schemaUrl: string): string {
      // 判断是否为抖音专用协议
      if (!schemaUrl.startsWith('snssdk1128://')) {
        console.warn('链接不是抖音专用协议，无法转换为intent格式:', schemaUrl);
        return '';
      }
      
      try {
        // 解析原始URL参数
        const queryStart = schemaUrl.indexOf('?');
        if (queryStart === -1) {
          console.warn('抖音链接没有参数部分，无法转换:', schemaUrl);
          return '';
        }
        
        const queryPart = schemaUrl.substring(queryStart + 1);
        const path = schemaUrl.substring(0, queryStart).replace('snssdk1128://', '');
        
        // 构建intent URL
        const packageName = 'com.ss.android.ugc.aweme';
        const action = 'android.intent.action.VIEW';
        const intentUrl = `intent://${path}?${queryPart}#Intent;scheme=snssdk1128;package=${packageName};action=${action};end`;
        
        console.log('%c生成intent URL成功', 'color: green; font-weight: bold;', {
          原始链接: schemaUrl.substring(0, 50) + '...',
          路径部分: path,
          参数部分: queryPart.substring(0, 50) + '...',
          完整Intent: intentUrl.substring(0, 50) + '...',
          时间: new Date().toLocaleString()
        });
        return intentUrl;
      } catch (e) {
        console.error('转换intent URL失败:', e);
        return '';
      }
    },
    
    // 显示抖音打开选项对话框
    showOpenDouyinDialog(schemaUrl: string, downloadUrl: string): void {
      console.log('显示抖音打开选项对话框，完整链接:', schemaUrl);
      
      // 移除可能存在的旧对话框
      const oldDialog = document.querySelector('.douyin-open-dialog');
      if (oldDialog && oldDialog.parentNode) {
        oldDialog.parentNode.removeChild(oldDialog);
      }
      
      // 创建对话框
      const dialog = document.createElement('div');
      dialog.className = 'douyin-open-dialog';
      dialog.innerHTML = `
        <div class="dialog-overlay"></div>
        <div class="dialog-content">
          <div class="dialog-header">
            <h3>打开抖音</h3>
            <button class="close-btn">&times;</button>
          </div>
          <div class="dialog-body">
            <p class="dialog-tip">未检测到抖音APP或打开失败，请选择以下操作：</p>
            
            <div class="schema-url-container">
              <div class="schema-url-label">分享链接：</div>
              <div class="schema-url-value">${schemaUrl.substring(0, 100)}...</div>
              <button class="copy-url-btn">复制完整链接</button>
            </div>
            
            <div class="dialog-buttons">
              <button class="open-btn">
                <span class="icon">🚀</span>
                <span class="text">重新打开抖音</span>
              </button>
              <button class="download-btn">
                <span class="icon">📲</span>
                <span class="text">下载抖音</span>
              </button>
              <button class="copy-btn">
                <span class="icon">📋</span>
                <span class="text">复制分享链接</span>
              </button>
              <button class="browser-btn">
                <span class="icon">🌐</span>
                <span class="text">在浏览器中打开</span>
              </button>
            </div>
          </div>
          <div class="dialog-footer">
            <p class="note">提示：如果已安装抖音但无法打开，可能是网络问题或签名已过期</p>
            <p class="note">您可以尝试复制链接并直接在浏览器地址栏粘贴访问</p>
          </div>
        </div>
      `;
      
      // 添加样式
      const style = document.createElement('style');
      style.textContent = `
        .douyin-open-dialog {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: fadeIn 0.3s;
        }
        
        .dialog-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(4px);
        }
        
        .dialog-content {
          position: relative;
          background: white;
          border-radius: 12px;
          width: 90%;
          max-width: 420px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
          overflow: hidden;
          animation: slideUp 0.3s;
        }
        
        .dialog-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px 20px;
          border-bottom: 1px solid #eee;
          background: #ff2c55;
          color: white;
        }
        
        .dialog-header h3 {
          margin: 0;
          font-size: 18px;
          color: white;
        }
        
        .close-btn {
          background: none;
          border: none;
          font-size: 24px;
          color: white;
          cursor: pointer;
        }
        
        .dialog-body {
          padding: 20px;
        }
        
        .dialog-tip {
          margin: 0 0 15px;
          color: #666;
        }
        
        .schema-url-container {
          background: #f7f7f7;
          border: 1px solid #eee;
          border-radius: 8px;
          padding: 12px;
          margin-bottom: 20px;
        }
        
        .schema-url-label {
          font-weight: bold;
          color: #333;
          margin-bottom: 8px;
        }
        
        .schema-url-value {
          font-family: monospace;
          word-break: break-all;
          background: #fff;
          border: 1px solid #ddd;
          padding: 8px;
          border-radius: 4px;
          color: #0066cc;
          max-height: 60px;
          overflow-y: auto;
          margin-bottom: 8px;
        }
        
        .copy-url-btn {
          background: #2196F3;
          color: white;
          border: none;
          border-radius: 4px;
          padding: 6px 12px;
          font-size: 14px;
          cursor: pointer;
          width: 100%;
        }
        
        .dialog-buttons {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        
        .dialog-buttons button {
          border: none;
          border-radius: 8px;
          padding: 12px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: #f7f7f7;
          cursor: pointer;
          transition: background 0.2s;
        }
        
        .dialog-buttons button:hover {
          background: #eee;
        }
        
        .dialog-buttons .open-btn {
          background: #ff2c55;
          color: white;
        }
        
        .dialog-buttons .open-btn:hover {
          background: #e61e4d;
        }
        
        .dialog-buttons .icon {
          font-size: 24px;
          margin-bottom: 8px;
        }
        
        .dialog-footer {
          padding: 15px 20px;
          border-top: 1px solid #eee;
          background: #f9f9f9;
        }
        
        .dialog-footer .note {
          margin: 5px 0;
          font-size: 12px;
          color: #666;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          from { transform: translateY(30px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `;
      
      // 添加到DOM
      document.head.appendChild(style);
      document.body.appendChild(dialog);
      
      // 添加事件监听器
      // 关闭按钮
      const closeBtn = dialog.querySelector('.close-btn');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => {
          document.body.removeChild(dialog);
        });
      }
      
      // 复制完整链接按钮
      const copyUrlBtn = dialog.querySelector('.copy-url-btn');
      if (copyUrlBtn) {
        copyUrlBtn.addEventListener('click', () => {
          try {
            // 创建临时textarea来复制文本
            const textarea = document.createElement('textarea');
            textarea.value = schemaUrl;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            
            // 显示成功提示
            copyUrlBtn.textContent = '✓ 复制成功';
            // 使用类型断言解决lint错误
            (copyUrlBtn as HTMLElement).style.background = '#4CAF50';
            
            // 3秒后恢复按钮文字
            setTimeout(() => {
              copyUrlBtn.textContent = '复制完整链接';
              (copyUrlBtn as HTMLElement).style.background = '#2196F3';
            }, 3000);
          } catch (e) {
            console.error('复制链接失败:', e);
            copyUrlBtn.textContent = '✗ 复制失败';
            (copyUrlBtn as HTMLElement).style.background = '#F44336';
          }
        });
      }
      
      // 重新打开抖音按钮
      const openBtn = dialog.querySelector('.open-btn');
      if (openBtn) {
        openBtn.addEventListener('click', () => {
          try {
            // 添加打印日志，记录用户手动点击重新打开
            console.log('%c用户点击重新打开抖音按钮', 'color: #ff5500; font-size: 14px; font-weight: bold;', {
              跳转链接: schemaUrl.substring(0, 100) + '...',
              完整链接长度: schemaUrl.length,
              时间: new Date().toLocaleTimeString()
            });
            // 再次尝试打开
            window.location.href = schemaUrl;
            
            // 关闭对话框
            setTimeout(() => {
              if (document.body.contains(dialog)) {
                document.body.removeChild(dialog);
              }
            }, 500);
          } catch (e) {
            console.error('重新打开抖音失败:', e);
          }
        });
      }
      
      // 下载抖音按钮
      const downloadBtn = dialog.querySelector('.download-btn');
      if (downloadBtn) {
        downloadBtn.addEventListener('click', () => {
          window.location.href = downloadUrl;
          
          // 关闭对话框
          setTimeout(() => {
            if (document.body.contains(dialog)) {
              document.body.removeChild(dialog);
          }
          }, 500);
        });
      }
      
      // 复制链接按钮
      const copyBtn = dialog.querySelector('.copy-btn');
      if (copyBtn) {
        copyBtn.addEventListener('click', () => {
          try {
            // 创建临时textarea来复制文本
            const textarea = document.createElement('textarea');
            textarea.value = schemaUrl;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            
            // 显示成功提示
            this.showSuccess('链接已复制到剪贴板');
              
            // 关闭对话框
            if (document.body.contains(dialog)) {
              document.body.removeChild(dialog);
            }
          } catch (e) {
            console.error('复制链接失败:', e);
          }
        });
      }
      
      // 浏览器打开按钮
      const browserBtn = dialog.querySelector('.browser-btn');
      if (browserBtn) {
        browserBtn.addEventListener('click', () => {
          try {
            // 尝试直接在浏览器中打开schema链接
            window.open(schemaUrl, '_blank');
            
            // 关闭对话框
            setTimeout(() => {
              if (document.body.contains(dialog)) {
                document.body.removeChild(dialog);
              }
            }, 500);
          } catch (e) {
            console.error('在浏览器中打开失败:', e);
          }
        });
      }
      
      // 点击遮罩层关闭
      const overlay = dialog.querySelector('.dialog-overlay');
      if (overlay) {
        overlay.addEventListener('click', (e) => {
          if (e.target === overlay) {
            document.body.removeChild(dialog);
          }
        });
      }
    },
    
    // 处理API返回的数据
    processApiResponse(data: any): void {
      if (!data) {
        console.error('API返回的数据为空');
        this.showError('没有数据返回，请刷新重试');
        return;
      }
      
      console.log('处理API返回数据:', JSON.stringify(data).substring(0, 200) + '...');
      
      try {
        // 统一处理不同格式的数据结构
        let processedData = data;
        
        // 检查是否有嵌套的数据结构
        if (data.data && typeof data.data === 'object') {
          processedData = data.data;
        } else if (data.data && Array.isArray(data.data) && data.data.length > 0) {
          // 如果是数组，取第一个元素
          processedData = data.data[0];
        }
        
        // 处理图片数组 - 支持多种图片字段名
        const imageFields = ['images', 'imgs', 'image_list', 'imgList'];
        for (const field of imageFields) {
          if (processedData[field]) {
            // 确保是数组格式
            let images = processedData[field];
            if (typeof images === 'string') {
              try {
                // 尝试解析JSON字符串
                images = JSON.parse(images);
              } catch (e) {
                // 可能是单个图片URL
                images = [images];
              }
            }
            
            // 确保是数组
            if (!Array.isArray(images)) {
              images = [images];
            }
            
            // 统一保存到images字段
            processedData.images = images;
            break;
          }
        }
        
        // 处理内容字段 - 支持多种内容字段名
        const contentFields = ['content', 'desc', 'description', 'text'];
        for (const field of contentFields) {
          if (processedData[field]) {
            processedData.content = processedData[field];
            break;
          }
        }
        
        // 处理标题字段 - 支持多种标题字段名
        const titleFields = ['title', 'name', 'headline'];
        for (const field of titleFields) {
          if (processedData[field]) {
            processedData.title = processedData[field];
            break;
          }
        }
        
        // 处理ID字段
        const idFields = ['id', 'noteId', 'post_id'];
        for (const field of idFields) {
          if (processedData[field]) {
            processedData.id = processedData[field];
            break;
          }
        }
        
        // 设置最终处理后的数据
        this.postData = processedData;
        
        // 更新发布状态 - 使用专门的方法处理状态
        this.updateUsedStatus(processedData);
        
        // 如果有图片，设置总图片数
        if (processedData.images && processedData.images.length > 0) {
          this.totalImages = processedData.images.length;
        }
        
        console.log('数据处理完成:', {
          id: processedData.id,
          图片数量: processedData.images ? processedData.images.length : 0,
          内容长度: processedData.content ? processedData.content.length : 0,
          抖音状态: this.isDouyinUsed,
          小红书状态: this.isXhsUsed
        });
      } catch (error) {
        console.error('处理API返回数据时出错:', error);
        this.showError('数据处理失败，请刷新重试');
      }
    },
    
    // 使用Promise封装的错误重试函数
    async fetchWithRetry(url: string, options = {}, retries = 3, delay = 1000): Promise<any> {
      try {
        const response = await fetch(url, options);
        
        if (!response.ok) {
          throw new Error(`HTTP 错误! 状态码: ${response.status}`);
        }
        
        return response;
      } catch (error) {
        if (retries <= 1) throw error;
        
        console.log(`请求失败，${delay/1000}秒后重试..., 剩余重试次数: ${retries-1}`);
        
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve(this.fetchWithRetry(url, options, retries - 1, delay));
          }, delay);
        });
      }
    },

    // 添加跳转到分享页面的方法
    goToSharePage(): void {
      
      try {
        // 获取当前URL
        let currentUrl = window.location.href;
        
        // 处理hash路由参数 (#/route?param=value)
        if (currentUrl.includes('#') && currentUrl.includes('isPreview=')) {
          // 先分离hash部分和非hash部分
          const [baseUrl, hashPart] = currentUrl.split('#');
          
          // 处理hash中的参数部分
          if (hashPart.includes('?')) {
            // 分离路由路径和查询参数
            const [routePath, queryParams] = hashPart.split('?');
            
            // 将查询字符串转换为URLSearchParams对象
            const params = new URLSearchParams(queryParams);
            
            // 移除isPreview参数
            params.delete('isPreview');
            
            // 重建URL，不带isPreview参数
            const newQueryString = params.toString();
            const newHashPart = newQueryString ? `${routePath}?${newQueryString}` : routePath;
            currentUrl = `${baseUrl}#${newHashPart}`;
          }
        }
        
        console.log('跳转到分享页面:', currentUrl);
        
        // 使用专门针对弹窗环境的跳转方法
        this.openSharePageFromPopup(currentUrl);
      } catch (error: any) {
        console.error('跳转到分享页面失败:', error);
        this.showError(`跳转失败: ${error.message || '未知错误'}`);
      }
    },

    // 专门针对弹窗环境的跳转方法
    openSharePageFromPopup(url: string): void {
      // 将当前URL记录到控制台
      console.log('需要打开的分享页面URL:', url);
      
      // 获取完整的User-Agent以便检测设备类型
      const userAgent = navigator.userAgent;
      console.log('当前设备User-Agent:', userAgent);
      
      // 检测是否华为设备或鸿蒙系统
      const isHarmonyOS = /HarmonyOS/i.test(userAgent);
      const isEmui = /EMUI/i.test(userAgent);
      const isMagicUI = /Magic UI/i.test(userAgent);
      const isHuawei = /HUAWEI|HONOR/i.test(userAgent);
      // 是否是华为/鸿蒙环境
      const isHuaweiEnvironment = isHuawei || isHarmonyOS || isEmui || isMagicUI;
      
      // 记录设备检测结果
      console.log('设备检测结果:', {
        isHuawei,
        isHarmonyOS,
        isEmui,
        isMagicUI,
        isHuaweiEnvironment,
        userAgent: userAgent.substring(0, 100) + '...'
      });
      
      // 如果不是华为设备或鸿蒙系统，直接尝试跳转
      if (!isHuaweiEnvironment) {
        console.log('非华为/鸿蒙设备，尝试直接跳转');
        
        try {
          // 在新页面中打开链接
          const newWindow = window.open(url, '_blank');
          
          // 检查是否成功打开
          if (newWindow) {
            console.log('成功在新页面打开链接');
            return;
          } else {
            console.warn('window.open可能被浏览器拦截，尝试替代方法');
            
            // 创建一个临时链接元素并点击它
            const tempLink = document.createElement('a');
            tempLink.href = url;
            tempLink.target = '_blank';
            tempLink.rel = 'noopener noreferrer';
            tempLink.style.display = 'none';
            document.body.appendChild(tempLink);
            tempLink.click();
            document.body.removeChild(tempLink);
            return;
          }
        } catch (e) {
          console.error('所有新页面打开方法都失败:', e);
          // 继续执行弹窗逻辑，作为后备方案
        }
      }
      
      // 华为/鸿蒙设备显示辅助弹窗
      console.log('检测到华为/鸿蒙设备，显示辅助跳转弹窗');
      
      // 创建全屏模态覆盖层
      const overlay = document.createElement('div');
      overlay.className = 'harmony-solution-overlay';
      overlay.style.position = 'fixed';
      overlay.style.top = '0';
      overlay.style.left = '0';
      overlay.style.width = '100%';
      overlay.style.height = '100%';
      overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
      overlay.style.zIndex = '999999';
      overlay.style.display = 'flex';
      overlay.style.flexDirection = 'column';
      overlay.style.justifyContent = 'center';
      overlay.style.alignItems = 'center';
      overlay.style.padding = '20px';
      
      // 创建内容容器
      const container = document.createElement('div');
      container.style.width = '100%';
      container.style.maxWidth = '400px';
      container.style.backgroundColor = 'white';
      container.style.borderRadius = '12px';
      container.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.5)';
      container.style.overflow = 'hidden';
      
      // 创建标题
      const header = document.createElement('div');
      header.style.padding = '15px';
      header.style.backgroundColor = '#4285F4';
      header.style.color = 'white';
      header.style.fontSize = '18px';
      header.style.fontWeight = 'bold';
      header.style.textAlign = 'center';
      header.textContent = '无法自动跳转';
      container.appendChild(header);
      
      // 创建说明文本
      const instructions = document.createElement('div');
      instructions.style.padding = '20px';
      instructions.style.fontSize = '16px';
      instructions.style.lineHeight = '1.5';
      instructions.style.color = '#333';
      instructions.innerHTML = `
        <p style="margin-bottom:15px;"><strong>检测到华为/鸿蒙系统</strong>，无法自动跳转到分享页面。</p>
        <p style="margin-bottom:15px;">请按照以下步骤操作：</p>
        <ol style="margin-left:20px;margin-bottom:15px;">
          <li style="margin-bottom:8px;">点击下方"复制链接"按钮</li>
          <li style="margin-bottom:8px;">粘贴并访问链接或点击二维码按钮打开</li>
        </ol>
      `;
      container.appendChild(instructions);
      
      // 创建URL显示框
      const urlDisplay = document.createElement('div');
      urlDisplay.style.margin = '0 20px 20px';
      urlDisplay.style.padding = '10px';
      urlDisplay.style.backgroundColor = '#f5f5f5';
      urlDisplay.style.border = '1px solid #ddd';
      urlDisplay.style.borderRadius = '5px';
      urlDisplay.style.fontSize = '14px';
      urlDisplay.style.wordBreak = 'break-all';
      urlDisplay.style.color = '#0066cc';
      urlDisplay.textContent = url;
      container.appendChild(urlDisplay);
      
      // 创建按钮容器
      const buttonsContainer = document.createElement('div');
      buttonsContainer.style.display = 'flex';
      buttonsContainer.style.padding = '0 20px 20px';
      buttonsContainer.style.gap = '10px';
      
      // 创建复制按钮
      const copyButton = document.createElement('button');
      copyButton.style.flex = '1';
      copyButton.style.padding = '12px';
      copyButton.style.backgroundColor = '#4285F4';
      copyButton.style.color = 'white';
      copyButton.style.border = 'none';
      copyButton.style.borderRadius = '5px';
      copyButton.style.fontSize = '16px';
      copyButton.style.fontWeight = 'bold';
      copyButton.style.cursor = 'pointer';
      copyButton.textContent = '复制链接';
      
      // 复制按钮点击事件
      copyButton.addEventListener('click', () => {
        // 创建临时文本区域元素
        const textarea = document.createElement('textarea');
        textarea.value = url;
        textarea.style.position = 'absolute';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        
        // 选择并复制文本
        textarea.select();
        textarea.setSelectionRange(0, 99999);
        document.execCommand('copy');
        
        // 移除临时元素
        document.body.removeChild(textarea);
        
        // 更新按钮文本提示复制成功
        copyButton.textContent = '✓ 复制成功';
        copyButton.style.backgroundColor = '#4CAF50';
        
        // 3秒后恢复按钮文本
        setTimeout(() => {
          copyButton.textContent = '复制链接';
          copyButton.style.backgroundColor = '#4285F4';
        }, 3000);
      });
      buttonsContainer.appendChild(copyButton);
      
      // 创建关闭按钮
      const closeButton = document.createElement('button');
      closeButton.style.flex = '1';
      closeButton.style.padding = '12px';
      closeButton.style.backgroundColor = '#f5f5f5';
      closeButton.style.color = '#333';
      closeButton.style.border = '1px solid #ddd';
      closeButton.style.borderRadius = '5px';
      closeButton.style.fontSize = '16px';
      closeButton.style.cursor = 'pointer';
      closeButton.textContent = '关闭';
      
      // 关闭按钮点击事件
      closeButton.addEventListener('click', () => {
        document.body.removeChild(overlay);
      });
      buttonsContainer.appendChild(closeButton);
      
      // 添加按钮容器到主容器
      container.appendChild(buttonsContainer);
      
      // 添加主容器到覆盖层
      overlay.appendChild(container);
      
      // 将覆盖层添加到body
      document.body.appendChild(overlay);
      
      // 同时尝试原始跳转方法 (可能在部分环境下有效)
      try {
        window.open(url, '_blank');
      } catch (e) {
        console.error('window.open 失败:', e);
      }
      
      // 在页面上显示一个更小的提示
      this.showError('如需跳转，请点击页面顶部的"复制链接"按钮', '#4285F4');
    },

    // 显示平台选择对话框
    showPlatformSelectionDialog(): void {
      // 创建对话框元素
      const dialog = document.createElement('div');
      dialog.className = 'platform-selection-dialog';
      dialog.innerHTML = `
        <div class="platform-dialog-overlay"></div>
        <div class="platform-dialog-content">
          <div class="platform-dialog-header">
            <h3>选择分享平台</h3>
            <button class="close-btn">&times;</button>
          </div>
          <div class="platform-dialog-body">
            <p>请选择要分享到的平台：</p>
            <div class="platform-options">
              <button class="platform-option xhs-option">
                <span class="platform-icon">🔺</span>
                <span class="platform-name">分享到小红书</span>
              </button>
              <button class="platform-option douyin-option">
                <span class="platform-icon">🎵</span>
                <span class="platform-name">分享到抖音</span>
              </button>
            </div>
          </div>
        </div>
      `;
      
      // 添加样式
      const style = document.createElement('style');
      style.textContent = `
        .platform-selection-dialog {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 10000;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .platform-dialog-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(4px);
        }
        
        .platform-dialog-content {
          position: relative;
          width: 90%;
          max-width: 320px;
          background-color: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
          animation: platformDialogFadeIn 0.3s ease;
        }
        
        .platform-dialog-header {
          padding: 15px;
          border-bottom: 1px solid #eee;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .platform-dialog-header h3 {
          margin: 0;
          font-size: 18px;
          color: #333;
        }
        
        .close-btn {
          background: none;
          border: none;
          font-size: 24px;
          color: #999;
          cursor: pointer;
        }
        
        .platform-dialog-body {
          padding: 20px;
        }
        
        .platform-dialog-body p {
          margin: 0 0 15px;
          text-align: center;
          color: #666;
        }
        
        .platform-options {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        
        .platform-option {
          display: flex;
          align-items: center;
          padding: 15px;
          border: 1px solid #eee;
          border-radius: 8px;
          background: white;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .platform-option:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }
        
        .xhs-option {
          border-color: #ff3370;
        }
        
        .douyin-option {
          border-color: #000;
        }
        
        .platform-icon {
          font-size: 24px;
          margin-right: 10px;
        }
        
        .platform-name {
          font-size: 16px;
          font-weight: 500;
        }
        
        @keyframes platformDialogFadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `;
      
      // 添加到DOM
      document.head.appendChild(style);
      document.body.appendChild(dialog);
      
      // 添加事件监听
      const closeBtn = dialog.querySelector('.close-btn');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => {
          document.body.removeChild(dialog);
          document.head.removeChild(style);
        });
      }
      
      // 点击小红书选项
      const xhsOption = dialog.querySelector('.xhs-option');
      if (xhsOption) {
        xhsOption.addEventListener('click', () => {
          // 关闭对话框
          document.body.removeChild(dialog);
          document.head.removeChild(style);
          
          // 执行小红书分享
          this.shareToXhs();
        });
      }
      
      // 点击抖音选项
      const douyinOption = dialog.querySelector('.douyin-option');
      if (douyinOption) {
        douyinOption.addEventListener('click', () => {
          // 关闭对话框
          document.body.removeChild(dialog);
          document.head.removeChild(style);
          
          // 执行抖音分享
          this.shareToDouyin();
        });
      }
      
      // 点击遮罩关闭
      const overlay = dialog.querySelector('.platform-dialog-overlay');
      if (overlay) {
        overlay.addEventListener('click', () => {
          document.body.removeChild(dialog);
          document.head.removeChild(style);
        });
      }
    },

    // 显示错误弹窗
    showErrorDialog(message: string): void {
      // 创建弹窗元素
      const dialogContainer = document.createElement('div');
      dialogContainer.className = 'error-dialog-container';
      dialogContainer.style.position = 'fixed';
      dialogContainer.style.top = '0';
      dialogContainer.style.left = '0';
      dialogContainer.style.width = '100%';
      dialogContainer.style.height = '100%';
      dialogContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
      dialogContainer.style.display = 'flex';
      dialogContainer.style.justifyContent = 'center';
      dialogContainer.style.alignItems = 'center';
      dialogContainer.style.zIndex = '9999';
      
      const dialogContent = document.createElement('div');
      dialogContent.className = 'error-dialog-content';
      dialogContent.style.backgroundColor = 'white';
      dialogContent.style.borderRadius = '8px';
      dialogContent.style.padding = '20px';
      dialogContent.style.maxWidth = '80%';
      dialogContent.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
      dialogContent.style.display = 'flex';
      dialogContent.style.flexDirection = 'column';
      dialogContent.style.alignItems = 'center';
      
      const errorIcon = document.createElement('div');
      errorIcon.className = 'error-icon';
      errorIcon.style.width = '50px';
      errorIcon.style.height = '50px';
      errorIcon.style.borderRadius = '50%';
      errorIcon.style.backgroundColor = '#ff3333';
      errorIcon.style.display = 'flex';
      errorIcon.style.justifyContent = 'center';
      errorIcon.style.alignItems = 'center';
      errorIcon.style.marginBottom = '15px';
      errorIcon.style.color = 'white';
      errorIcon.style.fontSize = '32px';
      errorIcon.style.fontWeight = 'bold';
      errorIcon.innerHTML = '!';
      
      const errorTitle = document.createElement('h3');
      errorTitle.className = 'error-title';
      errorTitle.style.margin = '0 0 10px';
      errorTitle.style.fontSize = '18px';
      errorTitle.style.color = '#333';
      errorTitle.textContent = '错误提示';
      
      const errorMessage = document.createElement('p');
      errorMessage.className = 'error-message';
      errorMessage.style.margin = '0 0 20px';
      errorMessage.style.fontSize = '16px';
      errorMessage.style.color = '#666';
      errorMessage.style.textAlign = 'center';
      errorMessage.textContent = message;
      
      const closeButton = document.createElement('button');
      closeButton.className = 'error-close-button';
      closeButton.style.padding = '8px 16px';
      closeButton.style.backgroundColor = '#f5f5f5';
      closeButton.style.border = '1px solid #ddd';
      closeButton.style.borderRadius = '4px';
      closeButton.style.color = '#333';
      closeButton.style.fontSize = '14px';
      closeButton.style.cursor = 'pointer';
      closeButton.textContent = '知道了';
      
      closeButton.addEventListener('click', () => {
        document.body.removeChild(dialogContainer);
      });
      
      dialogContent.appendChild(errorIcon);
      dialogContent.appendChild(errorTitle);
      dialogContent.appendChild(errorMessage);
      dialogContent.appendChild(closeButton);
      dialogContainer.appendChild(dialogContent);
      
      document.body.appendChild(dialogContainer);
      
      // 点击背景也可关闭弹窗
      dialogContainer.addEventListener('click', (e) => {
        if (e.target === dialogContainer) {
          document.body.removeChild(dialogContainer);
        }
      });
    },

    // 添加一个专门用于分析抖音URL签名参数的方法
    analyzeDouyinSignature(url: string): void {
      console.log('%c开始分析抖音签名参数', 'color: #ff9900; font-weight: bold;');
      
      try {
        if (!url.includes('?')) {
          console.error('URL格式错误，无法解析签名参数:', url);
          return;
        }
        
        // 提取URL参数部分
        const paramsString = url.substring(url.indexOf('?') + 1);
        const urlParams = new URLSearchParams(paramsString);
        
        // 获取关键签名参数
        const clientKey = urlParams.get('client_key');
        const nonceStr = urlParams.get('nonce_str');
        const timestamp = urlParams.get('timestamp');
        const signature = urlParams.get('signature');
        
        // 创建签名参数表格
        console.log('%c抖音签名参数详情', 'color: blue; font-weight: bold; font-size: 14px;');
        console.table({
          'client_key': { value: clientKey, length: clientKey?.length || 0 },
          'nonce_str': { value: nonceStr, length: nonceStr?.length || 0 },
          'timestamp': { value: timestamp, length: timestamp?.length || 0, parsed: timestamp ? new Date(parseInt(timestamp) * 1000).toLocaleString() : '无效时间戳' },
          'signature': { value: signature, length: signature?.length || 0 }
        });
        
        // 检查参数完整性
        const isComplete = clientKey && nonceStr && timestamp && signature;
        console.log('%c签名参数完整性检查: ' + (isComplete ? '完整' : '不完整'), 
          `color: ${isComplete ? 'green' : 'red'}; font-weight: bold; font-size: 14px;`);
        
        // 检查时间戳是否有效
        if (timestamp) {
          const timestampNum = parseInt(timestamp);
          const timestampDate = new Date(timestampNum * 1000);
          const now = new Date();
          const diffSeconds = Math.abs((now.getTime() - timestampDate.getTime()) / 1000);
          
          console.log('%c时间戳检查', 'color: blue; font-weight: bold;', {
            当前时间: now.toLocaleString(),
            签名时间: timestampDate.toLocaleString(),
            相差秒数: diffSeconds.toFixed(0),
            是否在有效期内: diffSeconds < 300 ? '有效' : '已过期'
          });
        }
        
        // 把所有URL参数打印出来，用于全面分析
        console.log('%c所有URL参数', 'color: purple; font-weight: bold;');
        const allParams: Record<string, string> = {};
        for (const [key, value] of urlParams.entries()) {
          allParams[key] = value;
        }
        console.table(allParams);
        
      } catch (error) {
        console.error('分析抖音签名参数失败:', error);
      }
    },

    // 显示自定义确认对话框
    showConfirm(title: string, message: string, callback: () => void): void {
      this.confirmDialogTitle = title;
      this.confirmDialogMessage = message;
      this.confirmDialogCallback = callback;
      this.showConfirmDialog = true;
    },
    
    // 确认对话框的确认操作
    handleConfirm(): void {
      if (this.confirmDialogCallback) {
        this.confirmDialogCallback();
      }
      this.showConfirmDialog = false;
    },
    
    // 确认对话框的取消操作
    handleCancel(): void {
      this.showConfirmDialog = false;
    },
    
    // 添加一个处理笔记弃用的方法
    discardNote(): void {
    
      // 使用自定义确认对话框替代原生confirm
      this.showConfirm(
        '确认弃用', 
        '确定要将此笔记标记为弃用吗？此操作无法撤销。', 
        this.performDiscard
      );
    },
    
    // 执行弃用操作
    async performDiscard(): Promise<void> {
      try {

        // 显示处理状态
        this.showError('正在处理...', '#ff9900');
        
        // 使用xhs-auto-api接口而不是需要认证的xhs接口
        // 这个接口专门为预览页面设计，不需要标准认证
        const apiUrl = `${this.API_DOMAIN}/xhs-auto/notes/${this.postData.id}/discard`;
        console.log('调用弃用API:', apiUrl);
        
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          // 添加credentials以便发送cookies（如果有）
          credentials: 'include'
        });
        
        // 检查响应
        if (!response.ok) {
          // 如果是认证错误，提供更明确的提示
          if (response.status === 401) {
            throw new Error('认证失败，请尝试从主应用打开');
          }
          throw new Error(`操作失败: ${response.status} ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log('标记笔记为弃用结果:', result);
        
        // 更新UI状态
        this.showSuccess('笔记已标记为弃用');
        
        // 更新本地状态，不刷新页面
        this.updateLocalStatus();
        
      } catch (error: any) {
        console.error('标记笔记为弃用失败:', error);
        this.showError(`操作失败: ${error.message || '未知错误'}`);
      }
    },
    
    // 更新本地状态而不是刷新页面
    updateLocalStatus(): void {
      if (this.postData) {
        // 设置笔记状态为已弃用
        this.postData.isDiscarded = true;
        
        // 更新UI显示
        this.showSuccess('笔记已标记为弃用');
        
        // 如果页面是在iframe中打开的，尝试通知父窗口刷新
        try {
          if (window.parent && window.parent !== window) {
            window.parent.postMessage({ 
              type: 'NOTE_DISCARDED', 
              noteId: this.postData.id 
            }, '*');
            console.log('已通知父窗口笔记已弃用');
          }
        } catch (e) {
          console.error('通知父窗口失败:', e);
        }
      }
    },
    
    // 获取认证令牌方法
    getAuthToken(): string | null {
      // 尝试从localStorage获取token
      const token = localStorage.getItem('token');
      if (token) return token;
      
      // 尝试从cookie获取token
      const cookies = document.cookie.split(';');
      for (const cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'token') {
          return value;
        }
      }
      
      // 尝试从URL参数获取token
      const urlParams = this.getUrlParams();
      if (urlParams?.token) {
        return urlParams.token;
      }
      
      return null;
    },

    // 添加在methods部分的适当位置
    // 通用的链接打开方法，优化在移动设备上的行为
    openLinkUniversal(url: string, target: string = '_blank'): void {
      if (!url) {
        console.error('打开链接失败: URL为空');
        return;
      }
      
      console.log('通用链接打开方法 - 尝试打开链接:', url);
      
      // 检测是否为移动设备
      const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const isAndroid = /Android/i.test(navigator.userAgent);
      const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
      
      try {
        // 在安卓设备上使用多种方式尝试打开链接
        if (isAndroid) {
          console.log('检测到安卓设备，使用多种方式尝试打开');
          
          // 尝试方法1: iframe
          try {
            const iframe = document.createElement('iframe');
            iframe.style.display = 'none';
            iframe.style.width = '0';
            iframe.style.height = '0';
            iframe.style.border = '0';
            iframe.src = url;
            document.body.appendChild(iframe);
            
            // 延迟移除iframe
            setTimeout(() => {
              if (document.body.contains(iframe)) {
                document.body.removeChild(iframe);
              }
            }, 1000);
          } catch (iframeError) {
            console.error('iframe方式打开链接失败:', iframeError);
          }
          
          // 尝试方法2: a标签点击
          try {
            setTimeout(() => {
              const linkElement = document.createElement('a');
              linkElement.setAttribute('href', url);
              linkElement.setAttribute('target', target);
              linkElement.style.display = 'none';
              document.body.appendChild(linkElement);
              
              // 对a标签触发点击事件
              const clickEvent = document.createEvent('MouseEvents');
              clickEvent.initEvent('click', true, true);
              linkElement.dispatchEvent(clickEvent);
              
              // 移除a标签
              setTimeout(() => {
                if (document.body.contains(linkElement)) {
                  document.body.removeChild(linkElement);
                }
              }, 500);
            }, 100);
          } catch (aTagError) {
            console.error('a标签方式打开链接失败:', aTagError);
          }
          
          // 尝试方法3: window.open
          try {
            setTimeout(() => {
              const newWindow = window.open(url, target);
              if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
                console.log('window.open方法被阻止，尝试其他方式');
              }
            }, 200);
          } catch (windowOpenError) {
            console.error('window.open方式打开链接失败:', windowOpenError);
          }
          
          // 尝试方法4: location.href (用户可能会离开当前页面)
          try {
            setTimeout(() => {
              if (target === '_self') {
                window.location.href = url;
              } else {
                // 如果目标不是自身，使用_blank打开新页面但不离开当前页面
                const openResult = window.open(url, '_blank');
                if (!openResult) {
                  console.log('尝试使用location.replace作为最后手段');
                  // 通知用户可能会离开当前页面
                  this.showError('即将打开新页面...', '#3498db');
                  setTimeout(() => {
                    window.location.href = url;
                  }, 1000);
                }
              }
            }, 300);
          } catch (locationError) {
            console.error('location方式打开链接失败:', locationError);
          }
          
          return;
        }
        
        // iOS设备的处理
        if (isIOS) {
          try {
            window.open(url, target);
          } catch (iosError) {
            console.error('iOS打开链接失败:', iosError);
            setTimeout(() => window.location.href = url, 100);
          }
          return;
        }
        
        // 桌面设备标准处理
        const newWindow = window.open(url, target);
        if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
          console.log('window.open被阻止，尝试其他方式打开');
          setTimeout(() => {
            const tempLink = document.createElement('a');
            tempLink.href = url;
            tempLink.target = target;
            tempLink.style.display = 'none';
            document.body.appendChild(tempLink);
            tempLink.click();
            document.body.removeChild(tempLink);
          }, 100);
        }
      } catch (e) {
        console.error('打开链接失败:', e);
        // 最终失败处理
        this.showError('打开链接失败，请手动复制链接');
      }
    },
  }
});
</script>

<template>
  <div class="container" :class="{'discarded-note': postData?.isDiscarded}">
    <!-- 弃用状态标记 -->
    <div class="discarded-status" v-if="postData?.isDiscarded">
      <div class="discarded-icon">⛔</div>
      <div class="discarded-text">笔记已弃用</div>
    </div>
    
    <!-- 美化加载动画 -->
    <div class="loading-container" v-if="loading">
      <div class="loading-wrapper">
        <div class="loading-spinner">
          <div class="spinner-inner"></div>
          <div class="spinner-text">{{ loadingProgress }}%</div>
        </div>
        <div class="loading-progress-bar">
          <div class="progress-bar-fill" :style="{ width: loadingProgress + '%' }"></div>
        </div>
        <div class="loading-stage">{{ loadingStage }}</div>
        <div class="loading-tips">小红书笔记精彩内容即将呈现</div>
      </div>
    </div>
    
    <!-- 自定义确认对话框 -->
    <div class="confirm-dialog-container" v-if="showConfirmDialog">
      <div class="confirm-dialog-overlay" @click="handleCancel"></div>
      <div class="confirm-dialog">
        <div class="confirm-dialog-header">
          <h3>{{ confirmDialogTitle }}</h3>
          <button class="confirm-dialog-close" @click="handleCancel">&times;</button>
        </div>
        <div class="confirm-dialog-body">
          <p class="confirm-dialog-message">{{ confirmDialogMessage }}</p>
          <div class="confirm-dialog-actions">
            <button class="confirm-dialog-btn confirm-btn" @click="handleConfirm">
              确认
            </button>
            <button class="confirm-dialog-btn cancel-btn" @click="handleCancel">
              取消
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 桌面端提示弹窗 -->
    <div class="desktop-modal-container" v-if="showDesktopModal && !loading">
      <div class="desktop-modal-overlay" @click="closeDesktopModal"></div>
      <div class="desktop-modal">
        <div class="desktop-modal-header">
          <h3>访问提示</h3>
          <button class="desktop-modal-close" @click="closeDesktopModal">&times;</button>
        </div>
        <div class="desktop-modal-body">
          <div class="desktop-modal-icon">📱</div>
          <h4>检测到您正在使用电脑端访问</h4>
          <p>小红书\抖音笔记分享功能仅支持在手机端使用</p>
          <p class="desktop-modal-tips">您可以扫描下方二维码在手机上打开，或者继续在电脑上浏览笔记内容</p>
          
          <div class="desktop-modal-qrcode">
            <img :src="qrCodeUrl" alt="页面二维码" class="qrcode-image" />
            <p class="qrcode-tip">扫描二维码在手机上查看</p>
          </div>
          
          <div class="desktop-modal-actions">
            <button class="desktop-modal-btn continue-btn" @click="closeDesktopModal">
              继续查看笔记
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 使用一个可滚动的内容容器 -->
    <div class="scrollable-container" v-if="!loading">
      <!-- 悬浮状态标记 -->
      <div class="floating-status-container">
        <div class="floating-status xhs" v-if="isXhsUsed && !isDebug">
          <div class="status-icon">✓</div>
          <div class="status-text">已在小红书发布</div>
        </div>
        <div class="floating-status douyin" v-if="isDouyinUsed && !isDebug">
          <div class="status-icon">✓</div>
          <div class="status-text">已在抖音发布</div>
        </div>
        <!-- 调试模式下的状态提示 -->
        <div class="floating-status debug" v-if="isDebug">
          <div class="status-icon">🛠️</div>
          <div class="status-text">调试模式</div>
        </div>
        <div class="floating-status warning" v-if="noteSharedByOthers">
          <div class="status-icon">!</div>
          <div class="status-text">已被他人分享</div>
        </div>
        <div class="floating-status error" v-if="douyinSchemaError">
          <div class="status-icon">!</div>
          <div class="status-text">抖音链接错误</div>
        </div>
      </div>
      
      <!-- 根据hideNoteContent决定是否显示笔记内容 -->
      <div v-if="!hideNoteContent">
        <div class="note-content" v-if="postData">
          <!-- 图片轮播容器 -->
          <div class="image-slider" 
               ref="imageSlider" 
               v-if="postData.images && postData.images.length > 0"
               :key="`slider-${postData.id}`">
            <!-- 左右翻页按钮 -->
            <div class="slider-nav-button prev-button" ref="prevButton" @click="slideImage(-1)">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M15 18l-6-6 6-6"/>
              </svg>
            </div>
            <div class="slider-nav-button next-button" ref="nextButton" @click="slideImage(1)">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </div>
            
            <div class="note-images" :style="{ transform: `translateX(-${currentImageIndex * 100}%)` }" ref="noteImages">
              <img 
                v-for="(img, index) in postData.images" 
                :key="`${index}-${img}`" 
                :src="img" 
                @error="handleImageError" 
                :style="{ 
                  width: '100%',
                  userSelect: 'none', 
                  pointerEvents: 'auto'
                }" 
                draggable="false"
              />
            </div>
            
            <!-- 增强的轮播指示器 -->
            <div class="slider-dots">
              <span 
                v-for="(_, index) in postData.images" 
                :key="`dot-${index}`" 
                :class="{ active: index === currentImageIndex }" 
                @click="changeSlide(index)">
                <span class="dot-inner"></span>
              </span>
            </div>
            
            <!-- 图片计数器 -->
            <div class="image-counter">{{ currentImageIndex + 1 }}/{{ postData.images.length }}</div>
          </div>
          <div class="note-title" v-if="postData.title">{{ postData.title }}</div>
          <div class="note-text" v-if="postData.content" v-html="postData.content.replace(/\\n/g, '<br>')"></div>
        </div>
      </div>
      <!-- 发布模式简单提示 -->
      <div v-else class="publish-notice">
        <div class="publish-notice-container">
          <div class="publish-notice-icon">📱</div>
          <div class="publish-notice-text">点击下方按钮分享到平台</div>
        </div>
      </div>
      
      <div id="error" class="error" v-if="error" :style="{ color: errorColor }">{{ error }}</div>
      
      <!-- 微信环境提示，优化显示位置和样式 -->
      <div class="wechat-tip" v-if="isWechatAndroid">
        <div class="wechat-tip-icon">📱</div>
        <div class="wechat-tip-label">
          <strong>微信环境提示：</strong><br>
          点击分享按钮后，请在<strong>浏览器中打开</strong>继续操作
        </div>
        <div class="wechat-tip-arrow">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#0077cc" stroke-width="2">
            <path d="M18 15l-6-6-6 6"/>
          </svg>
        </div>
      </div>
    </div>
    
    <div class="button-group">
      <!-- 按钮区域，仅当有按钮需要显示时才渲染 -->
      <div class="buttons-row" 
           v-if="showShareButton || showDouyinShareButton || (currentIdentifier && urlHasIdentifier)"
           :class="{
             'share-buttons-only': showShareButton && showDouyinShareButton && !(currentIdentifier && urlHasIdentifier),
             'has-next-button': currentIdentifier && urlHasIdentifier
           }">
        <!-- 小红书分享按钮 -->
        <button 
          id="shareButton" 
          v-if="showShareButton" 
          class="share-button xhs-button" 
          @click="shareToXhs">
          分享到小红书
        </button>
        <!-- 抖音分享按钮 -->
        <button 
          id="douyinShareButton"
          v-if="showDouyinShareButton"
          class="share-button douyin-button"
          :disabled="douyinSchemaLoading"
          @click="shareToDouyin">
          <span v-if="douyinSchemaLoading">获取链接中...</span>
          <span v-else>分享到抖音</span>
        </button>
        <!-- 下一篇按钮 -->
        <button 
          id="nextNoteButton"
          class="next-note-button" 
          :disabled="nextButtonDisabled" 
          @click="(e) => loadNextNote(true)"
          v-if="currentIdentifier && urlHasIdentifier">
          下一篇笔记
        </button>
      </div>
    </div>

    <!-- 调试信息面板 -->
    <div class="debug-panel" v-if="isDebug && !loading && false">
      <div class="debug-header">
        <h3>调试信息</h3>
        <button @click="isDebug = false" class="debug-close">×</button>
      </div>
      <div class="debug-content">
        <div class="debug-section">
          <h4>笔记基本信息</h4>
          <div class="debug-item">
            <span class="debug-label">笔记ID:</span>
            <span class="debug-value">{{ postData?.id || '无' }}</span>
          </div>
          <div class="debug-item">
            <span class="debug-label">标识符:</span>
            <span class="debug-value">{{ currentIdentifier || '无' }}</span>
          </div>
          <div class="debug-item">
            <span class="debug-label">标题:</span>
            <span class="debug-value">{{ postData?.title || '无' }}</span>
          </div>
          <div class="debug-item">
            <span class="debug-label">图片数量:</span>
            <span class="debug-value">{{ totalImages }}</span>
          </div>
        </div>

        <div class="debug-section">
          <h4>状态标志</h4>
          <div class="debug-item">
            <span class="debug-label">小红书已发布:</span>
            <span class="debug-value">{{ isXhsUsed ? '是' : '否' }}</span>
          </div>
          <div class="debug-item">
            <span class="debug-label">抖音已发布:</span>
            <span class="debug-value">{{ isDouyinUsed ? '是' : '否' }}</span>
          </div>
          <div class="debug-item">
            <span class="debug-label">已被他人分享:</span>
            <span class="debug-value">{{ noteSharedByOthers ? '是' : '否' }}</span>
          </div>
          <div class="debug-item">
            <span class="debug-label">预览模式:</span>
            <span class="debug-value">{{ isPreview ? '是' : '否' }}</span>
          </div>
          <div class="debug-item">
            <span class="debug-label">设备类型:</span>
            <span class="debug-value">{{ isDesktop() ? '桌面端' : '移动端' }}</span>
          </div>
        </div>

        <div class="debug-section">
          <h4>按钮显示状态</h4>
          <div class="debug-item">
            <span class="debug-label">显示小红书按钮:</span>
            <span class="debug-value">{{ showShareButton ? '是' : '否' }}</span>
          </div>
          <div class="debug-item">
            <span class="debug-label">显示抖音按钮:</span>
            <span class="debug-value">{{ showDouyinShareButton ? '是' : '否' }}</span>
          </div>
          <div class="debug-item">
            <span class="debug-label">显示分享页面按钮:</span>
            <span class="debug-value">{{ showSharePageButton ? '是' : '否' }}</span>
          </div>
          <div class="debug-item">
            <span class="debug-label">显示下一篇按钮:</span>
            <span class="debug-value">{{ currentIdentifier && urlHasIdentifier ? '是' : '否' }}</span>
          </div>
        </div>

        <div class="debug-section">
          <h4>URL参数</h4>
          <pre class="debug-json">{{ JSON.stringify(getUrlParams(), null, 2) }}</pre>
        </div>

        <div class="debug-section">
          <h4>操作</h4>
          <div class="debug-actions">
            <button @click="shareToXhs" class="debug-btn">触发小红书分享</button>
            <button @click="shareToDouyin" class="debug-btn">触发抖音分享</button>
            <button @click="goToSharePage" class="debug-btn">触发分享页面跳转</button>
            <button @click="loadNextNote()" class="debug-btn">加载下一篇</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 移动端控制台 -->
    <div class="mobile-console" v-if="isDebug && !loading">
      <div class="console-header" @click="toggleDebugLogExpanded">
        <h3>📱 移动端控制台 
          <span class="badge">{{ consoleLogs.length }}</span>
          <span v-if="filterEnabled" class="filter-badge" title="已启用过滤">
            🔍 已过滤{{ filteredLogCount }}条
          </span>
        </h3>
        <div class="console-actions">
          <button @click.stop="toggleFilter" class="console-filter-btn" :class="{'filter-active': filterEnabled}">
            {{ filterEnabled ? '🔍开' : '🔍关' }}
          </button>
          <button @click.stop="clearConsoleLogs" class="console-clear-btn">
            🗑️ 清除
          </button>
          <button class="console-toggle-btn">
            {{ debugLogExpanded ? '🔽' : '🔼' }}
          </button>
        </div>
      </div>
      <div class="console-logs" v-if="debugLogExpanded">
        <div class="console-notice">
          分享按钮在底部 ⬇️
        </div>
        <div v-if="consoleLogs.length === 0" class="console-empty">
          <div class="empty-icon">📝</div>
          暂无日志记录，操作页面将显示日志
        </div>
        <div 
          v-for="(log, index) in consoleLogs" 
          :key="index" 
          class="console-log-entry"
          :class="{
            'log-error': log.type === 'error',
            'log-warn': log.type === 'warn',
            'log-info': log.type === 'info',
            'log-log': log.type === 'log'
          }"
        >
          <div class="log-header">
            <span class="log-type">
              {{ log.type === 'error' ? '❌' :
                 log.type === 'warn' ? '⚠️' :
                 log.type === 'info' ? 'ℹ️' : '📄' }}
            </span>
            <span class="log-timestamp">{{ log.timestamp }}</span>
          </div>
          <div class="log-content">{{ log.message }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
body {
    font-family: Arial, sans-serif;
    margin: 0;
    padding: 0;
    background-color: #f8f8f8;
    height: 100vh;
    overflow-y: auto;
}

.container {
  max-width: 600px;
  margin: 0 auto;
  background-color: white;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  text-align: left;
  min-height: 100vh;
  box-sizing: border-box;
  position: relative;
  overflow-y: auto; /* 确保容器允许滚动 */
}

/* 可滚动容器 */
.scrollable-container {
  width: 100%;
  height: auto;
  min-height: calc(100vh - 140px);
  padding-bottom: 120px !important; /* 增加底部内边距以适应按钮组 */
  margin-bottom: 0; /* 确保底部无边距 */
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  position: relative;
}

h1 {
  color: #fe2c55;
}

button {
  background-color: #fe2c55;
  color: white;
  border: none;
  border-radius: 5px;
  padding: 12px 24px;
  font-size: 16px;
  cursor: pointer;
  margin-top: 20px;
}

button:hover {
  background-color: #e6294f;
}

/* 美化加载动画样式 */
.loading-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #fff;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.loading-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 80%;
  max-width: 300px;
}

.loading-spinner {
  position: relative;
  width: 80px;
  height: 80px;
  margin-bottom: 20px;
}

.spinner-inner {
  position: absolute;
  width: 100%;
  height: 100%;
  border: 4px solid rgba(254, 44, 85, 0.1);
  border-top-color: #fe2c55;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.spinner-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 16px;
  font-weight: bold;
  color: #fe2c55;
}

.loading-progress-bar {
  width: 100%;
  height: 6px;
  background-color: rgba(254, 44, 85, 0.1);
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 15px;
}

.progress-bar-fill {
  height: 100%;
  background-color: #fe2c55;
  border-radius: 3px;
  transition: width 0.3s ease;
}

.loading-stage {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 10px;
  text-align: center;
}

.loading-tips {
  font-size: 14px;
  color: #999;
  text-align: center;
  margin-top: 5px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error {
  margin: 20px 0;
  font-size: 16px;
  color: red;
  /* 增加错误提示的可见性 */
  padding: 10px;
  border-radius: 4px;
  background-color: rgba(255, 0, 0, 0.05);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.next-note-button {
  background-image: linear-gradient(to right, #2196f3, #4dabf5); /* 蓝色渐变 */
  background-color: #2196f3;
  flex: 1; /* 平均分配空间 */
}

.next-note-button.random {
  background-image: linear-gradient(to right, #ff9800, #ffb74d); /* 橙色渐变 */
  background-color: #ff9800;
}

.next-note-button:hover {
  background-color: #1976d2;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(33, 150, 243, 0.3);
}

.next-note-button.random:hover {
  background-color: #f57c00;
  box-shadow: 0 4px 8px rgba(255, 152, 0, 0.3);
}

.next-note-button:disabled {
  background-color: #cccccc;
  background-image: none;
  cursor: not-allowed;
  box-shadow: none;
  opacity: 0.7;
}

.button-group {
  display: flex;
  flex-direction: row; /* 确保横向排列 */
  justify-content: space-between; /* 分散对齐 */
  align-items: center;
  gap: 10px; /* 组件之间的间距 */
  margin-top: 0;
  margin-bottom: 0;
  padding: 12px 15px 15px; /* 内边距 */
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: rgba(255, 255, 255, 0.98);
  box-shadow: 0 -3px 10px rgba(0, 0, 0, 0.12);
  z-index: 999; /* 增加z-index确保在最顶层 */
  width: 100%;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
  box-sizing: border-box;
  flex-wrap: wrap; /* 允许换行，更灵活的布局 */
  overflow-x: auto; /* 允许横向滚动 */
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  -ms-overflow-style: none;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
}

/* 状态区域样式 */
.status-area {
  display: flex;
  align-items: center;
  flex: 0 1 auto; /* 可伸缩 */
  margin-right: auto; /* 靠左显示 */
  gap: 8px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  -ms-overflow-style: none;
  padding-right: 10px;
  max-width: none; /* 不限制最大宽度，自适应内容 */
  width: auto; /* 宽度自动 */
  flex-wrap: nowrap; /* 默认不换行 */
}

/* 当状态区域是唯一内容时的样式 */
.button-group:only-child .status-area {
  max-width: 100%;
  width: auto; /* 宽度自适应 */
  justify-content: center;
  margin: 0 auto;
  flex-wrap: wrap; /* 允许状态提示换行 */
}

.status-area::-webkit-scrollbar {
  display: none;
}

/* 按钮行 */
.buttons-row {
  display: flex;
  justify-content: flex-end; /* 靠右对齐 */
  align-items: center;
  gap: 8px;
  flex-wrap: wrap; /* 允许换行，更灵活的布局 */
  flex: 1 1 auto; /* 允许伸缩 */
  min-width: 0; /* 允许收缩 */
}

/* 当没有按钮时，调整按钮行样式 */
.buttons-row:empty {
  display: none;
}

/* 当只有状态提示没有按钮时的布局 */
.button-group:has(.status-area):not(:has(.buttons-row)),
.button-group:has(.status-area):has(.buttons-row:empty) {
  justify-content: center;
  padding: 8px 10px;
}

/* 当状态区域和按钮行都存在时的布局 */
.button-group:has(.status-area):has(.buttons-row:not(:empty)) {
  justify-content: space-between;
}

/* 当只有按钮行没有状态区域时的布局 */
.button-group:not(:has(.status-area)):has(.buttons-row) {
  justify-content: center;
}

/* 状态提示 */
.note-status {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  box-sizing: border-box;
  flex: 0 1 auto; /* 改为可收缩，自适应内容长度 */
  white-space: nowrap;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin: 0;
  min-width: min-content; /* 最小宽度为内容宽度 */
  width: auto; /* 宽度自适应 */
  max-width: fit-content; /* 最大宽度适应内容 */
}

/* 当状态提示是唯一显示的元素时 */
.button-group:has(.status-area):not(:has(button:visible)) .note-status {
  margin: 0 4px;
  max-width: min-content; /* 允许自适应到内容最小宽度 */
  width: auto;
}

/* 小红书状态 */
.note-status:not(.douyin-status):not(.warning):not(.error):not(.success) {
  background-color: rgba(254, 44, 85, 0.1);
  border: 1px solid rgba(254, 44, 85, 0.2);
  color: #fe2c55;
}

/* 抖音状态 */
.note-status.douyin-status {
  background-color: rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(0, 0, 0, 0.15);
  color: #000000;
}

.status-icon {
  margin-right: 4px;
  font-size: 14px;
  font-weight: bold;
}

.status-text {
  letter-spacing: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 0 1 auto; /* 允许文本收缩 */
  min-width: 0; /* 确保可以收缩到小于内容宽度 */
}

/* 分享按钮样式调整 */
.share-button, .next-note-button {
  flex: 0 1 auto; /* 根据内容自适应大小 */
  min-width: 100px;
  max-width: none;
  padding: 10px 16px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  margin: 0;
  box-sizing: border-box;
  border-radius: 6px;
}

/* 小红书按钮 */
.share-button.xhs-button {
  background-color: #fe2c55;
  background-image: linear-gradient(to right, #fe2c55, #ff5073);
}

/* 下一篇按钮 */
.next-note-button {
  background-color: #2196f3;
  background-image: linear-gradient(to right, #2196f3, #4dabf5);
}

/* 小屏幕适配 */
@media screen and (max-width: 400px) {
  .share-button, .next-note-button {
    padding: 8px 12px;
    font-size: 13px;
    min-width: 90px;
  }
  
  .note-status {
    padding: 5px 8px;
    font-size: 12px;
  }
  
  .status-icon {
    margin-right: 3px;
    font-size: 12px;
  }
  
  .button-group {
    padding: 8px 10px 10px;
    gap: 6px;
  }
  
  .buttons-row {
    gap: 6px;
  }
}

.share-button, .next-note-button {
  background-color: #fe2c55;
  color: white;
  border: none;
  border-radius: 8px; /* 增大圆角 */
  padding: 12px 15px; /* 适当减小内边距 */
  font-size: 16px; /* 增大字体大小 */
  font-weight: 600; /* 增加字体粗细 */
  cursor: pointer;
  transition: all 0.3s ease;
  flex: 1;
  min-width: 0; /* 允许按钮更窄 */
  max-width: none; /* 移除最大宽度限制 */
  margin: 0;
  box-sizing: border-box;
  text-align: center;
  letter-spacing: 0.5px; /* 增加字母间距 */
  box-shadow: 0 2px 6px rgba(254, 44, 85, 0.25); /* 添加阴影 */
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1); /* 添加文字阴影 */
  white-space: nowrap; /* 防止文字换行 */
}

/* 小红书按钮样式 */
.share-button.xhs-button {
  background-color: #fe2c55;
  background-image: linear-gradient(to right, #fe2c55, #ff5073); /* 添加渐变效果 */
  flex: 1; /* 平均分配空间 */
}

/* 抖音按钮样式 */
.share-button.douyin-button {
  background-color: #000000;
  background-image: linear-gradient(to right, #000000, #333333); /* 添加渐变效果 */
  flex: 1; /* 平均分配空间 */
}

.share-button.douyin-button:hover {
  background-color: #222222;
  transform: translateY(-1px); /* 悬停时轻微上浮 */
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.share-button.xhs-button:hover {
  background-color: #e6294f;
  transform: translateY(-1px); /* 悬停时轻微上浮 */
  box-shadow: 0 4px 8px rgba(254, 44, 85, 0.3);
}

.share-button.douyin-button:disabled {
  background-color: #666666;
  cursor: not-allowed;
  background-image: none;
  box-shadow: none;
  opacity: 0.7;
}

.share-button:active, 
.next-note-button:active {
  transform: translateY(1px); /* 点击时下沉效果 */
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.note-status {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 10px;
  background-color: rgba(76, 175, 80, 0.15);
  border-radius: 8px;
  border: 1px solid rgba(76, 175, 80, 0.35);
  color: #3c8c40;
  font-size: 14px;
  font-weight: 500;
  box-sizing: border-box;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  margin: 0 4px;
  flex: 0 0 auto;
  white-space: nowrap;
  max-width: none;
  min-width: 0;
}

.status-icon {
  margin-right: 4px;
  font-size: 14px;
  font-weight: bold;
}

/* 按钮行布局调整，使状态提示和按钮能够合理排列 */
.buttons-row {
  display: flex;
  width: 100%;
  justify-content: center;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

/* 调整抖音和小红书按钮的样式，以适应与状态提示并排显示 */
.share-button {
  flex: 0 1 auto; /* 根据内容自适应大小 */
  min-width: 100px; /* 设置最小宽度 */
}

/* 调整抖音按钮 */
.share-button.douyin-button {
  flex: 0 1 auto;
}

/* 下一篇按钮样式调整 */
.next-note-button {
  flex: 0 1 auto;
  min-width: 100px;
}

/* 警告状态样式 */
.note-status.warning {
  background-color: rgba(255, 152, 0, 0.15);
  border: 1px solid rgba(255, 152, 0, 0.35);
  color: #ff7700;
}

.note-status.warning .status-icon {
  color: #ff7700;
}

/* 成功状态样式 */
.note-status.success {
  background-color: rgba(76, 175, 80, 0.15);
  border: 1px solid rgba(76, 175, 80, 0.35);
  color: #3c8c40;
}

.note-status.success .status-icon {
  color: #3c8c40;
}

/* 错误状态样式 */
.note-status.error {
  background-color: rgba(244, 67, 54, 0.15);
  border: 1px solid rgba(244, 67, 54, 0.35);
  color: #e53935;
}

.note-status.error .status-icon {
  color: #e53935;
}

/* 抖音状态样式 */
.note-status.douyin-status {
  background-color: rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(0, 0, 0, 0.2);
  color: #000000;
}

.note-status.douyin-status .status-icon {
  color: #000000;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(5px); }
  to { opacity: 1; transform: translateY(0); }
}

.status-icon {
  color: #3c8c40;
  font-weight: bold;
  margin-right: 10px; /* 增大图标右边距 */
  font-size: 20px; /* 增大图标尺寸 */
}

.status-text {
  font-weight: 500;
  letter-spacing: 0.3px; /* 增加字母间距 */
  white-space: nowrap; /* 防止文本换行 */
  overflow: hidden;
  text-overflow: ellipsis; /* 文本过长时显示省略号 */
}

@media screen and (max-width: 400px) {
  .status-text {
    font-size: 13px; /* 小屏幕设备上减小字体大小 */
  }
  
  .note-status {
    padding: 6px 8px; /* 减小内边距以节省空间 */
  }
  
  .status-icon {
    margin-right: 5px; /* 减小图标右边距 */
    font-size: 16px; /* 减小图标尺寸 */
  }
}

/* 调整底部间距以适应更大的组件 */
.extra-bottom-space {
  padding-bottom: 60px !important; /* 增大底部间距以适应更大的按钮 */
}

/* 在移动端也保持较大的尺寸 */
@media screen and (max-width: 600px) {
  .button-group {
    padding: 8px 12px 12px; /* 增大内边距 */
  }
  
  .note-status {
    padding: 6px 12px; /* 增大内边距但保持适中 */
    margin-bottom: 0; /* 移除下边距使其与按钮对齐 */
    font-size: 14px;
    border-radius: 5px;
    min-width: 100px; /* 减小最小宽度适应移动端 */
  }
  
  .status-icon {
    font-size: 18px;
    margin-right: 8px;
  }
  
  .share-button, .next-note-button {
    padding: 10px 16px; /* 适当增大但不至于太大 */
    font-size: 15px;
    min-width: 100px; /* 减小最小宽度适应移动端 */
  }
}

/* 安全区域适配 */
@supports (padding-bottom: env(safe-area-inset-bottom)) {
  .button-group {
    padding-bottom: calc(12px + env(safe-area-inset-bottom));
  }
  
  .extra-bottom-space {
    padding-bottom: calc(60px + env(safe-area-inset-bottom)) !important;
  }
}

/* 小红书笔记样式 */
.note-text {
  font-size: 16px;
  line-height: 1.8;
  color: #333;
  margin-bottom: 0; /* 彻底移除底部边距 */
  white-space: pre-line;
  word-break: break-word;
  text-align: left;
  overflow-wrap: break-word;
  padding: 0 15px;
}

.note-content {
  margin: 10px 0 0; /* 移除底部边距 */
  padding: 0 10px;
  text-align: left;
  overflow-y: auto;
  animation: fadeIn 0.5s ease;
  height: auto;
}

.note-title {
  font-size: 20px;
  font-weight: bold;
  margin: 15px 0;
  color: #333;
  word-break: break-word;
  text-align: left;
  padding: 0 15px; /* 添加左右内边距 */
}

/* 图片轮播样式 */
.image-slider {
  position: relative;
  width: 100%;
  overflow: hidden; /* 确保超出容器的内容被隐藏 */
  height: auto;
  min-height: 300px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
  background-color: #f0f0f0;
  margin-bottom: 16px;
  touch-action: pan-x !important; /* 修改：允许水平滑动，禁止垂直滑动干扰 */
  display: block; /* 块级元素，确保轮播正常工作 */
  cursor: grab; /* 添加：显示可拖动的光标 */
}

.note-images {
  display: flex;
  transition: transform 0.4s cubic-bezier(0.215, 0.61, 0.355, 1);
  width: 100%;
  height: 100%;
  align-items: center;
  justify-content: flex-start; /* 左对齐确保图片正确排列 */
  touch-action: pan-x; /* 修改：允许水平滑动，禁止垂直滑动干扰 */
  user-select: none; /* 防止文本被选中影响滑动 */
}

.note-images img {
  width: 100%;
  min-width: 100%; /* 添加：确保每张图片都占满整个宽度 */
  flex-shrink: 0; /* 防止图片被压缩 */
  object-fit: contain; /* 确保整个图片都显示，即使会留白 */
  max-height: 100%; /* 确保图片不会超出容器高度 */
  height: auto; /* 自动调整高度以保持宽高比 */
  display: block;
  border-radius: 8px; /* 图片圆角 */
  box-sizing: border-box; /* 确保内边距不会增加总宽度 */
}

/* 轮播指示器容器 */
.slider-dots {
  display: flex;
  justify-content: center;
  align-items: center;
  position: absolute;
  bottom: 15px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2;
  background-color: rgba(0, 0, 0, 0.3); /* 半透明背景 */
  padding: 4px 8px;
  border-radius: 12px;
  backdrop-filter: blur(4px); /* 背景模糊 */
  -webkit-backdrop-filter: blur(4px);
}

.slider-dots span {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  margin: 0 4px;
  transition: all 0.2s ease;
}

.slider-dots span .dot-inner {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.7); /* 更柔和的白色 */
  transition: all 0.2s ease;
}

.slider-dots span.active .dot-inner {
  width: 10px;
  height: 10px;
  background: #fff; /* 激活状态为纯白色 */
  box-shadow: 0 0 5px rgba(255, 255, 255, 0.5); /* 添加发光效果 */
}

/* 左右箭头导航按钮 */
.slider-nav-button {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.85);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #333;
  z-index: 2;
  cursor: pointer;
  opacity: 0.7;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.slider-nav-button:hover {
  opacity: 1;
  background: rgba(255, 255, 255, 0.95);
  transform: translateY(-50%) scale(1.05);
}

.slider-nav-button:active {
  transform: translateY(-50%) scale(0.95);
}

.prev-button {
  left: 15px;
}

.next-button {
  right: 15px;
}

/* 图片计数器 */
.image-counter {
  position: absolute;
  top: 15px;
  right: 15px;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: bold;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}

/* 笔记标题和文本美化 - 移除重复的note-title定义 */

.note-text {
  font-size: 16px;
  line-height: 1.7;
  color: #444;
  padding: 0 10px;
  margin-bottom: 20px;
  word-break: break-word;
}

/* 状态提示徽章样式增强 */
.note-status {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  min-width: 130px;
  max-width: max-content;
  padding: 8px 15px;
  margin-bottom: 0;
  background-color: rgba(76, 175, 80, 0.15);
  border-radius: 8px;
  border: 1px solid rgba(76, 175, 80, 0.35);
  color: #3c8c40;
  font-size: 15px;
  font-weight: 500;
  box-sizing: border-box;
  animation: fadeIn 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.note-status:hover {
  transform: translateY(-1px);
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.08);
}

.status-icon {
  margin-right: 6px;
  font-size: 16px;
  font-weight: bold;
}

.status-text {
  flex: 1;
  white-space: nowrap;
}

/* 警告状态样式改进 */
.note-status.warning {
  background-color: rgba(255, 152, 0, 0.15);
  border: 1px solid rgba(255, 152, 0, 0.35);
  color: #ff7700;
}

/* 修复滚动容器内容被按钮组遮挡的问题 */
.scrollable-container {
  padding-bottom: 70px !important;
}

/* 如果有状态提示，则增加更多底部内边距 */
.button-group:has(.note-status) + .scrollable-container {
  padding-bottom: 120px !important;
}

.wechat-tip {
  margin: 15px 0;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 15px;
  background-color: #f0f9ff;
  border-radius: 8px;
  position: relative;
}

.wechat-tip-icon {
  font-size: 24px;
  margin-bottom: 8px;
}

.wechat-tip-label {
  color: #0077cc;
  border: 1px solid #0077cc;
  border-radius: 8px;
  padding: 12px 16px;
  font-size: 14px;
  line-height: 1.6;
  width: 100%;
  max-width: 300px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 119, 204, 0.15);
  background-color: white;
}

.wechat-tip-arrow {
  position: absolute;
  top: 5px;
  right: 20px;
  animation: bounce 1.5s infinite;
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-10px);
  }
  60% {
    transform: translateY(-5px);
  }
}

.single-button {
  flex: 0 0 auto !important;
  width: 100% !important;
  max-width: 100% !important;
}

/* 添加单按钮样式 */
.share-button:only-child, 
.next-note-button:only-child {
  flex: 0 0 100%;
  max-width: 300px;
}

.share-button:hover, 
.next-note-button:hover {
  background-color: #e6294f;
}

.next-note-button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

/* 如果浏览器不支持:has选择器，使用普通类替代 */
.has-status {
  padding-top: 5px;
}

/* 当存在状态提示时增加底部内边距 */
.button-group:has(.note-status) {
  padding-top: 5px;
}

/* 确保底部有足够的滚动空间 */
.scrollable-container:has(+ .button-group .note-status) {
  padding-bottom: 150px !important; /* 当有状态提示时增加更多底部内边距 */
}

/* 添加小屏幕响应式样式 */
@media screen and (max-width: 380px) {
  /* 在小屏幕上调整按钮尺寸 */
  .share-button, .next-note-button {
    padding: 10px 12px;
    font-size: 14px;
  }
  
  .button-group {
    padding: 10px 10px 12px;
    gap: 8px;
  }
  
  /* 状态提示样式在小屏幕上的调整 */
  .note-status {
    padding: 6px 10px;
    font-size: 13px;
    min-width: 110px;
  }
  
  .buttons-row {
    gap: 8px;
  }
}

/* 当有三个按钮时的布局调整 */
.buttons-row:has(.next-note-button) {
  flex-wrap: wrap;
}

/* 当有下一篇按钮存在时，所有按钮宽度调整 */
.buttons-row:has(.next-note-button) .share-button,
.buttons-row:has(.next-note-button) .next-note-button {
  flex: 1 0 45%;
  margin-bottom: 8px;
}

/* 仅有两个按钮（小红书和抖音）并排时的样式 */
.buttons-row:not(:has(.next-note-button)) .share-button {
  flex: 1;
  max-width: 45%; /* 限制最大宽度 */
}

/* 分享按钮行的特殊布局类 */
.share-buttons-only {
  justify-content: center;
}

.share-buttons-only .share-button {
  flex: 1;
  max-width: 45%;
}

/* 包含下一篇按钮的布局类 */
.has-next-button {
  flex-wrap: wrap;
}

.has-next-button .share-button,
.has-next-button .next-note-button {
  flex: 1 0 45%;
  margin-bottom: 8px;
}

/* 隐藏滚动条 (Chrome/Safari) */
.button-group::-webkit-scrollbar {
  display: none;
}

/* 警告状态样式 */
.note-status.warning {
  background-color: rgba(255, 152, 0, 0.15);
  border: 1px solid rgba(255, 152, 0, 0.35);
  color: #ff7700;
}

/* 错误状态样式 */
.note-status.error {
  background-color: rgba(244, 67, 54, 0.15);
  border: 1px solid rgba(244, 67, 54, 0.35);
  color: #e53935;
}

/* 成功状态样式 */
.note-status.success {
  background-color: rgba(76, 175, 80, 0.15);
  border: 1px solid rgba(76, 175, 80, 0.35);
  color: #3c8c40;
}

/* 抖音下载提示样式 */
.douyin-download-tip {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  z-index: 10000;
  max-width: 90%;
  width: 320px;
  text-align: center;
}

.douyin-download-tip .tip-content {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.douyin-download-tip p {
  margin: 0;
  font-size: 15px;
  color: #333;
  line-height: 1.5;
}

.douyin-download-tip .tip-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
}

.douyin-download-tip .download-btn {
  background-color: #000000;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 10px 15px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}

.douyin-download-tip .copy-btn {
  background-color: #f0f0f0;
  color: #333;
  border: none;
  border-radius: 6px;
  padding: 10px 15px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}

.douyin-download-tip .close-btn {
  background-color: #eeeeee;
  color: #666;
  border: none;
  border-radius: 6px;
  padding: 10px 15px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}

@media screen and (max-width: 480px) {
  /* 在小屏幕上调整按钮尺寸 */
  .share-button, .next-note-button {
    padding: 10px 12px;
    font-size: 14px;
  }
  
  .button-group {
    padding: 10px 10px 12px;
    gap: 8px;
  }
  
  /* 状态提示样式在小屏幕上的调整 */
  .note-status {
    padding: 6px 10px;
    font-size: 13px;
    min-width: min-content; /* 最小宽度为内容宽度 */
    max-width: fit-content; /* 最大宽度适应内容 */
  }
  
  .buttons-row {
    gap: 8px;
  }
  
  /* 状态区域在小屏幕上 */
  .status-area {
    max-width: none; /* 不限制宽度 */
    width: auto;
    padding-right: 5px;
    flex-wrap: wrap; /* 小屏幕上允许换行 */
  }
  
  /* 当只有状态提示没有按钮时，允许状态区域占满宽度 */
  .button-group:has(.status-area):not(:has(.buttons-row)) .status-area,
  .button-group:has(.status-area):has(.buttons-row:empty) .status-area {
    width: 100%;
    justify-content: center;
    padding: 0 5px;
    flex-wrap: wrap; /* 允许换行显示状态 */
    gap: 5px;
  }
  
  /* 只有状态提示时，让状态提示根据内容自适应 */
  .button-group:has(.status-area):not(:has(.buttons-row)) .note-status,
  .button-group:has(.status-area):has(.buttons-row:empty) .note-status {
    margin: 4px;
    flex: 0 1 auto;
    min-width: min-content;
    max-width: fit-content;
    justify-content: center;
  }
  
  /* 在超小屏幕上可能需要调整布局 */
  @media screen and (max-width: 360px) {
    .button-group {
      flex-direction: column;
      align-items: stretch;
      padding: 8px;
    }
    
    .status-area {
      max-width: 100%;
      margin-right: 0;
      margin-bottom: 8px;
      overflow-x: hidden;
      flex-wrap: wrap;
    }
    
    .buttons-row {
      width: 100%;
      justify-content: space-between;
    }
    
    .share-button, .next-note-button {
      flex: 1;
      min-width: 0;
      font-size: 13px;
      padding: 8px;
    }
  }
}

/* 悬浮状态标记样式 */
.floating-status-container {
  position: fixed;
  bottom: 80px; /* 从顶部改为底部，留出空间给底部按钮 */
  right: 15px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  z-index: 900; /* 确保在较高层级 */
}

.floating-status {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  border-radius: 50px; /* 完全圆角 */
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.15);
  animation: floatIn 0.3s ease;
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  max-width: 140px;
  transition: all 0.3s ease;
}

.floating-status:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
}

.floating-status.xhs {
  background-color: rgba(254, 44, 85, 0.85);
  color: white;
}

.floating-status.douyin {
  background-color: rgba(0, 0, 0, 0.75);
  color: white;
}

.floating-status.warning {
  background-color: rgba(255, 152, 0, 0.85);
  color: white;
}

.floating-status.error {
  background-color: rgba(244, 67, 54, 0.85);
  color: white;
}

.floating-status.debug {
  background-color: rgba(33, 150, 243, 0.85);
  color: white;
}

.floating-status .status-icon {
  font-size: 14px;
  margin-right: 6px;
  color: white;
}

.floating-status .status-text {
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  color: white;
}

@keyframes floatIn {
  from { opacity: 0; transform: translateX(20px) translateY(20px); }
  to { opacity: 1; transform: translateX(0) translateY(0); }
}

/* 为按钮留出足够空间 */
.scrollable-container {
  padding-bottom: 120px !important;
}

/* 当有下一篇按钮时增加更多空间 */
.has-next-button {
  justify-content: space-between;
}

/* 分享页面按钮样式 */
.share-button.share-page-button {
  background-color: #4CAF50;
  background-image: linear-gradient(to right, #4CAF50, #81c784);
  flex: 1; /* 平均分配空间 */
}

.share-button.share-page-button:hover {
  background-color: #3b8c3d;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(76, 175, 80, 0.3);
}

/* 桌面端提示弹窗样式 */
.desktop-modal-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.desktop-modal-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}

.desktop-modal {
  position: relative;
  width: 90%;
  max-width: 550px; /* 从500px增加到550px */
  background-color: white;
  border-radius: 16px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  animation: modal-slide-up 0.3s ease-out;
  z-index: 1;
}

@keyframes modal-slide-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.desktop-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
}

.desktop-modal-header h3 {
  margin: 0;
  font-size: 18px;
  color: #333;
}

.desktop-modal-close {
  background: none;
  border: none;
  font-size: 24px;
  color: #999;
  cursor: pointer;
  padding: 0;
  line-height: 1;
}

.desktop-modal-body {
  padding: 20px;
  text-align: center;
}

.desktop-modal-icon {
  font-size: 42px;
  margin-bottom: 10px;
}

.desktop-modal-body h4 {
  margin: 10px 0;
  font-size: 18px;
  color: #333;
}

.desktop-modal-body p {
  margin: 8px 0;
  color: #666;
  font-size: 15px;
}

.desktop-modal-tips {
  font-size: 14px !important;
  color: #888 !important;
  margin-bottom: 15px !important;
}

.desktop-modal-qrcode {
  margin: 20px auto;
  padding: 15px;
  background-color: white;
  border-radius: 8px;
  width: 300px; /* 从250px增加到300px */
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.qrcode-image {
  width: 100%;
  height: auto;
  border-radius: 4px;
}

.qrcode-tip {
  margin-top: 8px !important;
  font-size: 12px !important;
  color: #999 !important;
}

.desktop-modal-actions {
  margin-top: 20px;
}

.desktop-modal-btn {
  padding: 10px 20px;
  border-radius: 50px;
  font-size: 15px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.continue-btn {
  background-color: #f0f0f0;
  color: #333;
}

.continue-btn:hover {
  background-color: #e0e0e0;
}

.debug-panel {
  position: fixed;
  top: 10px;
  right: 10px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  padding: 15px;
  z-index: 1000;
}

.debug-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.debug-close {
  background: none;
  border: none;
  font-size: 24px;
  color: #999;
  cursor: pointer;
}

.debug-content {
  font-size: 14px;
  color: #333;
}

.debug-section {
  margin-bottom: 15px;
}

.debug-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;
}

.debug-label {
  font-weight: bold;
}

.debug-value {
  margin-left: 10px;
}

.debug-actions {
  display: flex;
  justify-content: space-between;
  margin-top: 10px;
}

.debug-btn {
  background-color: #f0f0f0;
  color: #333;
  border: none;
  border-radius: 4px;
  padding: 8px 15px;
  cursor: pointer;
}

.debug-btn:hover {
  background-color: #e0e0e5;
}

/* 调试面板样式 */
.debug-panel {
  position: fixed;
  top: 10px;
  right: 10px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  padding: 15px;
  z-index: 1000;
}

.debug-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.debug-close {
  background: none;
  border: none;
  font-size: 24px;
  color: #999;
  cursor: pointer;
}

.debug-content {
  font-size: 14px;
  color: #333;
}

.debug-section {
  margin-bottom: 15px;
}

.debug-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;
}

.debug-label {
  font-weight: bold;
}

.debug-value {
  margin-left: 10px;
}

.debug-actions {
  display: flex;
  justify-content: space-between;
  margin-top: 10px;
}

.debug-btn {
  padding: 5px 10px;
  font-size: 12px;
  background-color: #f1f1f1;
  color: #333;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  margin: 0 5px;
}

.debug-btn:hover {
  background-color: #e5e5e5;
}

.debug-json {
  white-space: pre-wrap;
  word-break: break-all;
  background-color: #f5f5f5;
  padding: 10px;
  border-radius: 4px;
  font-family: monospace;
  font-size: 12px;
}

/* 移动端控制台样式 */
.mobile-console {
  position: fixed;
  bottom: 180px; /* 修改：从0改为180px，避开底部按钮区域 */
  left: 0;
  right: 0;
  background-color: #1e1e1e;
  color: #fff;
  z-index: 999; /* 修改：从1001降低到999，确保分享按钮可以显示 */
  max-height: 40vh; /* 修改：从60vh改为40vh，减小控制台高度 */
  display: flex;
  flex-direction: column;
  border-top: 2px solid #444;
  box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.3);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  transition: all 0.3s ease;
}

.console-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background-color: #2d2d2d;
  cursor: pointer;
  user-select: none;
  border-bottom: 1px solid #444;
}

.console-header h3 {
  margin: 0;
  font-size: 15px;
  color: #fff;
  display: flex;
  align-items: center;
  font-weight: 500;
}

.badge {
  display: inline-block;
  background-color: #ff5555;
  color: white;
  font-size: 12px;
  border-radius: 12px;
  padding: 2px 8px;
  margin-left: 8px;
}

.console-actions {
  display: flex;
  gap: 8px;
}

.console-clear-btn,
.console-toggle-btn,
.console-filter-btn {
  background-color: #444;
  color: #fff;
  border: none;
  border-radius: 4px;
  padding: 6px 10px;
  font-size: 13px;
  cursor: pointer;
  display: flex;
  align-items: center;
  transition: background-color 0.2s;
}

.console-clear-btn:hover,
.console-toggle-btn:hover,
.console-filter-btn:hover {
  background-color: #555;
}

.filter-active {
  background-color: #3a6b3a;
}

.filter-active:hover {
  background-color: #457945 !important;
}

.filter-badge {
  display: inline-block;
  background-color: #3a6b3a;
  color: white;
  font-size: 11px;
  border-radius: 12px;
  padding: 1px 6px;
  margin-left: 8px;
  opacity: 0.8;
}

.console-logs {
  padding: 0;
  overflow-y: auto;
  max-height: calc(40vh - 48px); /* 修改：从60vh改为40vh，与mobile-console一致 */
  font-family: 'SF Mono', Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
  font-size: 13px;
}

.console-log-entry {
  padding: 10px 16px;
  border-bottom: 1px solid #333;
  position: relative;
  line-height: 1.5;
  word-break: break-all;
  white-space: pre-wrap;
}

.log-header {
  display: flex;
  align-items: center;
  margin-bottom: 4px;
}

.log-type {
  margin-right: 8px;
  font-size: 14px;
}

.log-timestamp {
  color: #aaa;
  font-size: 11px;
  font-style: italic;
}

.log-content {
  color: #e9e9e9;
  margin-left: 24px;
}

.log-error {
  background-color: rgba(255, 0, 0, 0.1);
  border-left: 3px solid #ff5555;
}

.log-error .log-content {
  color: #ff8080;
}

.log-warn {
  background-color: rgba(255, 204, 0, 0.1);
  border-left: 3px solid #ffcc00;
}

.log-warn .log-content {
  color: #ffdd66;
}

.log-info {
  background-color: rgba(0, 153, 255, 0.1);
  border-left: 3px solid #0099ff;
}

.log-info .log-content {
  color: #66bbff;
}

.console-empty {
  padding: 24px 16px;
  text-align: center;
  color: #aaa;
  font-style: italic;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.empty-icon {
  font-size: 28px;
  margin-bottom: 8px;
}

.console-notice {
  background-color: #2a5a8a;
  color: white;
  text-align: center;
  padding: 8px;
  font-size: 14px;
  font-weight: 500;
  border-bottom: 1px solid #444;
  position: sticky;
  top: 0;
  z-index: 2;
}

/* 发布模式提示样式 */
.publish-notice {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
}

.publish-notice-container {
  background-color: rgba(0, 0, 0, 0.05);
  border-radius: 12px;
  padding: 20px;
  max-width: 300px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.publish-notice-icon {
  font-size: 40px;
  margin-bottom: 16px;
}

.publish-notice-text {
  font-size: 16px;
  color: #666;
  line-height: 1.5;
}

/* 弃用按钮样式 */
.discard-button {
  background-color: #808080;
  color: white;
  transition: background-color 0.2s;
}

.discard-button:hover {
  background-color: #666666;
}

/* 弃用状态样式 */
.discarded-note {
  position: relative;
}

.discarded-note::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 0, 0, 0.05);
  pointer-events: none;
  z-index: 10;
}

.discarded-status {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  padding: 8px;
  background-color: rgba(255, 0, 0, 0.8);
  color: white;
  text-align: center;
  font-weight: bold;
  z-index: 50;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
}

.discarded-icon {
  font-size: 20px;
}

.discarded-text {
  font-size: 16px;
}

/* 自定义确认对话框样式 */
.confirm-dialog-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.confirm-dialog-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(2px);
}

.confirm-dialog {
  position: relative;
  width: 80%;
  max-width: 320px;
  background-color: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
  animation: dialogFadeIn 0.2s;
}

.confirm-dialog-header {
  padding: 12px 16px;
  background-color: #f8f8f8;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.confirm-dialog-header h3 {
  margin: 0;
  font-size: 16px;
  color: #333;
}

.confirm-dialog-close {
  background: none;
  border: none;
  font-size: 20px;
  color: #666;
  cursor: pointer;
  padding: 0;
  margin: 0;
}

.confirm-dialog-body {
  padding: 16px;
}

.confirm-dialog-message {
  margin: 0 0 16px;
  color: #333;
  line-height: 1.4;
}

.confirm-dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.confirm-dialog-btn {
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  border: none;
  transition: background-color 0.2s;
}

.confirm-btn {
  background-color: #fe2c55;
  color: white;
}

.confirm-btn:hover {
  background-color: #e6294f;
}

.cancel-btn {
  background-color: #f5f5f5;
  color: #333;
  border: 1px solid #ddd;
}

.cancel-btn:hover {
  background-color: #e8e8e8;
}

@keyframes dialogFadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 添加：响应式调整图片高度 */
@media screen and (max-width: 480px) {
  .image-slider {
    min-height: 250px; /* 小屏幕上减少最小高度 */
  }
  
  .note-images img {
    max-height: 60vh; /* 小屏幕上减少最大高度 */
  }
}

/* 添加：确保图片在轮播中正确显示 */
.image-slider .note-images {
  min-height: 250px; /* 设置最小高度 */
  height: auto; /* 高度自适应内容 */
  display: flex; /* 使用flex布局 */
  width: 100%; /* 宽度100% */
  will-change: transform; /* 优化动画性能 */
  pointer-events: auto; /* 确保可以接收点击事件 */
}

/* 添加：修复图片轮播显示问题 */
.note-images > img {
  flex: 0 0 100%; /* 关键修复：确保每张图片占据整个容器宽度 */
  width: 100%;
  max-width: 100%;
  max-height: 70vh; /* 限制最大高度为视口高度的70% */
  object-position: center; /* 图片居中显示 */
  margin: 0; /* 移除外边距 */
  padding: 0; /* 移除内边距 */
  user-select: none; /* 防止图片被选中 */
  -webkit-user-drag: none; /* 防止Safari中的图片拖拽 */
}

/* 添加：修复轮播滑动体验 */
.image-slider:active {
  cursor: grabbing; /* 鼠标按下时显示抓取中的光标 */
}

/* 添加：确保轮播容器宽度正确 */
.image-slider {
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  z-index: 2; /* 确保轮播控件在顶层 */
}

/* 添加：确保轮播定位正确 */
.note-images {
  width: 100% !important;
  position: relative;
  white-space: nowrap;
  flex-wrap: nowrap; /* 确保图片不会换行显示 */
}
</style>

<style>
html, body {
  margin: 0;
  padding: 0;
  height: 100%;
  overflow-y: auto !important;
  -webkit-overflow-scrolling: touch; /* 增加惯性滚动效果提升移动设备体验 */
  overscroll-behavior-y: contain; /* 防止iOS橡皮筋效果导致的滚动问题 */
}

#app {
  min-height: 100%;
  height: auto;
  overflow-y: auto !important;
  position: relative;
}

/* 确保页面可滚动，移除可能阻止滚动的样式 */
.container, .note-content, body, html {
  touch-action: pan-y !important;
  -ms-touch-action: pan-y !important;
  overscroll-behavior-y: auto;
}

/* 修复移动端滚动问题 */
.scrollable-container {
  -webkit-overflow-scrolling: touch;
  overflow-y: auto;
  overflow-x: hidden;
  height: auto;
  max-height: none !important; /* 防止高度被限制 */
  touch-action: pan-y !important;
  -ms-touch-action: pan-y !important;
  position: relative;
  padding-bottom: 120px !important; /* 确保与底部按钮区域有足够距离 */
}

/* 确保图片区域不影响滚动 */
.image-slider {
  touch-action: pan-y !important;
  -ms-touch-action: pan-y !important;
  position: relative;
  z-index: 1;
  margin-bottom: 15px; /* 增加图片轮播与内容之间的间距 */
}

/* 对图片和轮播元素优化触摸体验 */
.note-images, .note-images img {
  touch-action: pan-y !important; /* 允许垂直滚动 */
  -webkit-touch-callout: none; /* 禁止长按菜单，提升滚动体验 */
}

/* 悬浮状态标记在移动设备上的适配 */
@media screen and (max-width: 480px) {
  .floating-status-container {
    bottom: 70px; /* 在移动端距离底部稍近一些 */
    right: 10px;
    gap: 8px;
  }
  
  .floating-status {
    padding: 6px 10px;
    max-width: 120px;
    font-size: 12px;
  }
  
  .floating-status .status-icon {
    font-size: 12px;
    margin-right: 4px;
  }
  
  .floating-status .status-text {
    font-size: 12px;
  }
}

/* 微信环境弹窗样式 */
.wechat-open-browser .container {
  filter: blur(0.5px);
}

.wechat-open-tip {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  z-index: 9999;
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
  padding: 15px;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.wechat-open-tip .tip-content {
  background-color: white;
  border-radius: 12px;
  padding: 15px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  max-width: 220px;
  position: relative;
  margin-top: 40px;
  margin-right: 20px;
  animation: slideIn 0.3s ease, pulse 2s infinite;
}

@keyframes slideIn {
  from { transform: translateY(-20px); }
  to { transform: translateY(0); }
}

@keyframes pulse {
  0% { box-shadow: 0 0 0 0 rgba(255, 119, 0, 0.7); }
  70% { box-shadow: 0 0 0 10px rgba(255, 119, 0, 0); }
  100% { box-shadow: 0 0 0 0 rgba(255, 119, 0, 0); }
}

.wechat-open-tip .tip-icon {
  font-size: 24px;
  text-align: center;
  margin-bottom: 10px;
}

.wechat-open-tip .tip-text {
  text-align: center;
  font-size: 15px;
  line-height: 1.5;
  color: #333;
}

.wechat-open-tip .tip-close {
  position: absolute;
  top: 5px;
  right: 10px;
  font-size: 20px;
  color: #999;
  cursor: pointer;
}
</style> 