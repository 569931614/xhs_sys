<script setup lang="ts">
import type { ResData } from '@/api/types';
import {
  fetchGetQRCodeAPI,
  fetchGetQRSceneStrAPI,
  fetchLoginBySceneStrAPI,
} from '@/api/user';
import { useBasicLayout } from '@/hooks/useBasicLayout';
import { t } from '@/locales';
import { useAuthStore, useGlobalStoreWithOut } from '@/store';
import { CountdownInst, NImage, NSkeleton, NSpin, useMessage } from 'naive-ui';
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
// import Send from './send.vue';
// let timer: any;
const timer = ref();
const countdownTimer = ref();
const retryCount = ref(0);  // 添加重试计数
const maxRetries = 3;       // 最大重试次数
const qrcodeError = ref(false); // 添加二维码错误状态
const qrcodeLoading = ref(false); // 添加二维码加载状态

interface Emit {
  (ev: 'changeLoginType', val: string): void;
}
const emit = defineEmits<Emit>();

const wxLoginUrl = ref('');
const sceneStr = ref('');
const activeCount = ref(false);
const Nmessage = useMessage();
const authStore = useAuthStore();
const countdownRef = ref<CountdownInst | null>();
const { isMobile } = useBasicLayout();
const phoneLoginStatus = computed(
  () => Number(authStore.globalConfig.phoneLoginStatus) === 1
);
// 使用 ref 来管理全局参数的状态
const agreedToUserAgreement = ref(true); // 读取初始状态并转换为布尔类型
const useGlobalStore = useGlobalStoreWithOut();

// 点击"用户协议及隐私政策"时，自动同意
function handleClick() {
  agreedToUserAgreement.value = true; // 设置为同意
  useGlobalStore.updateUserAgreementDialog(true);
}
const globalConfig = computed(() => authStore.globalConfig);

const emailLoginStatus = computed(
  () => Number(authStore.globalConfig.emailLoginStatus) === 1
);

const loginTypeText = computed(() => {
  if (emailLoginStatus.value && phoneLoginStatus.value) {
    return t('login.emailPhone');
  } else if (emailLoginStatus.value) {
    return t('login.email');
  } else if (phoneLoginStatus.value) {
    return t('login.phone');
  }
});

function loadImage(src: string) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function getSeneStr() {
  const params = {};
  qrcodeLoading.value = true; // 设置加载状态
  qrcodeError.value = false; // 重置错误状态
  
  try {
  const res: ResData = await fetchGetQRSceneStrAPI(params);
  if (res.success) {
    sceneStr.value = res.data;
    getQrCodeUrl();
    } else {
      qrcodeError.value = true; // 获取sceneStr失败
      qrcodeLoading.value = false; // 结束加载状态
      setTimeout(() => getSeneStr(), 5000); // 5秒后重试
    }
  } catch (error) {
    console.error('获取场景ID失败:', error);
    qrcodeError.value = true; // 获取sceneStr失败
    qrcodeLoading.value = false; // 结束加载状态
    setTimeout(() => getSeneStr(), 5000); // 5秒后重试
  }
}

async function loginBySnece() {
  if (!sceneStr.value) return;
  
  try {
    const res: ResData = await fetchLoginBySceneStrAPI({
      sceneStr: sceneStr.value,
    });
    
    // 重置重试计数
    retryCount.value = 0;
    
    if (res.data) {
      // 登录成功，清除定时器
      if (timer.value) {
        clearInterval(timer.value);
        timer.value = null;
      }
      Nmessage.success(t('login.loginSuccess'));
      authStore.setToken(res.data);
      authStore.getUserInfo();
      authStore.setLoginDialog(false);
    }
  } catch (error) {
    // 请求失败时增加重试计数
    retryCount.value++;
    
    // 如果超过最大重试次数，暂停轮询一段时间后恢复
    if (retryCount.value >= maxRetries) {
      // 确保清除现有定时器
      if (timer.value) {
        clearInterval(timer.value);
        timer.value = null;
      }
      
      console.error('轮询请求失败次数过多，暂停轮询');
      
      // 5秒后重新启动轮询
      setTimeout(() => {
        retryCount.value = 0;
        
        // 确保只创建一个新的定时器
        if (!timer.value) {
          timer.value = setInterval(() => {
            loginBySnece();
          }, 1000);
        }
      }, 5000);
    }
  }
}

async function getQrCodeUrl() {
  try {
    qrcodeLoading.value = true; // 设置加载状态
    
    // 在获取新二维码前清除现有定时器
    if (timer.value) {
      clearInterval(timer.value);
      timer.value = null;
    }
    
    const res: ResData = await fetchGetQRCodeAPI({ sceneStr: sceneStr.value });
    if (res.success) {
      activeCount.value = true;
      await loadImage(res.data);
      wxLoginUrl.value = res.data;
      qrcodeError.value = false; // 重置错误状态
      qrcodeLoading.value = false; // 结束加载状态
      
      // 设置新的定时器，确保只有一个轮询定时器
      timer.value = setInterval(() => {
        loginBySnece();
      }, 3000);
    } else {
      handleQrCodeError('获取二维码失败，服务器返回错误');
    }
  } catch (error: any) {
    handleQrCodeError(`获取二维码失败: ${error?.message || '未知错误'}`);
  }
}

