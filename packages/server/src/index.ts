import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { z } from 'zod';
import { initDb, getDb, uuid } from './db.js';
import { createLLMProvider } from './llm.js';
import { createImageProvider } from './image.js';
import { getCalendarHint } from './calendar.js';
import { SYSTEM_PROMPT, buildUserPrompt } from './prompts.js';

const PORT = parseInt(process.env.PORT || '3001', 10);
const DB_PATH = process.env.DATABASE_PATH || './data.db';
const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || './uploads');
const SYNC_TOKEN = process.env.SYNC_TOKEN || 'mango-please-change-me';
const CORS_ORIGINS = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

fs.mkdirSync(UPLOAD_DIR, { recursive: true });
fs.mkdirSync(path.join(UPLOAD_DIR, 'references'), { recursive: true });
fs.mkdirSync(path.join(UPLOAD_DIR, 'generated'), { recursive: true });

initDb(DB_PATH);
const db = getDb();

let llmProvider: ReturnType<typeof createLLMProvider> | null = null;
try {
  llmProvider = createLLMProvider();
  console.log('[llm] Provider:', llmProvider.name);
} catch (err: any) {
  console.warn('[llm] Not configured:', err.message);
}

let imageProvider: ReturnType<typeof createImageProvider> | null = null;
try {
  imageProvider = createImageProvider(UPLOAD_DIR);
  console.log('[image] Provider:', imageProvider?.name || 'not-configured');
} catch (err: any) {
  console.warn('[image] Not configured:', err.message);
}

const app = express();
app.use(cors({
  origin(origin, callback) {
    if (!origin || CORS_ORIGINS.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error(`CORS blocked origin: ${origin}`));
  },
  credentials: true
}));
app.use(express.json({ limit: '2mb' }));
app.use('/uploads', express.static(UPLOAD_DIR));

function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  if (token !== SYNC_TOKEN) return res.status(401).json({ error: 'Unauthorized' });
  next();
}

const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (!/^image\/(png|jpe?g|webp)$/.test(file.mimetype)) {
    return cb(new Error('只支持 PNG / JPG / WebP'));
  }
  cb(null, true);
};

const referenceStorage = multer.diskStorage({
  destination: path.join(UPLOAD_DIR, 'references'),
  filename: (_req, file, cb) => cb(null, `${uuid()}${path.extname(file.originalname).toLowerCase()}`)
});

const uploadReference = multer({
  storage: referenceStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter
});

function asReference(row: any) {
  return {
    id: row.id,
    filePath: row.file_path,
    url: `/uploads/${row.file_path}`,
    isPrimary: Boolean(row.is_primary),
    description: row.description || '',
    createdAt: row.created_at
  };
}

function asRecommendation(row: any) {
  return {
    id: row.id,
    date: row.date,
    recommendedColumn: row.recommended_column,
    topic: row.topic,
    contentGoal: row.content_goal,
    titles: JSON.parse(row.titles || '[]'),
    coverTexts: JSON.parse(row.cover_texts || '[]'),
    body: row.body,
    commentGuide: row.comment_guide,
    hashtags: JSON.parse(row.hashtags || '[]'),
    imageScene: row.image_scene || '',
    imagePrompt: row.image_prompt || '',
    generatedImageUrl: row.generated_image_url,
    referenceId: row.reference_id,
    postingTime: row.posting_time,
    whyThisWorks: row.why_this_works,
    sourceAnalysis: row.source_analysis,
    llmProvider: row.llm_provider,
    imageProvider: row.image_provider,
    imageError: row.image_error,
    createdAt: row.created_at
  };
}

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    llmProvider: llmProvider?.name || 'not-configured',
    imageProvider: imageProvider?.name || 'not-configured',
    imageConfigured: Boolean(imageProvider),
    time: new Date().toISOString()
  });
});

app.get('/api/references', (_req, res) => {
  const rows = db.prepare('SELECT * FROM mango_references ORDER BY is_primary DESC, created_at DESC').all();
  res.json((rows as any[]).map(asReference));
});

