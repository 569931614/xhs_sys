import type { RouteRecordRaw } from 'vue-router';

function Layout() {
  return import('@/layouts/index.vue');
}

const routes: RouteRecordRaw = {
  path: '/xiaohongshu',
  component: Layout,
  redirect: '/xiaohongshu/promptlib',
  name: 'XiaohongshuMenu',
  meta: {
    title: '小红书工厂',
    icon: 'mdi:notebook-outline',
  },
  children: [
    {
      path: 'promptlib',
      name: 'XiaohongshuPromptLib',
      component: () => import('@/views/xiaohongshu/promptlib.vue'),
      meta: {
        title: '提示词模板库',
        icon: 'mdi:text-box-outline',
      },
    },
    {
      path: 'htmllib',
      name: 'XiaohongshuHtmlLib',
      component: () => import('@/views/xiaohongshu/htmllib.vue'),
      meta: {
        title: 'HTML模板库',
        icon: 'mdi:language-html5',
      },
    },
    {
      path: 'notetype',
      name: 'XiaohongshuNoteType',
      component: () => import('@/views/xiaohongshu/notetype.vue'),
      meta: {
        title: '笔记类型',
        icon: 'mdi:format-list-bulleted-type',
      },
    },
    {
      path: 'notemarket',
      name: 'XiaohongshuNoteMarket',
      component: () => import('@/views/xiaohongshu/notemarket.vue'),
      meta: {
        title: '笔记市场',
        icon: 'mdi:shopping-outline',
      },
    },
    {
      path: 'notetemplate',
      name: 'XiaohongshuNoteTemplate',
      component: () => import('@/views/xiaohongshu/notetemplate.vue'),
      meta: {
        title: '笔记页面模板',
        icon: 'mdi:file-document-outline',
      },
    },
    {
      path: 'font',
      name: 'XiaohongshuFont',
      component: () => import('@/views/xiaohongshu/font.vue'),
      meta: {
        title: '字体管理',
        icon: 'mdi:format-font',
      },
    },
  ],
};

export default routes; 