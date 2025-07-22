<script setup lang='ts'>
import { computed } from 'vue'
import { NAvatar, NButton } from 'naive-ui'
import { useAuthStore } from '@/store'
import defaultAvatar from '@/assets/avatar.png'
import { isString } from '@/utils/is'

const authStore = useAuthStore()

const userInfo = computed(() => authStore.userInfo)
const loginComplete = computed(() => authStore.token)

// 处理点击头像事件（只处理未登录状态，登录状态由父组件处理）
function handleClick(event: MouseEvent) {
  event.stopPropagation()
  if (!loginComplete.value) {
    authStore.setLoginDialog(true)
  }
}
</script>

<template>
  <div class="flex items-center overflow-hidden">
    <!-- 头像部分 -->
    <div class="w-10 h-10 overflow-hidden rounded-full shrink-0 cursor-pointer" @click="handleClick">
      <!-- 已有头像 -->
      <template v-if="isString(userInfo.avatar) && userInfo.avatar.length > 0">
        <NAvatar
          size="large"
          round
          :src="userInfo.avatar"
          :fallback-src="defaultAvatar"
        />
      </template>
      <!-- 使用默认头像 -->
      <template v-else>
        <NAvatar size="large" round :src="defaultAvatar" />
      </template>
    </div>
    
    <!-- 用户名称/登录按钮 -->
    <div class="flex-1 min-w-0 ml-2">
      <h2 v-if="loginComplete" class="overflow-hidden font-bold text-md text-ellipsis whitespace-nowrap">
        {{ userInfo.username ?? '未登录' }}
      </h2>
      <NButton v-else text @click.stop="authStore.setLoginDialog(true)">
        登录/注册
      </NButton>
    </div>
  </div>
</template>

<style scoped>
/* 确保下拉菜单正常显示 */
:deep(.n-dropdown-menu) {
  z-index: 9999;
}

/* 阻止点击事件穿透 */
.flex {
  position: relative;
  z-index: 10;
}
</style>
