import { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import { api, getSettings, saveSettings } from '../api';

export default function SettingsPage() {
  const [apiBase, setApiBase] = useState('');
  const [syncToken, setSyncToken] = useState('');
  const [saved, setSaved] = useState(false);
  const [healthStatus, setHealthStatus] = useState<'idle' | 'checking' | 'ok' | 'fail'>('idle');
  const [healthDetail, setHealthDetail] = useState('');

  useEffect(() => {
    const s = getSettings();
    setApiBase(s.apiBase);
    setSyncToken(s.syncToken);
  }, []);

  function handleSave() {
    saveSettings({ apiBase: apiBase.trim(), syncToken: syncToken.trim() });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function checkHealth() {
    setHealthStatus('checking');
    setHealthDetail('');
    // 先临时保存当前输入再检查
    saveSettings({ apiBase: apiBase.trim(), syncToken: syncToken.trim() });
    try {
      const result: any = await api.health();
      setHealthStatus('ok');
      setHealthDetail(`文案: ${result.llmProvider} / 图片: ${result.imageProvider}`);
    } catch (err: any) {
      setHealthStatus('fail');
      setHealthDetail(err?.message || '连不上后端');
    }
  }

  return (
    <div className="space-y-5">
      <div className="bg-mango-card rounded-card p-4 shadow-card space-y-4">
        <Field
          label="后端 API 地址"
          hint="开发模式可以留空（走 vite 代理）。部署后填腾讯云后端的 https 域名，例如 https://api.yourdomain.com"
        >
          <input
            value={apiBase}
            onChange={e => setApiBase(e.target.value)}
            placeholder="留空 = 走当前域名"
            className="w-full bg-mango-bg/60 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-mango-primary"
          />
        </Field>

        <Field
          label="同步 Token"
          hint="跟后端 .env 里的 SYNC_TOKEN 保持一致"
        >
          <input
            value={syncToken}
            onChange={e => setSyncToken(e.target.value)}
            className="w-full bg-mango-bg/60 rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-mango-primary"
          />
        </Field>

        <div className="flex gap-2">
          <button
            onClick={handleSave}
            className="flex-1 py-2.5 rounded-button bg-mango-primary text-mango-text font-medium btn-press shadow-soft"
          >
            {saved ? '✓ 已保存' : '保存'}
          </button>
          <button
            onClick={checkHealth}
            disabled={healthStatus === 'checking'}
            className="px-4 py-2.5 rounded-button bg-mango-blue text-mango-text font-medium btn-press flex items-center gap-2"
          >
            <RefreshCw size={16} className={healthStatus === 'checking' ? 'animate-spin' : ''} />
            测试连接
          </button>
        </div>

        {healthStatus !== 'idle' && healthStatus !== 'checking' && (
          <div
            className={`flex items-start gap-2 p-3 rounded-xl text-sm ${
              healthStatus === 'ok'
                ? 'bg-mango-success/30 text-mango-text'
                : 'bg-mango-danger/30 text-mango-text'
            }`}
          >
            {healthStatus === 'ok' ? (
              <CheckCircle2 size={18} className="shrink-0 mt-0.5 text-green-700" />
            ) : (
              <XCircle size={18} className="shrink-0 mt-0.5 text-red-600" />
            )}
            <div>
              <p className="font-medium">
                {healthStatus === 'ok' ? '连上了' : '连不上'}
              </p>
              <p className="text-xs text-mango-muted">{healthDetail}</p>
            </div>
          </div>
        )}
      </div>

      <div className="bg-mango-card rounded-card p-4 shadow-card">
        <p className="text-xs font-medium text-mango-muted uppercase tracking-wider mb-2">关于</p>
        <p className="text-sm leading-relaxed">
          芒狗 mango 的小红书日更助手 v0.1
          <br />
          后端：腾讯云 + DeepSeek
          <br />
          图片：GPT Image
          <br />
          前端：GitHub Pages (PWA)
        </p>
        <p className="text-xs text-mango-muted mt-3 font-hand">
          这个芒今天也在认真营业
        </p>
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  children
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-mango-muted uppercase tracking-wider mb-1">
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-mango-muted mt-1.5 leading-relaxed">{hint}</p>}
    </div>
  );
}
