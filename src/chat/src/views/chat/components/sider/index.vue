<script setup lang="ts">
import logo from '@/assets/logo.png';
import { t } from '@/locales';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/vue';
import {
  Announcement,
  Calendar,
  Commodity,
  DeleteThemes,
  Logout,
  SunOne,
  User,
  Link,
  People,
} from '@icon-park/vue-next';
import type { NumberAnimationInst } from 'naive-ui';
import { 
  NLayoutSider, 
  useDialog, 
  NDataTable, 
  NSpin, 
  NEmpty, 
  NAvatar,
  NTag
} from 'naive-ui';
import type { CSSProperties } from 'vue';
import { computed, ref, watch, onMounted, h } from 'vue';
import { useRouter } from 'vue-router';
import List from './List.vue';
import Plugin from './Plugin.vue';
import App from './App.vue';

import { useBasicLayout } from '@/hooks/useBasicLayout';
import {
  useAppStore,
  useAuthStore,
  useChatStore,
  useGlobalStoreWithOut,
  useAppCatStore,
} from '@/store';
import { fetchGetInviteLinkAPI, fetchGetInviteListAPI } from '@/api/invitation';
import type { InvitationResData } from '@/api/invitation-types';
const useGlobalStore = useGlobalStoreWithOut();

const router = useRouter();
const appStore = useAppStore();
const chatStore = useChatStore();
const authStore = useAuthStore();
const appCatStore = useAppCatStore();
const model3AnimationInstRef = ref<NumberAnimationInst | null>(null);
const model4AnimationInstRef = ref<NumberAnimationInst | null>(null);
const modelMjAnimationInstRef = ref<NumberAnimationInst | null>(null);

// 邀请列表相关
const inviteListLoading = ref(false);
const inviteList = ref<any[]>([]);

const signInStatus = computed(
  () => Number(authStore.globalConfig?.signInStatus) === 1
);
const darkMode = computed(() => appStore.theme === 'dark');
const userBalance = computed(() => authStore.userBalance);
const usingPlugin = computed(() => chatStore.currentPlugin);
const dialog = useDialog();
const oldUse3Token = ref(0);
const newUse3Token = ref(0);
const oldUse4Token = ref(0);
const newUse4Token = ref(0);
const oldUseMjToken = ref(0);
const newUseMjToken = ref(0);
const { isMobile } = useBasicLayout();
const isLogin = computed(() => authStore.isLogin);
const logoPath = computed(() => authStore.globalConfig.clientLogoPath || logo);
const homePage = computed(() => authStore.globalConfig.clientHomePath || '/');
const siteName = authStore.globalConfig?.siteName || 'AIWeb';
const model3Name = computed(
  () => authStore.globalConfig.model3Name || t('chat.ordinaryPoints')
);
const model4Name =
  computed(() => authStore.globalConfig.model4Name) || t('chat.advancedPoints');
const drawMjName =
  computed(() => authStore.globalConfig.drawMjName) || t('chat.drawingPoints');
const pluginFirst = computed(
  () => Number(authStore.globalConfig.pluginFirst) === 1
);
const isHidePlugin = computed(
  () => Number(authStore.globalConfig.isHidePlugin) === 1
);

// const addLoading = ref(false);
const avatar = computed(() => authStore.userInfo.avatar);

const collapsed = computed(() => appStore.siderCollapsed);

const activeSideOption = ref(
  'app' // 默认激活应用选项
);

const globaelConfig = computed(() => authStore.globalConfig);

const isSetBeian = computed(
  () => globaelConfig.value?.companyName && globaelConfig.value?.filingNumber
);

const activeGroupInfo = computed(() => {
  const info = chatStore.groupList.find(
    (item: any) => item.uuid === chatStore.active
  );
  return info;
});

const configObj = computed(() => {
  try {
    return JSON.parse(activeGroupInfo.value?.config || '{}');
  } catch (e) {
    return {}; // 解析失败时返回一个空对象
  }
});

const activeModelDeductType = computed(() => chatStore?.activeModelDeductType);

