import { RouteRecordRaw } from 'vue-router';
import { XhsProductFactory } from '@/views/chat/components';

export default [
  {
    path: '/chat',
    name: 'Chat',
    component: () => import('@/views/chat/chat.vue'),
    meta: {
      title: 'chat',
    },
  },
  {
    path: '/chat/role',
    name: 'Role',
    component: () => import('@/views/chat/role.vue'),
    meta: {
      title: 'role',
    },
  },
  {
    path: '/xhs-notes',
    name: 'XhsNotes',
    component: () => import('@/views/chat/components/Notes/index.vue'),
    meta: {
      title: '小红书笔记',
    },
  },
  {
    path: '/xhs-activities',
    name: 'XhsActivities',
    component: () => import('@/views/chat/components/RedBookActivitiesIndex/index.vue'),
    meta: {
      title: '小红书活动类型',
    },
  },
  {
    path: '/xhs-product-factory',
    name: 'XhsProductFactory',
    component: () => import('@/views/chat/components/XhsProductFactory/index.vue'),
    meta: {
      title: '小红书产品工厂',
    },
  },
] as RouteRecordRaw[]; 