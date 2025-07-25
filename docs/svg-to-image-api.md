# SVG转图片API文档

## 接口概述

新增的 SVG 转图片接口可以将 SVG 内容转换为图片格式（PNG/JPEG），并自动上传到 Super 图床，返回图片链接。

## 接口信息

- **URL**: `POST /html-render/svg-to-image`
- **Content-Type**: `application/json`

## 请求参数

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| svgContent | string | 是 | - | SVG内容字符串 |
| width | number | 否 | 从SVG提取或800 | 输出图片宽度（像素） |
| height | number | 否 | 从SVG提取或600 | 输出图片高度（像素） |
| quality | number | 否 | 80 | 图片质量(1-100) |
| type | string | 否 | 'png' | 图片类型：'jpeg' 或 'png' |
| uploadToSuperbed | boolean | 否 | true | 是否上传到Super图床 |
| devicePixelRatio | number | 否 | 1 | 设备像素比，用于高清显示 |

## 请求示例

### 简单SVG示例

```json
{
  "svgContent": "<svg width=\"100\" height=\"100\"><circle cx=\"50\" cy=\"50\" r=\"40\" stroke=\"black\" stroke-width=\"3\" fill=\"red\" /></svg>",
  "width": 800,
  "height": 600,
  "type": "png",
  "quality": 80,
  "uploadToSuperbed": true
}
```

### 复杂SVG示例

```json
{
  "svgContent": "<svg viewBox=\"0 0 200 200\" xmlns=\"http://www.w3.org/2000/svg\"><rect x=\"10\" y=\"10\" width=\"180\" height=\"180\" fill=\"lightblue\" stroke=\"navy\" stroke-width=\"2\"/><text x=\"100\" y=\"100\" text-anchor=\"middle\" font-family=\"Arial\" font-size=\"16\" fill=\"navy\">Hello SVG</text></svg>",
  "width": 1200,
  "height": 1200,
  "type": "png",
  "quality": 90,
  "uploadToSuperbed": true,
  "devicePixelRatio": 2
}
```

## 响应格式

### 成功响应

```json
{
  "success": true,
  "message": "SVG转换成功",
  "data": {
    "fileName": "svg_abc123def456.png",
    "url": "/uploads/html-images/svg_abc123def456.png",
    "superImageUrl": "https://pic1.superbed.cn/item/abc123def456.png",
    "localPath": "/path/to/uploads/html-images/svg_abc123def456.png"
  }
}
```

### 错误响应

```json
{
  "success": false,
  "message": "无效的SVG内容，必须包含<svg>标签"
}
```

## 功能特性

1. **智能尺寸检测**: 如果未指定宽高，会自动从SVG的width、height属性或viewBox中提取尺寸
2. **高清支持**: 支持设备像素比设置，可生成高清图片
3. **多格式支持**: 支持PNG和JPEG两种输出格式
4. **自动上传**: 默认自动上传到Super图床并返回外链
5. **本地备份**: 同时保存本地文件作为备份

## 使用场景

- 将动态生成的SVG图表转换为图片
- SVG图标转换为位图格式
- 需要在不支持SVG的环境中使用矢量图
- 生成社交媒体分享图片

## 注意事项

1. SVG内容必须是有效的SVG格式，包含`<svg>`标签
2. 建议指定明确的宽高以获得最佳效果
3. 设备像素比大于1时会生成更高分辨率的图片
4. Super图床上传失败时仍会返回本地URL

## 错误码说明

- `400`: 参数错误（如SVG内容无效）
- `500`: 服务器内部错误（如转换失败、上传失败等）

## cURL 示例

```bash
curl -X POST "http://localhost:3000/html-render/svg-to-image" \
  -H "Content-Type: application/json" \
  -d '{
    "svgContent": "<svg width=\"200\" height=\"200\"><rect x=\"10\" y=\"10\" width=\"180\" height=\"180\" fill=\"blue\"/></svg>",
    "width": 800,
    "height": 800,
    "type": "png",
    "quality": 90
  }'
```