const displayInfo = computed(() => {
  // 将积分类型固定为1，忽略其他条件
  const deductType = 1;

  let remainingPoints;
  let buttonText;

  // 使用 === 比较以避免类型错误
  if (deductType === 1) {
    remainingPoints = userBalance.value.sumModel3Count || 0;
    buttonText = model3Name.value;
  } else if (deductType === 2) {
    remainingPoints = userBalance.value.sumModel4Count || 0;
    buttonText = model4Name.value;
  } else if (deductType === 3) {
    remainingPoints = userBalance.value.sumDrawMjCount || 0;
    buttonText = drawMjName.value;
  } else {
    remainingPoints = 0;
    buttonText = t('chat.points');
  }

  // 如果 remainingPoints 大于 99999，设置为 "不限" 并将 buttonText 设置为 "次数"
  if (remainingPoints > 99999) {
    remainingPoints = '不限';
    buttonText = '次数';
  }

  return { remainingPoints, buttonText };
});

async function goToUserCenter() {
  // 假设需要检查登录状态或等待某些数据加载
  await checkLogin();
  router.replace({ path: 'user-center' });
}

async function checkLogin() {
  // 检查登录状态的逻辑
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      if (!authStore.isLogin) {
        router.replace({ path: 'login' });
      }
      resolve();
    }, 100);
  });
}

function checkMode() {
  const mode = darkMode.value ? 'light' : 'dark';
  appStore.setTheme(mode);
}

/* 删除全部非置顶聊天 */
async function handleDelGroup() {
  dialog.warning({
    title: t('chat.clearConversation'),
    content: t('chat.clearAllNonFavoriteConversations'),
    positiveText: t('common.confirm'),
    negativeText: t('common.cancel'),
    onPositiveClick: async () => {
      await chatStore.delAllGroup();
      await chatStore.addNewChatGroup();
    },
  });
}

function handleUpdateCollapsed() {
  appStore.setSiderCollapsed(!collapsed.value);
}

function toggleLogin() {
  if (isLogin.value) authStore.logOut();
  else authStore.setLoginDialog(true);
}

function handleSignIn() {
  if (!isLogin.value) {
    authStore.setLoginDialog(true);
    return;
  }
  useGlobalStore.updateSignInDialog(true);
}

function logOut() {
  authStore.logOut();
  router.replace('/');
}

// 处理获取邀请链接
async function handleGetInviteLink() {
  try {
    const res = await fetchGetInviteLinkAPI<InvitationResData>();
    if (res.code === 200 && res.success) {
      const inviteLink = res.data;
      
      // 复制到剪贴板
      navigator.clipboard.writeText(inviteLink)
        .then(() => {
          dialog.success({
            title: '复制成功',
            content: '邀请链接已复制到剪贴板！',
          });
        })
        .catch(() => {
          dialog.error({
            title: '复制失败',
            content: '请手动复制: ' + inviteLink,
          });
        });
    } else {
      dialog.error({
        title: '获取失败',
        content: res.message || '获取邀请链接失败',
      });
    }
  } catch (error) {
    console.error('获取邀请链接错误:', error);
    dialog.error({
      title: '获取失败',
      content: '获取邀请链接失败',
    });
  }
}

// 跳转到邀请列表页面
async function goToInviteList() {
  try {
    inviteListLoading.value = true;
    console.log('正在获取邀请列表...');
    
    const res = await fetchGetInviteListAPI<InvitationResData>();
    console.log('邀请列表API响应:', res);
    
    if (res.code === 200 && res.success) {
      // 确保inviteList.value是数组
      if (Array.isArray(res.data)) {
        inviteList.value = res.data;
      } else if (res.data && typeof res.data === 'object') {
        // 如果数据是嵌套对象，尝试从中提取数组
        if (Array.isArray(res.data.data)) {
          inviteList.value = res.data.data;
        } else {
          // 如果无法获取有效数组，设为空数组
          inviteList.value = [];
          console.warn('邀请列表数据不是数组格式:', res.data);
        }
      } else {
        inviteList.value = [];
        console.warn('无法解析邀请列表数据:', res.data);
      }
      
      console.log('处理后的邀请列表:', inviteList.value);
      
      // 显示简单文本信息而不是表格
      dialog.success({
        title: '我的邀请列表',
        content: () => {
          if (!inviteList.value || inviteList.value.length === 0) {
            return h('div', { class: 'py-4 text-center' }, '暂无邀请记录');
          } else {
            // 使用简单的div显示列表，避免使用DataTable
            return h('div', { class: 'py-2 max-h-[400px] overflow-auto' }, 
              inviteList.value.map((item, index) => {
                return h('div', { 
                  class: 'flex items-center justify-between py-2 px-1 border-b border-gray-100 dark:border-gray-700'
                }, [
                  h('div', { class: 'flex items-center' }, [
                    h(NAvatar, {
                      size: 'small',
                      round: true,
                      src: item.inviteeAvatar || '',
                      fallbackSrc: logo,
                      class: 'mr-2'
                    }),
                    h('span', null, item.inviteeName || '未知用户')
                  ]),
                  h('div', { class: 'text-gray-500 text-sm' }, [
                    item.createdAt ? new Date(item.createdAt).toLocaleString() : '未知时间'
                  ])
                ]);
              })
            );
          }
        },
        positiveText: '关闭',
        onPositiveClick: () => {
          console.log('关闭邀请列表弹窗');
        }
      });
    } else {
      console.error('获取邀请列表失败:', res);
      dialog.error({
        title: '获取失败',
        content: res.message || '获取邀请列表失败',
      });
    }
  } catch (error) {
    console.error('获取邀请列表错误:', error);
    dialog.error({
      title: '获取失败',
      content: '获取邀请列表失败, ' + (error instanceof Error ? error.message : String(error)),
    });
  } finally {
    inviteListLoading.value = false;
  }
}

