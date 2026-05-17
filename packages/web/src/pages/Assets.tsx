import { useEffect, useState } from 'react';
import { CheckCircle2, Plus, Star, Trash2 } from 'lucide-react';
import { api, mediaUrl } from '../api';
import type { MangoReference } from '../types';

export default function AssetsPage() {
  const [references, setReferences] = useState<MangoReference[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [description, setDescription] = useState('');

  async function load() {
    setLoading(true);
    try {
      setReferences(await api.listReferences());
      setError('');
    } catch (err: any) {
      setError(err?.message || '加载失败');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleUpload(file: File | null) {
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('description', description.trim());
      await api.uploadReference(form);
      setDescription('');
      await load();
    } catch (err: any) {
      setError(err?.message || '上传失败');
    } finally {
      setUploading(false);
    }
  }

  async function setPrimary(id: string) {
    await api.setPrimaryReference(id);
    await load();
  }

  async function remove(id: string) {
    if (!confirm('确定删除这张基准图吗？')) return;
    await api.deleteReference(id);
    await load();
  }

  return (
    <div className="space-y-4">
      <div className="bg-mango-card rounded-card p-4 shadow-card space-y-3">
        <p className="text-sm text-mango-muted leading-relaxed">
          上传 3-8 张最标准的芒狗图，系统会优先用主基准图生成新场景。基准图越统一，IP 越稳。
        </p>
        <input
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="描述这张基准图，比如：正面微笑、戴眼镜、好运黄底"
          className="w-full bg-mango-bg/60 rounded-xl px-3 py-2.5 text-sm placeholder:text-mango-muted/60 focus:outline-none focus:ring-2 focus:ring-mango-primary"
        />
        <label className="w-full py-3 rounded-button bg-mango-primary text-mango-text font-medium btn-press shadow-soft flex items-center justify-center gap-2 cursor-pointer">
          <Plus size={18} />
          {uploading ? '上传中...' : '上传基准图'}
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            disabled={uploading}
            onChange={e => handleUpload(e.target.files?.[0] || null)}
          />
        </label>
      </div>

      {error && (
        <div className="bg-mango-danger/20 rounded-card p-4 text-sm text-mango-text">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-mango-muted text-sm">加载中...</div>
      ) : references.length === 0 ? (
        <div className="text-center py-12">
          <p className="font-hand text-2xl text-mango-muted mb-2">还没有基准图</p>
          <p className="text-sm text-mango-muted">先上传一张最像“标准芒狗”的图。</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {references.map(ref => (
            <div key={ref.id} className="rounded-card overflow-hidden bg-mango-card shadow-card">
              <div className="relative aspect-square bg-mango-bg">
                <img
                  src={mediaUrl(ref.url)}
                  alt={ref.description}
                  className="w-full h-full object-cover"
                />
                {ref.isPrimary && (
                  <div className="absolute top-2 left-2 text-xs bg-mango-primary text-mango-text rounded-full px-2 py-1 flex items-center gap-1">
                    <CheckCircle2 size={13} />
                    主图
                  </div>
                )}
              </div>
              <div className="p-3 space-y-2">
                <p className="text-xs text-mango-muted line-clamp-2 min-h-[2rem]">
                  {ref.description || '未填写描述'}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPrimary(ref.id)}
                    disabled={ref.isPrimary}
                    className="flex-1 py-2 rounded-xl bg-mango-bg text-mango-text text-xs btn-press disabled:opacity-50 flex items-center justify-center gap-1"
                  >
                    <Star size={14} />
                    设主图
                  </button>
                  <button
                    onClick={() => remove(ref.id)}
                    className="px-3 py-2 rounded-xl bg-mango-danger/20 text-mango-text btn-press"
                    title="删除"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
