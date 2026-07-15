# 深游 SHENYOU

面向深圳自由行游客的中韩双语移动导览。项目包含 18 个深圳景点的中文与韩文资料、互动地图、主题路线、个人行程、收藏、到访记录和本地备注。

## 主要功能

- 中文和韩文一键切换
- 18 个深圳景点全文搜索与分类筛选
- 真实深圳图片、开放信息、交通方式、游览建议和附近推荐
- OpenStreetMap 互动地图和景点标记
- 4 条主题路线与一键生成行程
- 行程排序、预计移动时间和分享
- 收藏、到访、最近浏览和个人备注
- 韩国游客支付、交通、深港往返和网络准备
- PWA 安装、数据导入与导出

项目不包含语音朗读或读报功能。收藏、备注和行程数据只保存在当前设备。

## 本地运行

需要 Node.js 22.13 或更高版本。

```bash
npm install
npm run dev:local
```

浏览器打开 `http://127.0.0.1:3001/`。

## 检查与构建

```bash
npm run lint
npm test
npm run build:pages
```

- `npm run lint` 检查代码规范。
- `npm test` 构建应用并验证深圳数据、中韩内容、PWA 和功能外壳。
- `npm run build:pages` 生成可部署到 GitHub Pages 的 `dist-pages/`。

## 内容维护

- 景点基础资料：`app/data.ts`
- 中韩长篇解说：`app/bilingual-data.json`
- 交通、开放信息、图片和旅行工具：`app/travel-data.ts`
- 地图组件：`app/CityMap.tsx`
- 图片资源：`public/images/places/`

图片来源和许可信息可在应用设置中的“图片来源与许可”查看。