const getMobileClass = computed<CSSProperties>(() => {
  if (isMobile.value) {
    return {
      position: 'fixed',
      zIndex: 50,
    };
  }
  return {};
});

const mobileSafeArea = computed(() => {
  if (isMobile.value) {
    return {
      paddingBottom: 'env(safe-area-inset-bottom)',
    };
  }
  return {};
});

watch(
  isMobile,
  (val) => {
    appStore.setSiderCollapsed(val);
  },
  {
    immediate: true,
    flush: 'post',
  }
);

watch(
  () => authStore.userBalance.useModel3Token,
  (newVal, oldVal) => {
    oldUse3Token.value = oldVal || 0;
    newUse3Token.value = newVal || 0;
    model3AnimationInstRef.value?.play();
  },
  {
    immediate: true,
    flush: 'post',
  }
);
watch(
  () => authStore.userBalance.useModel4Token,
  (newVal, oldVal) => {
    oldUse4Token.value = oldVal || 0;
    newUse4Token.value = newVal || 0;
    model4AnimationInstRef.value?.play();
  },
  {
    immediate: true,
    flush: 'post',
  }
);

watch(
  () => authStore.userBalance.useDrawMjToken,
  (newVal, oldVal) => {
    oldUseMjToken.value = oldVal || 0;
    newUseMjToken.value = newVal || 0;
    modelMjAnimationInstRef.value?.play();
  },
  {
    immediate: true,
    flush: 'post',
  }
);

// 添加处理侧边栏选项的函数
function handleActiveSideOption(option: string) {
  // 如果当前在嵌入式应用模式，则隐藏应用
  if (appCatStore.showEmbeddedApp) {
    appCatStore.hideApp();
  }
  
  // 设置当前激活的侧边栏选项
  activeSideOption.value = option;
  
  // 如果切换到应用选项，确保加载第一个应用
  if (option === 'app') {
    // 延迟一下，确保App组件已渲染
    setTimeout(() => {
      // 获取第一个应用元素
      const firstAppItem = document.querySelector('.app-item');
      // 如果找到元素，则点击它
      if (firstAppItem) {
        (firstAppItem as HTMLElement).click();
      }
      // 如果没有找到元素，可能是应用列表尚未加载
      else {
        // 直接打开小红书产品工厂应用，这是默认的第一个应用
        appCatStore.showApp({
          id: 'xhs-product-factory-app',
          name: '小红书产品工厂',
          type: 'built-in',
          path: 'xhs-product-factory'
        });
      }
    }, 150);
  }
}

// 组件挂载后，触发应用选项
onMounted(() => {
  // 默认选择应用选项
  handleActiveSideOption('app');
});
</script>

