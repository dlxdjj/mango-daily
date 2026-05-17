# mango-daily（今天发什么）

芒狗 mango 的小红书日更助手：DeepSeek 负责文案，GPT Image 负责基于基准图生成新图。

## 项目结构

```text
mango-daily/
├── packages/
│   ├── server/         # Express + SQLite + DeepSeek + GPT Image
│   └── web/            # React + Vite + PWA
└── package.json        # npm workspace 根
```

## 快速启动

### 1. 安装依赖

```bash
npm install
```

### 2. 配置后端

```bash
cd packages/server
cp .env.example .env
```

编辑 `.env`，至少填写：

```env
DEEPSEEK_API_KEY=sk-your-deepseek-key
OPENAI_API_KEY=sk-your-openai-key
```

可选图片参数：

```env
OPENAI_IMAGE_MODEL=gpt-image-1.5
OPENAI_IMAGE_SIZE=1024x1024
OPENAI_IMAGE_QUALITY=medium
```

如果没有 `OPENAI_API_KEY`，系统仍会生成文案和画面描述，只是不生成图片。

### 3. 启动后端

```bash
cd packages/server
npm run dev
```

后端跑在 `http://localhost:3001`，第一次启动会自动创建 SQLite 数据库 `data.db`。

### 4. 启动前端

新开一个终端：

```bash
cd packages/web
npm run dev
```

前端跑在 `http://localhost:5173`。

## 第一次使用

1. 打开“设置”页，测试后端连接，确认文案和图片模型状态。
2. 打开“基准图”页，上传 3-8 张最标准的芒狗图。
3. 选择一张作为“主图”。后续生成图片会优先参考这张图。
4. 回到首页，选择栏目、内容目标和额外提示。
5. 点击“今天发什么？”，系统会生成文案和一张新芒狗图。

## 当前实现范围

已实现：

- DeepSeek 文案生成：选题、标题、封面文案、正文、评论引导、标签、发布时间、推荐理由
- GPT Image 出图：使用主基准图作为角色参考，生成新场景图
- 基准图上传、列表、设主图、删除
- SQLite 历史推荐记录
- PWA 前端：首页、基准图页、设置页
- 图片生成失败兜底：保留文案、中文画面描述和英文 prompt

暂未实现：

- 浏览器插件同行雷达
- 高赞评论采集
- 自身发布数据反哺
- 多用户系统
- 自动发布到小红书

## 关键 API

```http
GET    /api/health

GET    /api/references
POST   /api/references/upload
PATCH  /api/references/:id
PATCH  /api/references/:id/primary
DELETE /api/references/:id

POST   /api/recommendations/generate
GET    /api/recommendations
GET    /api/recommendations/:id
```

## 构建

```bash
npm run build:server
npm run build:web
```

## 排查问题

前端连不上后端：检查 `CORS_ORIGIN` 是否是 `http://localhost:5173`。

图片不生成：检查 `OPENAI_API_KEY`、`OPENAI_IMAGE_MODEL` 是否可用，并先上传至少一张基准图。

基准图上传失败：默认限制 10MB，只支持 PNG、JPG、WebP。
