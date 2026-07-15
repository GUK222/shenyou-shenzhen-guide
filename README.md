# 深游 SHENYOU

面向深圳中韩双语导游学习与备课的移动 App。项目把 18 个深圳景点资料整理为讲解词课程，并提供短时练习、双语卡片、学习记录、实地认路和本地备课笔记。

## 主要功能

- 中文和韩文一键切换
- 18 门深圳景点讲解词课程与全文搜索
- 每课学习目标、中文要点、韩文讲解和完成标记
- 知识自测、答案讲解、最佳成绩与双语记忆卡片
- 60 秒讲解复述结构，不录音、不使用语音读报
- 4 条主题学习路径与导游核心能力框架
- 高德、百度地图定位和片区实地认路
- 收藏、学习记录、最近学习和备课笔记
- 支付、交通、深港往返和网络现场工具箱
- PWA 安装、数据导入与导出

项目不包含语音朗读或读报功能。学习进度、收藏、成绩和笔记只保存在当前设备。

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
- 学习目标、能力模型和题库：`app/learning-data.ts`
- 地图组件：`app/CityMap.tsx`
- 图片资源：`public/images/places/`

图片来源和许可信息可在应用设置中的“图片来源与许可”查看。