<template>
  <div>
    <NLayoutSider
      :collapsed="collapsed"
      :collapsed-width="0"
      :width="260"
      collapse-mode="transform"
      position="absolute"
      bordered
      :style="getMobileClass"
      @update-collapsed="handleUpdateCollapsed"
    >
      <div
        class="flex flex-col h-full bg-opacity dark:bg-gray-900 select-none"
        :style="mobileSafeArea"
      >
        <main class="flex flex-col h-full flex-1">
          <div
            class="flex bg-opacity w-full justify-between items-center px-4 dark:bg-gray-900 h-14"
          >
            <button
              class="w-full py-1 text-primary-600 dark:text-gray-100 text-lg font-bold flex justify-between"
            >
              <!-- 左边的图标 -->
              <img :src="logoPath" alt="Logo" class="h-7 w-7" />
              <!-- 中间的文字 -->
              <span class="mx-auto">小红书工具</span>
              <!-- 右边占位，使得文字在中间 -->
              <span class="h-7 w-7"></span>
            </button>
          </div>

          <div class="flex-1 min-h-0 overflow-hidden">
            <App />
          </div>

          <div
            class="p-4 pb-1 pt-1 border-t-gray-100 dark:border-t-gray-800 flex items-center justify-between text-left w-full"
          >
            <Menu
              v-if="isLogin"
              as="div"
              class="relative inline-block text-left h-fit"
            >
              <div class="relative">
                <MenuButton
                  class="inline-flex w-full justify-center gap-x-1.5 rounded-md pr-3 py-2 text-sm font-semibold dark:text-gray-400 text-gray-700"
                >
                  <div
                    class="w-8 h-8 mb-2 rounded-full bg-primary-600 flex items-center justify-center overflow-hidden shadow-sm border border-gray-300"
                  >
                    <img
                      v-if="avatar"
                      :src="avatar"
                      class="w-full h-full object-cover"
                    />
                    <User
                      v-if="!avatar"
                      theme="outline"
                      size="20"
                      class="text-white"
                    />
                  </div>
                </MenuButton>
              </div>

              <transition
                enter-active-class="transition ease-out duration-200"
                enter-from-class="transform opacity-0 scale-95"
                enter-to-class="transform opacity-100 scale-100"
                leave-active-class="transition ease-in duration-100"
                leave-from-class="transform opacity-100 scale-100"
                leave-to-class="transform opacity-0 scale-95"
              >
                <MenuItems
                  class="absolute w-[228px] bottom-full mb-2 left-0 origin-bottom-left divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-gray-800 dark:text-gray-400 text-gray-900 z-[9999]"
                >
                  <div class="py-1">
                    <MenuItem v-slot="{ active }">
                      <a
                        href="#"
                        :class="[
                          active ? 'bg-gray-100  dark:bg-gray-700' : '',
                          'group flex items-center justify-start px-2 py-2 text-sm whitespace-nowrap',
                        ]"
                        class="border-b border-b-gray-100 dark:border-b-gray-800"
                        @click="handleDelGroup"
                        ><DeleteThemes theme="outline" size="16" class="mr-2" />
                        {{ t('chat.clear') }}
                      </a>
                    </MenuItem>
                    <MenuItem v-slot="{ active }">
                      <a
                        href="#"
                        :class="[
                          active ? 'bg-gray-100  dark:bg-gray-700' : '',
                          'group flex items-center justify-start px-2 py-2 text-sm whitespace-nowrap',
                        ]"
                        @click="useGlobalStore.updateNoticeDialog(true)"
                        ><Announcement theme="outline" size="16" class="mr-2" />
                        {{ t('chat.announcement') }}
                      </a>
                    </MenuItem>
                    <MenuItem v-slot="{ active }">
                      <a
                        href="#"
                        :class="[
                          active ? 'bg-gray-100  dark:bg-gray-700' : '',
                          'group flex items-center justify-start px-2 py-2 text-sm whitespace-nowrap',
                        ]"
                        @click="useGlobalStore.updateGoodsDialog(true)"
                        ><commodity theme="outline" size="16" class="mr-2" />

                        {{ t('chat.pointsMall') }}
                      </a>
                    </MenuItem>
                    <MenuItem v-slot="{ active }">
                      <a
                        href="#"
                        :class="[
                          active ? 'bg-gray-100  dark:bg-gray-700' : '',
                          'group flex items-center justify-start px-2 py-2 text-sm whitespace-nowrap',
                        ]"
                        @click="checkMode"
                        ><SunOne theme="outline" size="16" class="mr-2" />

                        {{ t('chat.toggleTheme') }}
                      </a>
                    </MenuItem>
                    <MenuItem v-if="signInStatus" v-slot="{ active }">
                      <a
                        href="#"
                        :class="[
                          active ? 'bg-gray-100  dark:bg-gray-700' : '',
                          'group flex items-center justify-start px-2 py-2 text-sm whitespace-nowrap',
                        ]"
                        @click="handleSignIn"
                        ><Calendar theme="outline" size="16" class="mr-2" />
                        {{ t('chat.signInReward') }}
                      </a>
                    </MenuItem>
                    <MenuItem v-slot="{ active }">
                      <a
                        href="#"
                        :class="[
                          active ? 'bg-gray-100  dark:bg-gray-700' : '',
                          'group flex items-center justify-start px-2 py-2 text-sm whitespace-nowrap',
                        ]"
                        @click="handleGetInviteLink"
                        ><Link theme="outline" size="16" class="mr-2" />
                        获取邀请链接
                      </a>
                    </MenuItem>
                    <MenuItem v-slot="{ active }">
                      <a
                        href="javascript:void(0)"
                        :class="[
                          active ? 'bg-gray-100  dark:bg-gray-700' : '',
                          'group flex items-center justify-start px-2 py-2 text-sm whitespace-nowrap',
                        ]"
                        @click.prevent="goToInviteList"
                        :disabled="inviteListLoading"
                      >
                        <NSpin v-if="inviteListLoading" size="small" class="mr-2" />
                        <People v-else theme="outline" size="16" class="mr-2" />
                        我的邀请
                      </a>
                    </MenuItem>
                    <MenuItem v-slot="{ active }">
                      <a
                        href="#"
                        :class="[
                          active ? 'bg-gray-100  dark:bg-gray-700' : '',
                          'group flex items-center justify-start px-2 py-2 text-sm whitespace-nowrap',
                        ]"
                        @click="goToUserCenter()"
                        ><User theme="outline" size="16" class="mr-2" />
                        个人中心
                      </a>
                    </MenuItem>
                    <MenuItem v-slot="{ active }">
                      <a
                        href="#"
                        :class="[
                          active ? 'bg-gray-100  dark:bg-gray-700' : '',
                          'group flex items-center justify-start px-2 py-2 text-sm whitespace-nowrap',
                        ]"
                        @click="logOut()"
                        ><Logout theme="outline" size="16" class="mr-2" />
                        退出登录
                      </a>
                    </MenuItem>
                  </div>
                </MenuItems>
              </transition>
            </Menu>

            <div
              v-if="!isLogin"
              @click="toggleLogin"
              class="flex flex-1 items-center justify-center cursor-pointer"
            >
              <button
                type="button"
                class="inline-flex mb-2 justify-center items-center rounded-md bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-500 shadow-sm ring-1 ring-inset ring-gray-200 dark:ring-gray-800 hover:bg-opacity dark:hover:bg-gray-800 w-full"
              >
                <span>登录 / 注册</span>
              </button>
            </div>

            <div
              v-if="isLogin"
              @click="useGlobalStore.updateGoodsDialog(true)"
              class="flex flex-1 items-center justify-center cursor-pointer"
            >
              <button
                type="button"
                class="inline-flex mb-2 justify-center items-center rounded-md bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-500 shadow-sm ring-1 ring-inset ring-gray-200 dark:ring-gray-800 hover:bg-opacity dark:hover:bg-gray-800 w-full"
              >
                <span>{{ displayInfo.remainingPoints }} ⚡️</span>
              </button>
            </div>
          </div>
          <div
            v-if="isSetBeian && isMobile"
            class="w-full flex justify-center items-center pb-3 text-xs text-gray-500"
          >
            版权所有 © {{ globaelConfig?.companyName }}
            <a
              class="ml-2 transition-all text-gray-500 hover:text-gray-600 dark:hover:text-gray-400"
              href="https://beian.miit.gov.cn"
              target="_blank"
              >{{ globaelConfig?.filingNumber }}</a
            >
          </div>
        </main>
      </div>
    </NLayoutSider>
    <template v-if="isMobile">
      <div
        v-show="!collapsed"
        class="fixed inset-0 z-40 bg-black/40"
        @click="handleUpdateCollapsed"
      />
    </template>
  </div>
</template>

<style scoped>
/* 确保菜单正常显示不闪烁 */
:deep(.headlessui-menu-items) {
  display: block !important;
  pointer-events: auto !important;
  overflow: hidden;
}

/* 调整菜单定位 */
:deep(.relative) {
  position: relative !important;
}

/* 确保菜单显示效果 */
:deep(.headlessui-menu-button) {
  position: relative;
  z-index: 1;
}

/* 菜单项的过渡效果 */
:deep(.transition) {
  transition-property: opacity, transform;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  will-change: opacity, transform;
}

/* 确保菜单组件本身不受影响 */
:deep(.headlessui-menu) {
  position: relative;
  display: inline-block;
}
</style>