app.post('/api/references/upload', uploadReference.single('file'), (req, res) => {
  const file = req.file;
  if (!file) return res.status(400).json({ error: '没有上传文件' });

  const id = uuid();
  const hasPrimary = db.prepare('SELECT id FROM mango_references WHERE is_primary = 1 LIMIT 1').get();
  const isPrimary = hasPrimary ? 0 : 1;
  const filePath = `references/${file.filename}`;

  if (isPrimary) {
    db.prepare('UPDATE mango_references SET is_primary = 0').run();
  }

  db.prepare(
    `INSERT INTO mango_references (id, file_path, is_primary, description)
     VALUES (?, ?, ?, ?)`
  ).run(id, filePath, isPrimary, req.body.description || '');

  res.json(asReference(db.prepare('SELECT * FROM mango_references WHERE id = ?').get(id)));
});

app.patch('/api/references/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM mango_references WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: '基准图不存在' });

  const { description } = req.body || {};
  if (description !== undefined) {
    db.prepare('UPDATE mango_references SET description = ? WHERE id = ?').run(description, req.params.id);
  }

  res.json(asReference(db.prepare('SELECT * FROM mango_references WHERE id = ?').get(req.params.id)));
});

app.patch('/api/references/:id/primary', (req, res) => {
  const row = db.prepare('SELECT * FROM mango_references WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: '基准图不存在' });

  db.prepare('UPDATE mango_references SET is_primary = 0').run();
  db.prepare('UPDATE mango_references SET is_primary = 1 WHERE id = ?').run(req.params.id);
  res.json(asReference(db.prepare('SELECT * FROM mango_references WHERE id = ?').get(req.params.id)));
});

app.delete('/api/references/:id', (req, res) => {
  const row: any = db.prepare('SELECT * FROM mango_references WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: '基准图不存在' });

  const fullPath = path.join(UPLOAD_DIR, row.file_path);
  if (fs.existsSync(fullPath)) {
    try { fs.unlinkSync(fullPath); } catch { /* ignore */ }
  }

  db.prepare('DELETE FROM mango_references WHERE id = ?').run(req.params.id);

  const primary = db.prepare('SELECT id FROM mango_references WHERE is_primary = 1 LIMIT 1').get();
  if (!primary) {
    const next: any = db.prepare('SELECT id FROM mango_references ORDER BY created_at DESC LIMIT 1').get();
    if (next) db.prepare('UPDATE mango_references SET is_primary = 1 WHERE id = ?').run(next.id);
  }

  res.json({ success: true });
});

app.post('/api/recommendations/generate', async (req, res) => {
  if (!llmProvider) return res.status(500).json({ error: 'LLM 未配置' });

  const parsed = z.object({
    column: z.string().min(1),
    contentGoal: z.string().min(1),
    extraTheme: z.string().optional()
  }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: '参数错误' });

  const { column, contentGoal, extraTheme } = parsed.data;
  const calendar = getCalendarHint();
  const primaryReference = db.prepare(
    'SELECT * FROM mango_references ORDER BY is_primary DESC, created_at DESC LIMIT 1'
  ).get() as any | undefined;

  const recentTopics = (db.prepare(
    `SELECT topic FROM recommendations
     WHERE date >= date('now','-14 days') AND topic IS NOT NULL
     ORDER BY created_at DESC LIMIT 20`
  ).all() as any[]).map(r => r.topic).filter(Boolean);

  const userPrompt = buildUserPrompt({
    date: calendar.date,
    weekday: calendar.weekday,
    calendarHint: [calendar.weekdayHint, calendar.monthHint].filter(Boolean).join(' / '),
    column,
    contentGoal,
    extraTheme,
    recentTopics,
    primaryReference: primaryReference
      ? { id: primaryReference.id, description: primaryReference.description || '' }
      : null
  });

  try {
    const result = await llmProvider.generateJSON(SYSTEM_PROMPT, userPrompt);
    const id = uuid();
    let generatedImageUrl: string | null = null;
    let imageError = '';

    const referenceRows = db.prepare(
      `SELECT * FROM mango_references
       ORDER BY is_primary DESC,
                CASE WHEN description LIKE '%用户自绘%' THEN 0 ELSE 1 END,
                created_at DESC
       LIMIT 8`
    ).all() as any[];

    if (imageProvider && referenceRows.length > 0) {
      try {
        generatedImageUrl = await imageProvider.generate(
          referenceRows.map(reference => path.join(UPLOAD_DIR, reference.file_path)),
          result.imageScene || '',
          result.imagePrompt || ''
        );
      } catch (err: any) {
        imageError = err?.message || String(err);
        console.warn('[image generate]', imageError);
      }
    } else if (!primaryReference) {
      imageError = '请先上传至少一张芒狗基准图，再生成图片。';
    } else {
      imageError = 'OPENAI_API_KEY 未配置，已先生成文案和画面描述。';
    }

    db.prepare(
      `INSERT INTO recommendations (
        id, recommended_column, topic, content_goal, titles, cover_texts, body,
        comment_guide, hashtags, image_scene, image_prompt, generated_image_url,
        reference_id, posting_time, why_this_works, source_analysis,
        llm_provider, image_provider, image_error
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      result.recommendedColumn || column,
      result.topic || '',
      result.contentGoal || contentGoal,
      JSON.stringify(result.titles || []),
      JSON.stringify(result.coverTexts || []),
      result.body || '',
      result.commentGuide || '',
      JSON.stringify(result.hashtags || []),
      result.imageScene || '',
      result.imagePrompt || '',
      generatedImageUrl,
      primaryReference?.id || null,
      result.postingTime || '',
      result.whyThisWorks || '',
      result.sourceAnalysis || '',
      llmProvider.name,
      imageProvider?.name || null,
      imageError
    );

    const saved = db.prepare('SELECT * FROM recommendations WHERE id = ?').get(id);
    res.json(asRecommendation(saved));
  } catch (err: any) {
    console.error('[generate]', err);
    res.status(500).json({ error: 'LLM 生成失败', detail: err?.message });
  }
});

app.get('/api/recommendations', (_req, res) => {
  const rows = db.prepare('SELECT * FROM recommendations ORDER BY created_at DESC LIMIT 50').all();
  res.json((rows as any[]).map(asRecommendation));
});

app.get('/api/recommendations/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM recommendations WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: '推荐不存在' });
  res.json(asRecommendation(row));
});

app.get('/api/notes', (_req, res) => {
  res.json(db.prepare('SELECT * FROM notes ORDER BY captured_at DESC LIMIT 100').all());
});

app.post('/api/notes', requireAuth, (req, res) => {
  const body = req.body || {};
  const id = uuid();
  try {
    db.prepare(
      `INSERT INTO notes (
        id, note_url, title, author_name, author_url, cover_text, body_summary,
        note_type, publish_time, like_count, collect_count, comment_count,
        image_style_tags, topic_tags, source, extension_version
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      body.noteUrl,
      body.title || '',
      body.authorName || '',
      body.authorUrl || '',
      body.coverText || '',
      body.bodySummary || '',
      body.noteType || 'unknown',
      body.publishTime || null,
      body.likeCount || 0,
      body.collectCount || 0,
      body.commentCount || 0,
      JSON.stringify(body.imageStyleTags || []),
      JSON.stringify(body.topicTags || []),
      body.source || 'manual',
      body.extensionVersion || null
    );
    res.json({ success: true, noteId: id });
  } catch (err: any) {
    res.status(400).json({ error: err?.message });
  }
});

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  res.status(500).json({ error: err?.message || 'Server error' });
});

app.listen(PORT, () => {
  console.log(`[server] http://localhost:${PORT}`);
  console.log(`[server] Image AI: ${imageProvider ? 'configured' : 'not configured'}`);
});
