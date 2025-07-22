<script setup lang="ts">
import zhCN from 'element-plus/es/locale/lang/zh-cn.mjs'
import { NDialogProvider, NMessageProvider, NNotificationProvider, zhCN as naiveZhCN } from 'naive-ui'
</script>

<template>
  <NMessageProvider>
    <NDialogProvider>
      <NNotificationProvider>
        <ElConfigProvider :locale="zhCN" :button="{ autoInsertSpace: true }">
          <slot />
        </ElConfigProvider>
      </NNotificationProvider>
    </NDialogProvider>
  </NMessageProvider>
</template>
