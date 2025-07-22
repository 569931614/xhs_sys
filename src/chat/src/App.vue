<script setup lang="ts">
import favicon from '@/assets/favicon.ico';
import { NaiveProvider } from '@/components/common';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore, useChatStore, useGlobalStoreWithOut } from '@/store';
import { ClientJS } from 'clientjs';
import { dateZhCN, NConfigProvider, NGlobalStyle, zhCN } from 'naive-ui';
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { ss } from './utils/storage';

const client = new ClientJS();
const chatStore = useChatStore();

// 添加language变量
const language = ref(zhCN);

// Get the client's fingerprint id
const fingerprint = client.getFingerprint();
const authStore = useAuthStore();
const useGlobalStore = useGlobalStoreWithOut();
const router = useRouter();
useGlobalStore.updateFingerprint(Number(fingerprint));
const { theme, lightThemeOverrides, darkThemeOverrides } = useTheme();

const homePath = computed(() => authStore.globalConfig?.clientHomePath);
const faviconPath = computed(
  () => authStore.globalConfig?.clientFavoIconPath || favicon
);
const isAutoOpenNotice = computed(
  () => Number(authStore.globalConfig?.isAutoOpenNotice) === 1
);

async function loadBaiduCode() {
  const baiduCode: any = authStore.globalConfig?.baiduCode || '';
  if (!baiduCode) return;
  const scriptElem = document.createElement('script');
  const escapedCode = baiduCode.replace(
    /<script[\s\S]*?>([\s\S]*?)<\/script>/gi,
    '$1'
  );
  scriptElem.innerHTML = escapedCode;
  document.head.appendChild(scriptElem);
}

function setDocumentTitle() {
  document.title = authStore.globalConfig?.siteName || 'AI';
}

const themeOverrides = computed(() => {
  const config = !theme.value ? lightThemeOverrides : darkThemeOverrides;
  return config;
});

function goHome() {
  homePath.value && router.replace(homePath.value);
}

function noticeInit() {
  const showNotice = ss.get('showNotice');
  if (!showNotice && isAutoOpenNotice.value) {
    useGlobalStore.updateNoticeDialog(true);
  } else {
    if (Date.now() > Number(showNotice) && isAutoOpenNotice.value)
      useGlobalStore.updateNoticeDialog(true);
  }
}

/* 动态设置网站ico svg格式 */
const link = document.createElement('link');
link.rel = 'shortcut icon';
link.href = faviconPath.value;
document.getElementsByTagName('head')[0].appendChild(link);

onMounted(async () => {
  goHome();
  await chatStore.getBaseModelConfig();
  loadBaiduCode();
  setDocumentTitle();
  noticeInit();
});
</script>

<template>
  <NConfigProvider
    class="h-full"
    :theme="theme"
    :theme-overrides="themeOverrides"
    :locale="language"
    :date-locale="dateZhCN"
    preflight-style-disabled
  >
    <NaiveProvider>
      <RouterView />
    </NaiveProvider>
    <NGlobalStyle />
  </NConfigProvider>
</template>
