import { RouteRecordRaw } from 'vue-router';
import Layout from '@/layouts/index.vue';

const routes: RouteRecordRaw = {
  path: '/coze',
  component: Layout,
  redirect: '/coze/list',
  name: 'CozeMenu',
  meta: {
    title: 'Coze机器人',
    icon: 'mdi:robot',
  },
  children: [
    {
      path: 'list',
      name: 'CozeList',
      component: () => import('@/views/coze/list.vue'),
      meta: {
        title: '工作流管理',
        icon: 'mdi:robot-outline',
      },
    },
  ],
};

export default routes; 