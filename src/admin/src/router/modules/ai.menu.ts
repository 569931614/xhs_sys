import { RouteRecordRaw } from 'vue-router';
import Layout from '@/layouts/index.vue';

const routes: RouteRecordRaw = {
  path: '/ai',
  component: Layout,
  redirect: '/ai/chat-key-list',
  name: 'AiMenu',
  meta: {
    title: '模型管理',
    icon: 'hugeicons:ai-book',
  },
  children: [
    {
      path: 'model',
      name: 'AiMenuInterface',
      component: () => import('@/views/models/interface.vue'),
      meta: {
        title: '全局配置',
        icon: 'tabler:box-model',
      },
    },
    {
      path: 'keys',
      name: 'AiMenuKeys',
      component: () => import('@/views/models/key.vue'),
      meta: { title: '模型设置', icon: 'ph:open-ai-logo-light' },
    },
    {
      path: 'coze',
      name: 'AiMenuCoze',
      component: () => import('@/views/models/coze.vue'),
      meta: { title: 'Coze配置', icon: 'solar:bot-1-outline' },
    },
  ],
};

export default routes; 