import { fetchQueryMineAppsAPI } from '@/api/appStore'
import { store } from '@/store'
import { defineStore } from 'pinia'
import type { AppStoreState } from './helper'

export const useAppCatStore = defineStore('app-cat-store', {
  state: (): AppStoreState => ({
    catId: 0,
    mineApps: [],
    activeAppId: 0,
    showEmbeddedApp: false,
    currentEmbeddedApp: null,
  }),

  actions: {
    setCatId(catId: number) {
      this.catId = catId
    },

    async queryMineApps() {
      const res: any = await fetchQueryMineAppsAPI()
      this.mineApps = res?.data?.rows || []
    },

    setActiveApp(appId: number) {
      this.activeAppId = appId
    },

    showApp(app: any) {
      console.log('showApp被调用，传入应用:', app)
      try {
        this.showEmbeddedApp = true
        this.currentEmbeddedApp = app
        console.log('应用已设置，showEmbeddedApp =', this.showEmbeddedApp, 'currentEmbeddedApp =', this.currentEmbeddedApp)
      } catch (error) {
        console.error('设置应用时出错:', error)
      }
    },

    hideApp() {
      this.showEmbeddedApp = false
      this.currentEmbeddedApp = null
    },
  },
})

export function useAppCatStoreWithOut() {
  return useAppCatStore(store)
}
