# 小红书产品工厂PRO版组件

本组件已经拆分为多个模块文件，以便于维护和扩展。

## 文件结构

- `types.ts`: 包含所有类型定义
- `utils.ts`: 通用工具函数
- `api.ts`: API调用函数封装
- `styles.css`: 公共样式文件
- `components/`: 组件目录
  - `FileUploader.vue`: 文件上传组件
  - `TopicManager.vue`: 选题管理组件
  - `TaskItem.vue`: 单个任务组件
  - `TaskBatchGroup.vue`: 批量任务组组件
  - `TaskList.vue`: 任务列表组件
  - `ModalDialogs.vue`: 模态对话框组件
- `MainComponent.vue`: 主组件，需要完成

## 使用方法

完成 `MainComponent.vue` 的编写，组装各个子组件。主要逻辑包括：

1. 引入所有子组件和工具/API函数
2. 定义状态变量
3. 实现生命周期钩子(onMounted, onUnmounted)
4. 处理主要的业务逻辑
5. 完成模板组装

## 如何整合

`MainComponent.vue` 需要做的工作:

- 导入和使用 `api.ts` 中的API函数
- 管理主要状态数据（表单数据、任务列表等）
- 将各子组件整合到模板中
- 实现子组件间的通信和状态同步

完成后，通过 `index.js` 导出主组件供其他地方使用。 