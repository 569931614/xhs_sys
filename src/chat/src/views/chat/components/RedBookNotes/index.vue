<script setup lang="ts">
import Notes from '../Notes/index.vue';
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';

// 定义组件props
const props = defineProps({
  activityId: {
    type: String,
    default: undefined
  }
});

// 当前活动ID
const activityId = ref<string | undefined>(undefined);
const route = useRoute();

// 获取活动ID，优先从props获取，其次从路由获取
onMounted(() => {
  // 获取活动ID，优先从props获取，否则从路由获取
  if (props.activityId) {
    activityId.value = props.activityId;
  } else if (route.query.activityId) {
    activityId.value = route.query.activityId as string;
  }
});
</script>

<template>
  <div class="redbook-notes-app">
    <Notes :activityId="activityId" />
  </div>
</template>

<style scoped>
.redbook-notes-app {
  min-height: 100vh;
  background-color: #f5f5f5;
  color: #333;
}
</style> 