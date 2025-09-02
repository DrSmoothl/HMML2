import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

// 导入页面组件
import Home from '@/views/Home.vue'
import SettingsLayout from '@/views/settings/SettingsLayout.vue'
import MaimaiSettings from '@/views/settings/MaimaiSettings.vue'
import ModelSettings from '@/views/settings/ModelSettings.vue'
import AdapterSettings from '@/views/settings/AdapterSettings.vue'
import ResourceLayout from '@/views/resources/ResourceLayout.vue'
import EmojiManagement from '@/views/resources/EmojiManagement.vue'
import ExpressionManagement from '@/views/resources/ExpressionManagement.vue'
import CharacterManagement from '@/views/resources/CharacterManagement.vue'
import ChatStreamMonitor from '@/views/resources/ChatStreamMonitor.vue'
import PluginMarket from '@/views/PluginMarket.vue'
import About from '@/views/About.vue'
import LauncherSettings from '@/views/LauncherSettings.vue'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: Home,
    meta: {
      title: '首页',
      icon: 'home'
    }
  },
  {
    path: '/settings',
    component: SettingsLayout,
    meta: {
      title: '麦麦设置',
      icon: 'cog-6-tooth'
    },
    children: [
      {
        path: '',
        name: 'Settings',
        redirect: '/settings/maimai'
      },
      {
        path: 'maimai',
        name: 'MaimaiSettings',
        component: MaimaiSettings,
        meta: {
          title: '麦麦本体设置',
          parent: 'Settings'
        }
      },
      {
        path: 'model',
        name: 'ModelSettings',
        component: ModelSettings,
        meta: {
          title: '麦麦模型设置',
          parent: 'Settings'
        }
      },
      {
        path: 'adapter',
        name: 'AdapterSettings',
        component: AdapterSettings,
        meta: {
          title: '麦麦适配器设置',
          parent: 'Settings'
        }
      }
    ]
  },
  {
    path: '/resources',
    component: ResourceLayout,
    meta: {
      title: '麦麦资源管理',
      icon: 'folder'
    },
    children: [
      {
        path: '',
        name: 'Resources',
        redirect: '/resources/emoji'
      },
      {
        path: 'emoji',
        name: 'EmojiManagement',
        component: EmojiManagement,
        meta: {
          title: 'Emoji管理',
          parent: 'Resources'
        }
      },
      {
        path: 'expression',
        name: 'ExpressionManagement',
        component: ExpressionManagement,
        meta: {
          title: '表达方式管理',
          parent: 'Resources'
        }
      },
      {
        path: 'character',
        name: 'CharacterManagement',
        component: CharacterManagement,
        meta: {
          title: '人物信息管理',
          parent: 'Resources'
        }
      },
      {
        path: 'chatstream',
        name: 'ChatStreamMonitor',
        component: ChatStreamMonitor,
        meta: {
          title: '麦麦聊天流监控',
          parent: 'Resources'
        }
      }
    ]
  },
  {
    path: '/plugin-market',
    name: 'PluginMarket',
    component: PluginMarket,
    meta: {
      title: '插件广场',
      icon: 'puzzle'
    }
  },
  {
    path: '/about',
    name: 'About',
    component: About,
    meta: {
      title: '关于',
      icon: 'information-circle'
    }
  },
  {
    path: '/launcher-settings',
    name: 'LauncherSettings',
    component: LauncherSettings,
    meta: {
      title: '启动器设置',
      icon: 'adjustments-horizontal'
    }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFound.vue'),
    meta: {
      title: '页面不存在'
    }
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(_to, _from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

// 路由守卫
router.beforeEach((_to, _from, next) => {
  // 这里可以添加路由守卫逻辑，比如权限检查
  next()
})

export default router
