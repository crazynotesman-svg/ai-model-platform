/**
 * NewsFeed：AI 资讯列表（客户端 fetch Worker /api/news → D1）。
 *
 * - 分类筛选（chips：全部 + 6 类，服务端筛选）；
 * - 语言显示（每条新闻的语言 badge）；
 * - 三态：loading / error(重试) / empty；
 * - 条目仅展示标题/摘要/来源/时间 + 原文链接（不复制全文）；
 * - 移动端适配（卡片堆叠、chips 横向滚动）。
 */
import { useEffect, useState } from 'react';
import { API_BASE } from '../../lib/api';
import type { Locale } from '../../i18n/locales';

export interface NewsRecord {
  id: number;
  title: string;
  content: string | null;
  language: string;
  source: string;
  link: string | null;
  category: string;
  publishedAt: string | null;
}

export interface NewsFeedUi {
  categoryLabel: string;
  allCategories: string;
  categoryModelRelease: string;
  categoryProduct: string;
  categoryResearch: string;
  categoryOpenSource: string;
  categoryBusiness: string;
  categoryGeneral: string;
  readOriginal: string;
  loading: string;
  error: string;
  retry: string;
  empty: string;
}

interface Props {
  lang: Locale;
  ui: NewsFeedUi;
}

const CATEGORIES = [
  'model-release',
  'product',
  'research',
  'open-source',
  'business',
  'general',
] as const;

export default function NewsFeed({ lang, ui }: Props) {
  const [news, setNews] = useState<NewsRecord[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [category, setCategory] = useState<string>('all');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;
    setLoading(true);
    setError(false);
    const params = new URLSearchParams({ lang });
    if (category !== 'all') params.set('category', category);
    fetch(`${API_BASE}/api/news?${params.toString()}`, { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error(`API ${res.status}`);
        const data = (await res.json()) as { news: NewsRecord[] };
        if (!cancelled) {
          setNews(data.news);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError(true);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [lang, category, reloadKey]);

  const fmtDate = (iso: string | null): string => {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString(lang, { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const categoryLabel = (c: string): string => {
    const map: Record<string, string> = {
      'model-release': ui.categoryModelRelease,
      product: ui.categoryProduct,
      research: ui.categoryResearch,
      'open-source': ui.categoryOpenSource,
      business: ui.categoryBusiness,
      general: ui.categoryGeneral,
    };
    return map[c] ?? c;
  };

  // ---- 三态 ----
  if (loading) {
    return (
      <p role="status" className="animate-pulse rounded-xl border border-slate-800 bg-slate-900/60 p-6 text-sm text-slate-400">
        {ui.loading}
      </p>
    );
  }
  if (error) {
    return (
      <div className="rounded-xl border border-red-900/50 bg-red-950/30 p-6 text-center text-sm text-red-300">
        <p>{ui.error}</p>
        <button
          type="button"
          onClick={() => setReloadKey((k) => k + 1)}
          className="mt-3 rounded-full bg-sky-500 px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-sky-400"
        >
          {ui.retry}
        </button>
      </div>
    );
  }
  if (!news || news.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-slate-700 bg-slate-900/60 p-6 text-sm text-slate-400">
        {ui.empty}
      </p>
    );
  }

  // ---- 列表 ----
  return (
    <section aria-label="AI news">
      {/* 分类筛选 */}
      <div className="mb-4 flex items-center gap-2 overflow-x-auto pb-1">
        <span className="shrink-0 text-xs uppercase tracking-wide text-slate-500">
          {ui.categoryLabel}
        </span>
        <div className="flex shrink-0 flex-wrap gap-1.5">
          {(['all', ...CATEGORIES] as const).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              aria-pressed={category === c}
              className={
                'whitespace-nowrap rounded-full border px-3 py-1 text-xs font-medium transition-colors ' +
                (category === c
                  ? 'border-sky-500 bg-sky-500/15 text-sky-300'
                  : 'border-slate-700 bg-slate-900 text-slate-400 hover:border-slate-500 hover:text-slate-200')
              }
            >
              {c === 'all' ? ui.allCategories : categoryLabel(c)}
            </button>
          ))}
        </div>
      </div>

      {/* 新闻卡片 */}
      <ul className="space-y-3">
        {news.map((n) => (
          <li key={n.id} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 sm:p-5">
            <div className="flex flex-wrap items-center gap-2 text-[11px]">
              <span className="font-medium uppercase tracking-wide text-sky-400">{n.source}</span>
              <span className="rounded-full bg-slate-800 px-2 py-0.5 text-slate-400">
                {categoryLabel(n.category)}
              </span>
              <span className="rounded-full border border-slate-700 px-2 py-0.5 uppercase text-slate-500">
                {n.language}
              </span>
              {n.publishedAt && <time className="text-slate-500">{fmtDate(n.publishedAt)}</time>}
            </div>
            <h2 className="mt-2 text-base font-semibold text-white">{n.title}</h2>
            {n.content && <p className="mt-1.5 text-sm leading-relaxed text-slate-400">{n.content}</p>}
            {n.link && (
              <a
                href={n.link}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="mt-2 inline-block text-xs font-medium text-sky-400 transition-colors hover:text-sky-300"
              >
                {ui.readOriginal} →
              </a>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
