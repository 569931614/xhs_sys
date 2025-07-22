import path from 'path-browserify'
import { h } from 'vue'
import type { Component } from 'vue'

export function resolveRoutePath(basePath?: string, routePath?: string) {
  return basePath ? path.resolve(basePath, routePath ?? '') : routePath ?? ''
}

// 图标渲染
export function renderIcon(icon: Component) {
  return () => h(icon)
}
