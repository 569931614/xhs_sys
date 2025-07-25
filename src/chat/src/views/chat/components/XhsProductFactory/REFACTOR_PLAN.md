# 小红书产品工厂重构计划

## 问题描述

当前的 `index.vue` 文件达到了3000多行，导致以下问题：
1. 代码可维护性差
2. 组件耦合度高
3. 功能分散，难以定位和修改
4. 文件过大，IDE加载缓慢

## 重构策略

采用组件化拆分策略，将单一大组件拆分为多个小组件：

1. 将复杂功能模块拆分为独立组件
2. 将UI部分和逻辑部分分离
3. 集中管理类型定义
4. 重构主组件，使用已拆分的子组件

## 已创建的组件

1. **BrandProductInput.vue** - 品牌产品输入组件
   - 功能：处理品牌产品名称的输入
   - 特点：使用v-model进行双向绑定

2. **TitleManager.vue** - 选题管理组件
   - 功能：管理选题列表，包括添加、编辑、删除选题
   - 特点：支持列表编辑功能

3. **ActivityManager.vue** - 活动管理组件
   - 功能：管理小红书活动，包括创建、选择活动
   - 特点：与API交互，管理活动数据

4. **FileUploader.vue** - 文件上传组件
   - 功能：处理文件上传功能，显示预览等
   - 特点：包含完整的文件上传逻辑

5. **BatchSettings.vue** - 批量设置组件
   - 功能：配置批量生成的数量
   - 特点：简单的数值输入组件

6. **TaskList.vue** - 任务列表组件
   - 功能：显示和管理已创建的任务
   - 特点：自动刷新功能，支持查看笔记详情

7. **StatusNotification.vue** - 状态通知组件
   - 功能：显示操作状态和错误信息
   - 特点：自动消失的通知组件

8. **ModalDialogs.vue** - 模态对话框组件
   - 功能：管理各种模态对话框
   - 特点：集中管理多个弹窗组件

9. **AiTopicGenModal.vue** - AI选题生成弹窗
   - 功能：使用AI生成选题
   - 特点：原有组件，保持不变

## 重构实施步骤

1. 创建 `types.ts` 文件，集中管理类型定义
2. 创建各个子组件
3. 创建新的 `index.vue.new` 文件，整合各个子组件
4. 测试新组件的功能
5. 备份原有 `index.vue` 文件
6. 用新文件替换原文件

## 重构后的优势

1. **可维护性提升**：各组件职责明确，代码量减少
2. **复用性增强**：各组件可在其他场景重用
3. **性能优化**：组件拆分后，更新渲染更高效
4. **代码可读性提高**：各组件代码量减少，结构清晰

## 后续优化方向

1. 进一步拆分复杂组件
2. 引入状态管理，减少props传递
3. 优化API调用方式，集中管理API请求
4. 添加单元测试，确保组件正常工作 