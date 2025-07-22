import { type App } from 'vue';
import type { RouteRecordRaw } from 'vue-router';
import { createRouter, createWebHashHistory } from 'vue-router';
import { setupPageGuard } from './permission';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Layout',
    component: () => import('@/layout/index.vue'),
    redirect: '/chat', // 动态设置重定向路径
    children: [
      {
        path: '/home',
        name: 'Home',
        component: () => import('@/views/home/index.vue'),
      },
      {
        path: '/chat',
        name: 'Chat',
        component: () => import('@/views/chat/chat.vue'),
      },
      {
        path: 'user-center',
        name: 'UserCenter',
        component: () => import('@/views/userCenter/index.vue'),
      },
      {
        path: 'invite-list',
        name: 'InviteList',
        component: () => import('@/views/invite/index.vue'),
      },
      // 小红书应用三个子菜单 - 直接使用组件
      {
        path: 'xhs-product-factory',
        name: 'XhsProductFactory',
        component: () => import('@/views/chat/components/XhsProductFactory/index.vue'),
      },
      {
        path: 'xhs-notes',
        name: 'XhsNotes',
        component: () => import('@/views/chat/components/RedBookNotes/index.vue'),
      },
      {
        path: 'xhs-activities',
        name: 'XhsActivities',
        component: () => import('@/views/chat/components/RedBookActivities/index.vue'), // 直接使用RedBookActivities组件而不是索引
      },
      // 添加账号分析路由
      {
        path: 'account-analysis',
        name: 'AccountAnalysis',
        component: () => import('@/views/chat/components/AccountAnalysis/index.vue'),
      },
      // 添加笔记市场路由
      {
        path: 'notes-market',
        name: 'NotesMarket',
        component: () => import('@/views/chat/components/NotesMarket/index.vue'),
      },
      // 添加智能生图路由
      {
        path: 'image-generator',
        name: 'ImageGenerator',
        component: () => import('@/views/chat/components/ImageGenerator/index.vue'),
      },
    ],
  },
  {
    path: '/404',
    name: '404',
    component: () => import('@/views/exception/404/index.vue'),
  },
  {
    path: '/500',
    name: '500',
    component: () => import('@/views/exception/500/index.vue'),
  },
  {
    path: '/xhs-auto-api',
    name: 'XhsAutoApi',
    component: () => import('@/xhs_auto_api/index.vue'),
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'notFound',
    redirect: '/404',
  },
];

export const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior: () => ({ left: 0, top: 0 }),
});

setupPageGuard(router);

export async function setupRouter(app: App) {
  app.use(router);
  await router.isReady();
}
