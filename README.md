# mango-daily（今天发什么）

芒狗 mango 原创 IP 的小红书日更内容助手。输入栏目和内容目标，AI 结合节奏日历、素材库和历史记录，自动生成帖子文案；并可用基准图生成新配图。

## 功能

- **AI 文案生成** — 选择栏目（芒狗诞生录/打工日记等）和内容目标（人设建设/涨粉/收藏等），DeepSeek 生成：选题、5 条标题建议、3 条封面文案、完整正文、评论引导、话题标签、推荐发布时间段
- **节奏日历** — 根据当天星期和月初/月底自动注入情绪提示（周一"低电量不想上班"、周五"解放好运"等），让内容匹配当日氛围
- **AI 配图生成** — 上传基准图后，OpenAI `gpt-image-1.5` 以基准图为角色参考，生成新场景配图
- **基准图管理** — 上传/删除/设为主图，批量上传后可选 AI 视觉分析（Qwen-VL-Max）自动打标签（适合栏目、情绪、场景、描述）
- **历史去重** — 生成时自动排除最近 14 天已生成的主题
- **素材轮换** — 基准图按使用次数升序推荐，避免视觉疲劳
- **PWA 前端** — 移动端优先 UI，暖黄色设计，可添加到手机主屏幕

## 技术栈

- **前端**：React 18 + TypeScript 5 + Vite 5 + Tailwind CSS 3 + React Router + PWA（vite-plugin-pwa）
- **后端**：Express 4 + TypeScript 5 + SQLite（better-sqlite3）+ Zod 校验
- **AI**：DeepSeek（文案生成，OpenAI 兼容接口）+ 阿里云百炼 Qwen-VL-Max（视觉分析打标签）+ OpenAI gpt-image-1.5（配图生成）
- **部署**：PM2 进程管理 + Nginx 反向代理 + Let's Encrypt SSL（腾讯云轻量服务器）

## 项目结构

```
mango-daily/
├── packages/
│   ├── server/                # Express 后端
│   │   ├── src/
│   │   │   ├── index.ts       # 主入口（路由、中间件）
│   │   │   ├── db.ts          # SQLite 数据库初始化和操作
│   │   │   ├── llm.ts         # LLM 提供者工厂（DeepSeek）
│   │   │   ├── image.ts       # 图片生成提供者（OpenAI gpt-image-1.5）
│   │   │   ├── prompts.ts     # 系统提示词和用户提示词构建
│   │   │   └── calendar.ts    # 节奏日历
│   │   └── .env.example
│   └── web/                   # React 前端
│       └── src/
│           ├── pages/
│           │   ├── Home.tsx       # 首页（AI 推荐生成）
│           │   ├── Assets.tsx     # 基准图管理
│           │   └── Settings.tsx   # 设置（后端连接、模型状态）
│           └── api.ts             # API 调用封装
├── deploy/                    # 部署配置（Nginx、启动脚本）
├── ecosystem.config.cjs       # PM2 配置
└── package.json               # npm workspace 根
```

## 本地运行

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

参考 `packages/server/.env.example` 创建 `.env`，填写 LLM 和图片生成的 API Key（DeepSeek 必填，OpenAI 和 Qwen-VL 可选）。

### 3. 启动

```bash
# 后端（端口 3001，首次启动自动创建 SQLite 数据库）
cd packages/server
npm run dev

# 前端（端口 5173，Vite 代理 /api → localhost:3001）
cd packages/web
npm run dev
```

### 4. 首次使用

1. 打开 http://localhost:5173 → 设置页，测试后端连接
2. 基准图页 → 上传 3–8 张芒狗标准图 → 可批量运行 AI 视觉分析打标签
3. 回到首页 → 选择栏目 + 内容目标 → 点击"今天发什么？"

## API

```
GET    /api/health                      # 健康检查（LLM/图片模型状态）
GET    /api/references                  # 基准图列表
POST   /api/references/upload           # 上传基准图（单张）
PATCH  /api/references/:id              # 更新基准图元数据
PATCH  /api/references/:id/primary      # 设为主图
DELETE /api/references/:id              # 删除基准图
POST   /api/recommendations/generate    # 生成 AI 推荐
GET    /api/recommendations             # 推荐历史列表
GET    /api/recommendations/:id         # 推荐详情
GET    /api/notes                       # 笔记列表（小红书内容雷达，预留）
POST   /api/notes                       # 添加笔记（需认证）
```

## 当前实现范围

- DeepSeek 文案生成（选题/标题/正文/标签/发布时间）
- OpenAI gpt-image-1.5 配图生成（以基准图为角色参考）
- 基准图上传、列表、设主图、删除
- Qwen-VL-Max 图片视觉分析打标签（SSE 流式批量处理）
- SQLite 历史记录
- PWA 前端（首页/基准图/设置）

尚未实现：浏览器插件竞品雷达、高赞评论采集、多用户系统、自动发布到小红书。
