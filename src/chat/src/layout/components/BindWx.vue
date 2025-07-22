<script setup lang="ts">
import type { ResData } from '@/api/types';
import {
  fetchBindWxBySceneStrAPI,
  fetchGetQRCodeAPI,
  fetchGetQRSceneStrByBindAPI,
} from '@/api/user';
import { useAuthStore, useGlobalStoreWithOut } from '@/store';
import { CloseOutline } from '@vicons/ionicons5';
import type { CountdownInst } from 'naive-ui';
import {
  NCountdown,
  NIcon,
  NImage,
  NModal,
  NSkeleton,
  NSpin,
  useMessage,
} from 'naive-ui';
import { ref } from 'vue';

const props = defineProps<{
  visible: boolean;
}>();

// 定义emit
const emit = defineEmits<{
  (e: 'update:visible', visible: boolean): void;
}>();

const useGlobalStore = useGlobalStoreWithOut();
let timer: any;
const countdownRef = ref<CountdownInst | null>();
const authStore = useAuthStore();
const activeCount = ref(false);
const wxLoginUrl = ref('');
const sceneStr = ref('');
const qrcodeError = ref(false);
const qrcodeLoading = ref(false);

const Nmessage = useMessage();

// 处理关闭对话框
function closeDialog() {
  emit('update:visible', false);
}

async function getSeneStr() {
  qrcodeLoading.value = true;
  qrcodeError.value = false;
  
  try {
  const res: ResData = await fetchGetQRSceneStrByBindAPI();
  if (res.success) {
    sceneStr.value = res.data;
    getQrCodeUrl();
    } else {
      handleQrcodeError('获取场景ID失败');
    }
  } catch (error) {
    console.error('获取场景ID失败:', error);
    handleQrcodeError('获取场景ID失败');
  }
}

async function getQrCodeUrl() {
  try {
    qrcodeLoading.value = true;
    
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
    
  const res: ResData = await fetchGetQRCodeAPI({ sceneStr: sceneStr.value });
  if (res.success) {
    activeCount.value = true;
    wxLoginUrl.value = res.data;
      qrcodeError.value = false;
      qrcodeLoading.value = false;
      
    timer = setInterval(() => {
      bindWxBySnece();
    }, 1000);
    } else {
      handleQrcodeError('获取二维码失败');
    }
  } catch (error: any) {
    handleQrcodeError(`获取二维码失败: ${error?.message || '未知错误'}`);
  }
}

function handleQrcodeError(errorMessage: string) {
  console.error(errorMessage);
  qrcodeError.value = true;
  qrcodeLoading.value = false;
  
  Nmessage.error('获取二维码失败，请稍后重试');
  
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
  
  setTimeout(() => {
    getSeneStr();
  }, 5000);
}

async function bindWxBySnece() {
  if (!sceneStr.value) return;
  const res: ResData = await fetchBindWxBySceneStrAPI({
    sceneStr: sceneStr.value,
  });
  if (res.data) {
    clearInterval(timer);
    const { status, msg } = res.data;
    if (status) Nmessage.success(msg);
    else Nmessage.error(msg);

    authStore.getUserInfo();
    emit('update:visible', false);
  }
}

function handleTimeDown() {
  clearInterval(timer);
  getSeneStr();
  countdownRef.value?.reset();
}

function openDialog() {
  getSeneStr();
}

function handleCloseDialog() {
  clearInterval(timer);
  wxLoginUrl.value = '';
  sceneStr.value = '';
  activeCount.value = false;
}
</script>

<template>
  <NModal
    :show="visible"
    @update:show="(val) => emit('update:visible', val)"
    class="custom-card"
    preset="card"
    style="width: 400px"
    title="绑定微信"
    size="huge"
    :bordered="false"
    segmented
    :on-after-leave="handleCloseDialog"
    :on-after-enter="openDialog"
      >
    <template #header-extra>
      <NIcon size="20" @click="closeDialog">
          <CloseOutline />
        </NIcon>
    </template>

    <div class="flex flex-col items-center justify-center">
      <!-- 显示二维码或错误信息 -->
      <div class="w-[220px] h-[220px] relative">
        <!-- 正常显示二维码 -->
        <NImage
          v-if="wxLoginUrl && !qrcodeError"
          preview-disabled
          class="w-full h-full select-none"
          :src="wxLoginUrl"
        />
        
        <!-- 显示骨架屏 -->
        <NSkeleton 
          v-else-if="qrcodeLoading && !qrcodeError" 
          height="220px" 
          width="220px" 
          animated 
        />
        
        <!-- 显示错误状态 -->
        <div
          v-else-if="qrcodeError"
          class="w-[220px] h-[220px] flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p class="text-sm text-gray-600 dark:text-gray-400 text-center">
            获取二维码失败
          </p>
          <button 
            class="mt-3 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 text-sm"
            @click="getSeneStr"
          >
            重试
          </button>
        </div>
        
        <!-- 默认骨架屏 -->
        <NSkeleton 
          v-else
          height="220px" 
          width="220px" 
          animated 
        />
        
        <!-- 加载中效果 -->
        <NSpin
          v-if="qrcodeLoading && !qrcodeError"
          size="large"
          class="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2"
        />
      </div>

      <div
        class="flex items-center mx-auto mt-4"
        :class="activeCount ? '' : 'opacity-0'"
      >
        <NCountdown
          ref="countdownRef"
          :time="60 * 1000"
          :interval="1000"
          :render="(props) => `${props.seconds}秒后刷新二维码`"
          @finish="handleTimeDown"
        />
      </div>
      <p class="text-gray-500 dark:text-gray-400 mt-3 text-sm text-center">
        使用微信扫一扫绑定账号
      </p>
    </div>
  </NModal>
</template>