// 处理二维码错误的函数
function handleQrCodeError(errorMessage: string) {
  console.error(errorMessage);
  qrcodeError.value = true; // 标记为错误状态
  qrcodeLoading.value = false; // 结束加载状态
  
  // 显示更友好的错误消息
    Nmessage.error(t('login.qrcodeError'));
  
    // 清除可能存在的定时器
    if (timer.value) {
      clearInterval(timer.value);
      timer.value = null;
    }
  
    // 5秒后重试获取二维码
    setTimeout(() => {
      getSeneStr();
    }, 5000);
}

function handleTimeDown() {
  // 确保在获取新的二维码前清除当前的轮询定时器
  if (timer.value) {
    clearInterval(timer.value);
    timer.value = null;
  }
  getSeneStr();
  countdownRef.value?.reset();
}

onMounted(() => {
  // 确保只有一个倒计时定时器
  if (countdownTimer.value) {
    clearInterval(countdownTimer.value);
  }
  
  // 初始获取二维码
  handleTimeDown();
  
  // 设置60秒刷新二维码的定时器
  countdownTimer.value = setInterval(handleTimeDown, 60000);
});

onBeforeUnmount(() => {
  // 清除所有定时器
  if (timer.value) {
    clearInterval(timer.value);
    timer.value = null;
  }
  
  if (countdownTimer.value) {
    clearInterval(countdownTimer.value);
    countdownTimer.value = null;
  }
  
  // 清除可能存在的任何其他定时器
  const timeoutIds = window.setTimeout(function() {}, 0);
  for (let i = timeoutIds - 10; i <= timeoutIds; i++) {
    window.clearTimeout(i);
  }
});
</script>

<template>
  <div
    class="w-full h-full flex flex-col items-center"
    :class="isMobile ? 'px-10 py-10' : ' py-10'"
  >
    <!-- <div class="text-[#374151] dark:text-white font-bold text-[20px] mt-[50px]">

    </div> -->
    <div class="sm:mx-auto sm:w-full sm:max-w-sm">
      <h2
        class="pt-5 pb-10 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900 dark:text-gray-300"
      >
        {{ t('login.wechatLogin') }}
      </h2>
    </div>

    <!-- 显示二维码或错误信息 -->
    <div class="w-[220px] h-[220px] relative">
      <!-- 正常显示二维码 -->
    <NImage
      v-if="
        wxLoginUrl &&
          !qrcodeError &&
        (agreedToUserAgreement || globalConfig.isAutoOpenAgreement !== '1')
      "
      preview-disabled
      class="w-[220px] h-[220px] select-none"
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
          {{ t('login.qrcodeError') }}
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
      v-if="globalConfig.isAutoOpenAgreement === '1'"
      class="flex items-center justify-between mt-5"
    >
      <div class="flex items-center">
        <input
          v-model="agreedToUserAgreement"
          type="checkbox"
          class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
        />
        <p class="ml-1 text-center text-sm text-gray-500 dark:text-gray-400">
          扫码登录及代表同意
          <a
            href="#"
            class="font-semibold leading-6 text-primary-600 hover:text-primary-500 dark:text-primary-500 dark:hover:text-primary-600"
            @click="handleClick"
            >《{{ globalConfig.agreementTitle }}》</a
          >
        </p>
      </div>
    </div>
    <p
      v-if="emailLoginStatus || phoneLoginStatus"
      class="mt-3 mb-5 text-center text-sm text-gray-500 dark:text-gray-400"
    >
      {{ t('login.wechatScanFailed') }}
      <a
        href="#"
        class="font-semibold leading-6 text-primary-600 hover:text-primary-500 dark:text-primary-500 dark:hover:text-primary-600"
        @click="emit('changeLoginType', 'email')"
        >{{ loginTypeText }}</a
      >
    </p>
    <p
      v-else
      class="mt-10 mb-5 text-center text-sm text-gray-500 dark:text-gray-400"
    >
      {{ t('login.useWechatScan') }}
    </p>

    <!-- <p class="mt-10 text-center text-sm text-gray-500">
      登录即代表同意
      {{ ' ' }}
      <a
        href="#"
        class="font-semibold leading-6 text-indigo-600 hover:text-indigo-500"
        >用户协议</a
      >
    </p> -->
  </div>
</template>

<style>
.wechat-shadow {
  box-shadow: 0px 8px 10px 1px rgba(0, 0, 0, 0.1608);
}
</style>
