/**
 * ModelDatabase：模型数据库交互组件（React Island，客户端渲染）。
 *
 * 数据链路：浏览器 → Worker /api/models（D1 实时查询）→ 渲染。
 * 状态机：loading（首屏/请求中）→ error（失败可重试）→ empty（无结果）→ 列表。
 * 交互：搜索（300ms 防抖）+ 价格/名称/上下文排序（全部服务端查询）。
 */
import { useEffect, useState } from 'react';
import type { ModelRecord, ModelSort } from '../../lib/api';
import { fetchModels } from '../../lib/api';
import { LOCALE_LABELS, type Locale } from '../../i18n/locales';

/** 由 Astro 页面从 i18n 字典提取的文案（字符串 props，保证客户端可序列化） */
export interface ModelDatabaseUi {
  searchPlaceholder: string;
  sortLabel: string;
  sortNewest: string;
  sortPriceAsc: string;
  sortPriceDesc: string;
  sortName: string;
  sortContext: string;
  loading: string;
  error: string;
  retry: string;
  empty: string;
  resultCount: string;
  unitLabel: string;
  detailContextWindow: string;
  detailInputPrice: string;
  detailOutputPrice: string;
  filterAll: string;
  filterLabel: string;
}

interface Props {
  lang: Locale;
  ui: ModelDatabaseUi;
}

const SORT_OPTIONS: { value: ModelSort; labelKey: keyof ModelDatabaseUi }[] = [
  { value: 'newest', labelKey: 'sortNewest' },
  { value: 'price_asc', labelKey: 'sortPriceAsc' },
  { value: 'price_desc', labelKey: 'sortPriceDesc' },
  { value: 'name', labelKey: 'sortName' },
  { value: 'context', labelKey: 'sortContext' },
];

export default function ModelDatabase({ lang, ui }: Props) {
  const [models, setModels] = useState<ModelRecord[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sort, setSort] = useState<ModelSort>('newest');
  const [provider, setProvider] = useState<string>('all');
  const [reloadKey, setReloadKey] = useState(0);

  // 搜索防抖（300ms）
  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  // 请求模型列表（search/sort 变化或手动重试时触发）
  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;
    setLoading(true);
    setError(false);
    fetchModels({ lang, search: debouncedSearch || undefined, sort, signal: controller.signal })
      .then((data) => {
        if (!cancelled) {
          setModels(data);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setError(true);
        setLoading(false);
      });
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [lang, debouncedSearch, sort, reloadKey]);

  const formatNumber = (n: number | null): string =>
    n == null ? '—' : n.toLocaleString(lang === 'en' ? 'en-US' : lang);
  const formatPrice = (n: number | null): string => (n == null ? '—' : `$${n.toFixed(2)}`);

  // 供应商维度：从已加载模型提取去重供应商列表（按名称排序）
  const providers = models
    ? Array.from(new Set(models.map((m) => m.providerName))).sort((a, b) => a.localeCompare(b))
    : [];
  const visibleModels =
    models && provider === 'all' ? models : models?.filter((m) => m.providerName === provider) ?? [];

  // ---- 状态渲染：loading / error / empty ----
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
  if (!models || models.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-slate-700 bg-slate-900/60 p-6 text-sm text-slate-400">
        {ui.empty}
      </p>
    );
  }
  if (visibleModels.length === 0) {
    return (
      <div>
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
          <p className="text-xs text-slate-500">{ui.filterLabel}</p>
        </div>
        <p className="rounded-xl border border-dashed border-slate-700 bg-slate-900/60 p-6 text-sm text-slate-400">
          {ui.empty}
        </p>
      </div>
    );
  }

  // ---- 列表 ----
  return (
    <section aria-label="model database">
      {/* 工具栏：搜索 + 排序 */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={ui.searchPlaceholder}
          aria-label={ui.searchPlaceholder}
          className="w-full rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none sm:max-w-xs"
        />
        <label className="flex items-center gap-2 text-sm text-slate-300">
          <span>{ui.sortLabel}</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as ModelSort)}
            className="rounded-full border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-sky-500 focus:outline-none"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {ui[opt.labelKey]}
              </option>
            ))}
          </select>
        </label>
        <p className="text-xs text-slate-500 sm:ml-auto">{ui.resultCount.replace('{count}', String(visibleModels.length))}</p>
      </div>

      {/* 供应商分类维度：chips 筛选（All + 各供应商及数量） */}
      <div className="mb-5">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">{ui.filterLabel}</p>
        <div className="flex flex-wrap gap-2" role="group" aria-label={ui.filterLabel}>
          <button
            type="button"
            onClick={() => setProvider('all')}
            aria-pressed={provider === 'all'}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              provider === 'all'
                ? 'bg-sky-500 text-white'
                : 'border border-slate-700 bg-slate-900 text-slate-300 hover:border-sky-500/60 hover:text-white'
            }`}
          >
            {ui.filterAll} ({models?.length ?? 0})
          </button>
          {providers.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setProvider(provider === p ? 'all' : p)}
              aria-pressed={provider === p}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                provider === p
                  ? 'bg-sky-500 text-white'
                  : 'border border-slate-700 bg-slate-900 text-slate-300 hover:border-sky-500/60 hover:text-white'
              }`}
            >
              {p} ({models?.filter((m) => m.providerName === p).length ?? 0})
            </button>
          ))}
        </div>
      </div>

      {/* 模型卡片网格 */}
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visibleModels.map((m) => (
          <li key={m.slug}>
            <a
              href={`/${lang}/models/${m.slug}/`}
              className="block h-full rounded-xl border border-slate-800 bg-slate-900/60 p-5 transition-colors hover:border-sky-500/60 hover:bg-slate-900"
            >
              <h2 className="text-base font-semibold text-white">{m.name}</h2>
              <p className="mt-0.5 text-xs uppercase tracking-wide text-sky-400">{m.providerName}</p>
              <dl className="mt-4 space-y-1.5 text-sm">
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-500">{ui.detailContextWindow}</dt>
                  <dd className="text-slate-200">{formatNumber(m.contextWindow)}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-500">{ui.detailInputPrice}</dt>
                  <dd className="text-slate-200">
                    {formatPrice(m.inputPrice)}
                    <span className="text-xs text-slate-500">{ui.unitLabel}</span>
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-500">{ui.detailOutputPrice}</dt>
                  <dd className="text-slate-200">
                    {formatPrice(m.outputPrice)}
                    <span className="text-xs text-slate-500">{ui.unitLabel}</span>
                  </dd>
                </div>
              </dl>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
