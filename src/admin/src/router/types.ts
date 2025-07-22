import type { RouteRecordRaw } from 'vue-router'
import { MenuTypeEnum } from '@/constants'

export interface Meta {
  title: string
  icon?: string | Function
  badge?: number
  type?: MenuTypeEnum
  keepAlive?: boolean
  hidden?: boolean
  href?: string
  frameSrc?: string
  target?: '_blank' | '_self' | '_parent' | '_top'
  hiddenHeaderContent?: boolean
  hideHeader?: boolean
  hideFooter?: boolean
  hideNav?: boolean
  order?: number
}

export interface Menu {
  name: string
  path: string
  component?: any
  meta?: Meta
  children?: Menu[]
  redirect?: string
} 