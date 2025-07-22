<script setup lang="ts">
import { fetchGetInviteLinkAPI, fetchGetInviteListAPI } from '@/api/invitation';
import { t } from '@/locales';
import { useAuthStore } from '@/store';
import {
  NAvatar,
  NButton,
  NCard,
  NDataTable,
  NInput,
  NLayout,
  NLayoutContent,
  NLayoutHeader,
  NPopover,
  NSpace,
  useDialog,
} from 'naive-ui';
import { h, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import type { InvitationResData } from '@/api/invitation-types';
import defaultAvatar from '@/assets/avatar.png';

const authStore = useAuthStore();
const router = useRouter();
const dialog = useDialog();

// 判断用户是否已登录
const isLogin = ref(authStore.isLogin);
if (!isLogin.value) {
  router.replace('/');
}

interface InviteUser {
  id: number;
  username: string;
  avatar?: string;
  createdAt: string;
  status: number;
}

// 邀请链接
const inviteLink = ref('');
// 邀请用户列表
const inviteList = ref<InviteUser[]>([]);
// 表格加载状态
const loading = ref(true);

// 表格列定义
const columns = [
  {
    title: '用户头像',
    key: 'avatar',
    render: (row: InviteUser) => {
      return h(NAvatar, {
        size: 'small',
        round: true,
        src: row.avatar || defaultAvatar,
      });
    }
  },
  {
    title: '用户名',
    key: 'username',
  },
  {
    title: '注册时间',
    key: 'createdAt',
  },
  {
    title: '账户状态',
    key: 'status',
    render: (row: InviteUser) => {
      return row.status === 1 ? '正常' : '禁用';
    }
  }
];

// 获取邀请链接
async function getInviteLink() {
  try {
    const res = await fetchGetInviteLinkAPI<InvitationResData>();
    if (res.code === 200 && res.success) {
      inviteLink.value = res.data;
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

// 复制邀请链接
function copyInviteLink() {
  if (!inviteLink.value) {
    dialog.error({
      title: '复制失败',
      content: '邀请链接为空',
    });
    return;
  }
  
  navigator.clipboard.writeText(inviteLink.value)
    .then(() => {
      dialog.success({
        title: '复制成功',
        content: '邀请链接已复制到剪贴板！',
      });
    })
    .catch(() => {
      dialog.error({
        title: '复制失败',
        content: '请手动复制: ' + inviteLink.value,
      });
    });
}

// 获取邀请用户列表
async function getInviteList() {
  try {
    loading.value = true;
    const res = await fetchGetInviteListAPI<InvitationResData>();
    if (res.code === 200 && res.success) {
      inviteList.value = res.data || [];
    } else {
      dialog.error({
        title: '获取失败',
        content: res.message || '获取邀请用户列表失败',
      });
    }
  } catch (error) {
    console.error('获取邀请列表错误:', error);
    dialog.error({
      title: '获取失败',
      content: '获取邀请用户列表失败',
    });
  } finally {
    loading.value = false;
  }
}

// 返回聊天页面
function goBack() {
  router.push('/chat');
}

onMounted(() => {
  getInviteLink();
  getInviteList();
});
</script>

<template>
  <NLayout class="h-full">
    <NLayoutHeader bordered class="header-container p-5">
      <div class="flex justify-between items-center">
        <div class="flex items-center">
          <NButton quaternary @click="goBack">
            <template #icon>
              <div class="i-carbon:arrow-left text-xl"></div>
            </template>
          </NButton>
          <h1 class="text-xl font-bold ml-2">我的邀请</h1>
        </div>
      </div>
    </NLayoutHeader>
    
    <NLayoutContent class="p-6">
      <!-- 邀请链接卡片 -->
      <NCard title="我的邀请链接" class="mb-6">
        <div class="flex items-center space-x-4">
          <NInput
            v-model:value="inviteLink"
            readonly
            placeholder="获取邀请链接中..."
            class="flex-1"
          />
          <NButton type="primary" @click="copyInviteLink">
            复制链接
          </NButton>
        </div>
        <div class="mt-4 text-gray-500 text-sm">
          发送此链接给您的朋友，当他们通过此链接注册账户时，会自动成为您邀请的用户。
        </div>
      </NCard>
      
      <!-- 邀请用户列表 -->
      <NCard title="我邀请的用户">
        <NDataTable
          :loading="loading"
          :columns="columns"
          :data="inviteList"
          :bordered="false"
          size="small"
          :single-line="false"
          striped
          empty-text="暂无邀请用户"
        />
      </NCard>
    </NLayoutContent>
  </NLayout>
</template>

<style scoped>
.header-container {
  height: 60px;
  padding: 0 20px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}
</style> 