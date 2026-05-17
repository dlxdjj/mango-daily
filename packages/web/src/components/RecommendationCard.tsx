import { useState } from 'react';
import { Copy, Check, RefreshCw, Image as ImageIcon, AlertCircle } from 'lucide-react';
import type { Recommendation } from '../types';
import { mediaUrl } from '../api';

interface Props {
  rec: Recommendation;
  onRegenerate: () => void;
}

export default function RecommendationCard({ rec, onRegenerate }: Props) {
  return (
    <div className="space-y-4 float-in">
      <Section title="今日主题" accent>
        <p className="font-display text-2xl text-mango-text leading-snug">
          {rec.topic}
        </p>
        <div className="flex gap-2 mt-3 flex-wrap">
          <Tag>{rec.recommendedColumn}</Tag>
          <Tag>{rec.contentGoal}</Tag>
          {rec.postingTime && <Tag>{rec.postingTime}</Tag>}
        </div>
        {rec.whyThisWorks && (
          <p className="text-sm text-mango-muted mt-3 leading-relaxed">
            {rec.whyThisWorks}
          </p>
        )}
      </Section>

      <Section title="生成配图">
        {rec.generatedImageUrl ? (
          <>
            <div className="relative rounded-2xl overflow-hidden bg-mango-bg">
              <img
                src={mediaUrl(rec.generatedImageUrl)}
                alt={rec.imageScene}
                className="w-full h-auto object-cover"
              />
            </div>
            {rec.imageScene && (
              <p className="text-sm text-mango-muted mt-2 leading-relaxed">
                {rec.imageScene}
              </p>
            )}
          </>
        ) : (
          <div className="rounded-2xl border-2 border-dashed border-mango-primary/40 bg-mango-bg/50 p-5 text-center">
            <ImageIcon className="mx-auto mb-2 text-mango-muted" size={28} />
            <p className="text-sm text-mango-muted">这次先生成了文案，图片还没画出来</p>
            {rec.imageError && (
              <div className="mt-3 flex gap-2 text-left text-xs text-mango-muted bg-white/60 rounded-xl p-3">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{rec.imageError}</span>
              </div>
            )}
          </div>
        )}

        {rec.imageScene && (
          <div className="mt-3">
            <p className="text-xs text-mango-muted mb-1">画面描述</p>
            <CopyableText text={rec.imageScene} small />
          </div>
        )}
        {rec.imagePrompt && (
          <div className="mt-3">
            <p className="text-xs text-mango-muted mb-1">GPT Image Prompt</p>
            <CopyableText text={rec.imagePrompt} small />
          </div>
        )}
      </Section>

      <Section title="标题候选">
        <div className="space-y-2">
          {rec.titles.map((t, i) => (
            <CopyableText key={i} text={t} />
          ))}
        </div>
      </Section>

      {rec.coverTexts.length > 0 && (
        <Section title="封面文案">
          <div className="space-y-2">
            {rec.coverTexts.map((t, i) => (
              <CopyableText key={i} text={t} />
            ))}
          </div>
        </Section>
      )}

      <Section title="正文草稿">
        <CopyableText text={rec.body} multiline />
      </Section>

      {rec.commentGuide && (
        <Section title="评论区引导">
          <CopyableText text={rec.commentGuide} />
        </Section>
      )}

      {rec.hashtags.length > 0 && (
        <Section title="话题标签">
          <CopyableText text={rec.hashtags.map(h => `#${h}`).join(' ')} />
        </Section>
      )}

      {rec.sourceAnalysis && (
        <p className="text-xs text-mango-muted px-2 leading-relaxed">
          {rec.sourceAnalysis}
        </p>
      )}

      <button
        className="w-full py-3 rounded-button bg-mango-blue text-mango-text font-medium btn-press flex items-center justify-center gap-2"
        onClick={onRegenerate}
      >
        <RefreshCw size={16} />
        再生成一条
      </button>
    </div>
  );
}

function Section({
  title,
  children,
  accent
}: {
  title: string;
  children: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-card p-4 shadow-card ${
        accent
          ? 'bg-gradient-to-br from-mango-primary/30 to-mango-blue/20'
          : 'bg-mango-card'
      }`}
    >
      <div className="text-xs font-medium text-mango-muted uppercase tracking-wider mb-2">
        {title}
      </div>
      {children}
    </div>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-xs px-2.5 py-1 rounded-full bg-white/70 text-mango-text">
      {children}
    </span>
  );
}

function CopyableText({
  text,
  multiline,
  small
}: {
  text: string;
  multiline?: boolean;
  small?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  }

  return (
    <div className="group relative bg-mango-bg/60 rounded-xl p-3 pr-10">
      <p
        className={`${
          multiline ? 'whitespace-pre-wrap' : ''
        } ${small ? 'text-xs font-mono break-words' : 'text-sm'} leading-relaxed text-mango-text`}
      >
        {text}
      </p>
      <button
        onClick={copy}
        className="absolute top-2 right-2 p-2 rounded-lg btn-press text-mango-muted hover:text-mango-text"
        title="复制"
      >
        {copied ? <Check size={16} className="text-mango-success" /> : <Copy size={16} />}
      </button>
    </div>
  );
}
