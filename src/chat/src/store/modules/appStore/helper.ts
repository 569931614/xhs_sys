export interface MineApp {
  userId: number
  catId: number
  appId: number
  public: boolean
  status: number
  demoData: string
  order: number
  appDes: string
  preset: string
  appRole: string
  coverImg: string
  appName: string
  loading?: boolean
}

export interface AppItem {
  id: number
  name: string
  des: string
  coverImg: string
  type?: string
  path?: string
  component?: string
  params?: any
}

export interface AppStoreState {
  catId: number
  mineApps: MineApp[]
  activeAppId: number
  showEmbeddedApp: boolean
  currentEmbeddedApp: AppItem | null
}
