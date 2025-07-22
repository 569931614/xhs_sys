import { MenuTypeEnum } from '@/constants';
import type { Menu } from '../../router/types';
import { renderIcon } from '@/utils/index';

import { Settings } from '@vicons/ionicons5';
import { Document } from '@vicons/carbon';

const system: Menu = {
  name: 'system',
  path: '/system',
  component: 'LAYOUT',
  meta: {
    title: '系统管理',
    order: 4,
    icon: renderIcon(Settings),
  },
  children: [
    {
      name: 'setting',
      path: 'setting',
      component: '/system/setting/index',
      meta: {
        title: '系统设置',
        icon: renderIcon(Settings),
        type: MenuTypeEnum.Menu,
      },
    },
    {
      name: 'customPage',
      path: 'custom-page',
      component: '/system/custom-page/index',
      meta: {
        title: '自定义页面',
        icon: renderIcon(Document),
        type: MenuTypeEnum.Menu,
      },
    },
  ],
};

export default system; 