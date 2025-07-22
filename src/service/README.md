# 数据库字段名称修改

本次修改主要涉及两个表的字段名称变更：

## 1. xiaohongshu_note 表

- 将 `workflowId` 字段改为 `botId`
- 修改了相关的实体类、DTO和服务代码

## 2. coze 表

- 将 `botId` 字段改为 `workflowId`
- 修改了相关的实体类、DTO和服务代码

## 主要修改文件

1. 创建迁移文件：`rename-workflow-bot-id-fields.migration.ts`
2. 修改实体类：
   - `note.entity.ts`
   - `coze.entity.ts`
3. 修改DTO：
   - `note.dto.ts`
   - `coze.dto.ts`
4. 修改服务：
   - `note.service.ts`
   - `coze.service.ts`

## 注意事项

1. 迁移执行后，需要确保应用程序中所有使用这些字段的地方都已更新
2. API接口可能需要调整，以适应新的字段名称
3. 前端代码也需要相应更新

## 执行迁移

执行以下命令运行迁移：

```bash
npm run migration:run
``` 