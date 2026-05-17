import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { api } from '../api';
import { COLUMNS, CONTENT_GOALS, type Recommendation } from '../types';
import RecommendationCard from '../components/RecommendationCard';

export default function HomePage() {
  const [column, setColumn] = useState(COLUMNS[0]);
  const [contentGoal, setContentGoal] = useState(CONTENT_GOALS[0]);
  const [extraTheme, setExtraTheme] = useState('');
  const [loading, setLoading] = useState(false);
  const [rec, setRec] = useState<Recommendation | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    try {
      const result = await api.generateRecommendation({
        column,
        contentGoal,
        extraTheme: extraTheme.trim() || undefined
      });
      setRec(result);
    } catch (err: any) {
      setError(err?.message || '生成失败');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* 配置面板（生成前后都在） */}
      <div className="bg-mango-card rounded-card p-4 shadow-card space-y-4">
        <div>
          <label className="block text-xs font-medium text-mango-muted uppercase tracking-wider mb-2">
            栏目
          </label>
          <div className="flex flex-wrap gap-2">
            {COLUMNS.map(c => (
              <ChipButton
                key={c}
                selected={column === c}
                onClick={() => setColumn(c)}
              >
                {c}
              </ChipButton>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-mango-muted uppercase tracking-wider mb-2">
            内容目标
          </label>
          <div className="flex flex-wrap gap-2">
            {CONTENT_GOALS.map(g => (
              <ChipButton
                key={g}
                selected={contentGoal === g}
                onClick={() => setContentGoal(g)}
              >
                {g}
              </ChipButton>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-mango-muted uppercase tracking-wider mb-2">
            额外提示（可选）
          </label>
          <input
            value={extraTheme}
            onChange={e => setExtraTheme(e.target.value)}
            placeholder="比如：周三、月底、下雨天……"
            className="w-full bg-mango-bg/60 rounded-xl px-3 py-2.5 text-sm placeholder:text-mango-muted/60 focus:outline-none focus:ring-2 focus:ring-mango-primary"
          />
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading}
          className="w-full py-3.5 rounded-button bg-mango-primary text-mango-text font-display text-lg btn-press shadow-soft disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              芒狗正在想<span className="loading-dots"><span>.</span><span>.</span><span>.</span></span>
            </>
          ) : (
            <>
              <Sparkles size={20} />
              今天发什么？
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="bg-mango-danger/20 rounded-card p-4 text-sm text-mango-text">
          <p className="font-medium mb-1">出错了</p>
          <p className="text-mango-muted">{error}</p>
        </div>
      )}

      {rec && !loading && <RecommendationCard rec={rec} onRegenerate={handleGenerate} />}

      {!rec && !loading && !error && (
        <div className="text-center py-12 text-mango-muted text-sm">
          <p className="font-hand text-2xl mb-2">这个芒在等你按下按钮</p>
          <p>选好栏目和目标，点上面那颗黄色按钮就行</p>
        </div>
      )}
    </div>
  );
}

function ChipButton({
  selected,
  onClick,
  children
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`text-sm px-3.5 py-1.5 rounded-full btn-press transition-colors ${
        selected
          ? 'bg-mango-primary text-mango-text shadow-soft'
          : 'bg-mango-bg/60 text-mango-muted'
      }`}
    >
      {children}
    </button>
  );
}
